import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoAnalysis {
  score: number;
  communication_skills: number;
  confidence: number;
  clarity: number;
  professionalism: number;
  english_proficiency: number;
  key_points: string[];
  red_flags: string[];
  summary: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcription, candidateId, candidateName, category } = await req.json();
    
    console.log('Analyzing video for candidate:', candidateName);

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    // Call Groq API for intelligent video analysis
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert HR recruiter evaluating candidate video interviews for ${category} positions.`
          },
          {
            role: 'user',
            content: `Analyze this video interview transcription and provide detailed insights:

TRANSCRIPTION:
${transcription}

Provide a comprehensive analysis with:

1. Overall video score (0-100) based on:
   - Communication skills (clarity, articulation)
   - Confidence and presence
   - Professionalism
   - Content relevance to ${category} role
   - Body language indicators (if mentioned)

2. Individual scores (0-100) for:
   - communication_skills
   - confidence
   - clarity
   - professionalism
   - english_proficiency (English language assessment based on grammar accuracy, vocabulary diversity, fluency, professional language use, coherence, sentence structure, appropriate tense usage, and minimal filler words)

3. Key strengths/points (3-5 bullet points)
4. Any red flags or concerns (if any)
5. A concise 2-3 sentence summary

Respond ONLY with valid JSON in this exact format:
{
  "score": 85,
  "communication_skills": 88,
  "confidence": 82,
  "clarity": 90,
  "professionalism": 85,
  "english_proficiency": 87,
  "key_points": ["Strong technical communication", "Clear problem-solving approach"],
  "red_flags": ["Mentioned lacking experience in X"],
  "summary": "Strong candidate with excellent communication skills."
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Groq AI error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Strip markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '');
      jsonContent = jsonContent.replace(/\n?```$/, '');
    }
    
    const analysis: VideoAnalysis = JSON.parse(jsonContent.trim());
    
    console.log('Video analysis complete:', analysis.score);

    // Update candidate with video analysis score and English proficiency
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('candidates')
      .update({ 
        video_score: analysis.score,
        english_proficiency: analysis.english_proficiency
      })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    console.log('Video score saved, triggering final score calculation...');
    
    // Check if resume analysis is complete before calculating final score
    const { data: candidateCheck } = await supabase
      .from('candidates')
      .select('resume_score, category_id')
      .eq('id', candidateId)
      .single();

    // Only calculate final score if both analyses are complete
    if (candidateCheck?.resume_score) {
      try {
        // Get category name
        const { data: categoryData } = await supabase
          .from('categories')
          .select('name')
          .eq('id', candidateCheck.category_id)
          .single();

        const finalScoreResponse = await fetch(`${supabaseUrl}/functions/v1/calculate-final-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            candidateId,
            category: categoryData?.name || 'General'
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
      console.log('Resume analysis not yet complete, skipping final score calculation');
    }

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error analyzing video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        score: 0,
        communication_skills: 0,
        confidence: 0,
        clarity: 0,
        professionalism: 0,
        english_proficiency: 0,
        key_points: [],
        red_flags: [],
        summary: 'Unable to analyze video at this time.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
