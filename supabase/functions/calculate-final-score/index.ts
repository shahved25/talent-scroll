import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinalScoreAnalysis {
  final_score: number;
  resume_score: number;
  video_score: number;
  overall_assessment: string;
  hiring_recommendation: string;
  key_strengths: string[];
  areas_of_concern: string[];
  fit_analysis: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateId, category } = await req.json();
    
    console.log('Calculating final score for candidate:', candidateId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch candidate data
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('name, resume_score, video_score, transcription, skill_tags')
      .eq('id', candidateId)
      .single();

    if (fetchError || !candidate) {
      throw new Error('Failed to fetch candidate data');
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    // Use Groq AI for comprehensive analysis
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
            content: `You are a senior hiring manager making final candidate assessments for ${category} positions.`
          },
          {
            role: 'user',
            content: `Provide a comprehensive final evaluation for this candidate:

CANDIDATE: ${candidate.name}
POSITION: ${category}
RESUME SCORE: ${candidate.resume_score || 'N/A'}/100
VIDEO INTERVIEW SCORE: ${candidate.video_score || 'N/A'}/100
SKILLS: ${candidate.skill_tags?.join(', ') || 'N/A'}
INTERVIEW TRANSCRIPT: ${candidate.transcription || 'N/A'}

Provide:
1. A weighted final score (0-100) considering:
   - Resume quality (40% weight)
   - Video interview performance (40% weight)
   - Skill-role fit (20% weight)

2. Overall assessment (2-3 sentences)
3. Hiring recommendation (Strongly Recommend / Recommend / Consider / Do Not Recommend)
4. Top 3-5 key strengths
5. Top 2-3 areas of concern (if any)
6. Fit analysis for ${category} role (2-3 sentences)

Respond ONLY with valid JSON in this exact format:
{
  "final_score": 87,
  "resume_score": ${candidate.resume_score || 0},
  "video_score": ${candidate.video_score || 0},
  "overall_assessment": "Strong technical candidate with excellent communication.",
  "hiring_recommendation": "Strongly Recommend",
  "key_strengths": ["Strong technical skills", "Excellent communication", "Relevant experience"],
  "areas_of_concern": ["Limited experience in X", "Could improve Y"],
  "fit_analysis": "Excellent fit for the ${category} role based on skills and experience."
}`
          }
        ],
        temperature: 0.5,
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
    
    const analysis: FinalScoreAnalysis = JSON.parse(jsonContent.trim());
    
    console.log('Final score calculated:', analysis.final_score);

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error calculating final score:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        final_score: 0,
        overall_assessment: 'Unable to calculate final score at this time.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
