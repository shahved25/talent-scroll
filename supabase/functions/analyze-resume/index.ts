import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  summary: string;
  detailedSummary: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeUrl, candidateName, category, candidateId } = await req.json();
    
    console.log('Analyzing resume for:', candidateName, 'Category:', category);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch the resume PDF
    const resumeResponse = await fetch(resumeUrl);
    if (!resumeResponse.ok) {
      throw new Error('Failed to fetch resume');
    }
    
    const resumeBlob = await resumeResponse.blob();
    const resumeBuffer = await resumeBlob.arrayBuffer();
    
    // Convert to base64 in chunks to avoid stack overflow
    console.log('Converting PDF to base64...');
    const uint8Array = new Uint8Array(resumeBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const resumeBase64 = btoa(binaryString);
    console.log('PDF converted, size:', resumeBase64.length);

    // Use Lovable AI with Gemini Flash for PDF vision analysis
    console.log('Sending to Lovable AI for analysis...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert technical recruiter analyzing a resume for a ${category} position.

Analyze this resume and provide a comprehensive evaluation:

CANDIDATE: ${candidateName}
POSITION: ${category}

Provide:
1. An overall score (0-100) based on:
   - Technical skills relevance (30%)
   - Experience quality and relevance (30%)
   - Education and certifications (15%)
   - Projects and achievements (15%)
   - Resume presentation and clarity (10%)

2. Top 3-4 key strengths (specific bullet points)
3. Top 3-4 areas for improvement (actionable bullet points)
4. A concise 2-3 sentence summary
5. A detailed summary in exactly 3-4 bullet points that covers:
   - Key strengths/pros (be specific and concise)
   - Main concerns/cons (be constructive)
   - Overall fit for the role

Respond ONLY with valid JSON in this exact format:
{
  "score": 85,
  "strengths": ["Strong technical skills", "Relevant experience"],
  "improvements": ["Add more metrics", "Include certifications"],
  "summary": "Strong candidate with relevant experience.",
  "detailedSummary": "• 5+ years backend experience with Node.js/Python and strong microservices architecture at major tech companies\n• Excellent database optimization skills and active open-source contributor\n• Limited cloud platform experience beyond AWS and lacks quantifiable achievement metrics\n• Strong technical fit for senior roles, may need support in cloud technologies"
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${resumeBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    console.log('AI response received');
    
    // Strip markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '');
      jsonContent = jsonContent.replace(/\n?```$/, '');
    }
    
    // Parse the JSON response
    const analysis: ResumeAnalysis = JSON.parse(jsonContent.trim());
    
    console.log('Analysis complete, score:', analysis.score);

    // Update candidate record with resume score and summary
    if (candidateId) {
      console.log('Updating database with score and summary:', analysis.score);
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ 
          resume_score: analysis.score,
          summary: analysis.detailedSummary 
        })
        .eq('id', candidateId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }
      
      console.log('Resume score and summary saved successfully');
      
      // Check if video analysis is complete before calculating final score
      const { data: candidateCheck } = await supabase
        .from('candidates')
        .select('video_score, category_id')
        .eq('id', candidateId)
        .single();

      // Only calculate final score if both analyses are complete
      if (candidateCheck?.video_score) {
        console.log('Both analyses complete, triggering final score calculation...');
        try {
          const finalScoreResponse = await fetch(`${supabaseUrl}/functions/v1/calculate-final-score`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              candidateId,
              category
            })
          });

          if (finalScoreResponse.ok) {
            console.log('Final score calculation completed successfully');
          } else {
            console.error('Final score calculation failed:', await finalScoreResponse.text());
          }
        } catch (finalScoreError) {
          console.error('Error triggering final score calculation:', finalScoreError);
        }
      } else {
        console.log('Video analysis not yet complete, skipping final score calculation');
      }
    }

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error analyzing resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        score: 0,
        strengths: [],
        improvements: [],
        summary: 'Unable to analyze resume at this time.',
        detailedSummary: 'Unable to analyze resume at this time.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
