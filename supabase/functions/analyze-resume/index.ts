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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeUrl, candidateName, category } = await req.json();
    
    console.log('Analyzing resume for:', candidateName, 'Category:', category);

    // Fetch the resume PDF to verify it exists
    const resumeResponse = await fetch(resumeUrl);
    if (!resumeResponse.ok) {
      throw new Error('Failed to fetch resume');
    }

    // Call Lovable AI API
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
            content: `You are an expert technical recruiter analyzing a resume for a ${category} position.

I will provide you with a resume PDF. Please analyze it and provide:

1. An overall score (0-100) based on:
   - Technical skills relevance (30%)
   - Experience quality and relevance (30%)
   - Education and certifications (15%)
   - Projects and achievements (15%)
   - Resume presentation and clarity (10%)

2. Top 3-4 strengths (brief bullet points)
3. Top 3-4 areas for improvement (brief bullet points)
4. A concise 2-3 sentence summary

The resume is available at: ${resumeUrl}

Respond ONLY with valid JSON in this exact format:
{
  "score": 85,
  "strengths": ["Strong technical skills", "Relevant experience"],
  "improvements": ["Add more metrics", "Include certifications"],
  "summary": "Strong candidate with relevant experience."
}`
          }
        ],
        max_tokens: 1000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse the JSON response
    const analysis: ResumeAnalysis = JSON.parse(content);
    
    console.log('Analysis complete:', analysis.score);

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
        summary: 'Unable to analyze resume at this time.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
