import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoGrading {
  score: number;
  transcription: string;
  feedback: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, candidateName, category } = await req.json();

    if (!videoUrl) {
      throw new Error('Video URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Starting video transcription and grading for:', candidateName);

    // Step 1: Transcribe the video using Lovable AI (Gemini supports video)
    const transcribeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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
                text: `Please transcribe this candidate introduction video. The candidate is ${candidateName} applying for ${category}. Provide a complete, accurate transcription of what they say.`
              },
              {
                type: 'video_url',
                video_url: {
                  url: videoUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.error('Transcription error:', errorText);
      throw new Error(`Failed to transcribe video: ${transcribeResponse.status}`);
    }

    const transcriptionData = await transcribeResponse.json();
    const transcription = transcriptionData.choices[0].message.content;

    console.log('Transcription completed');

    // Step 2: Grade the transcription from a recruiter's perspective
    const gradePrompt = `You are an experienced recruiter evaluating a candidate's video introduction for a ${category} position.

Candidate: ${candidateName}
Transcription: ${transcription}

Evaluate this introduction and provide:
1. A score from 1-100 based on:
   - Communication skills and clarity
   - Professionalism and presentation
   - Relevance to the ${category} role
   - Enthusiasm and engagement
   - Content quality and structure

2. Brief feedback on strengths and areas for improvement

Respond in JSON format:
{
  "score": <number 1-100>,
  "feedback": "<brief recruiter feedback>"
}`;

    const gradeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: gradePrompt
          }
        ],
      }),
    });

    if (!gradeResponse.ok) {
      const errorText = await gradeResponse.text();
      console.error('Grading error:', errorText);
      throw new Error(`Failed to grade transcription: ${gradeResponse.status}`);
    }

    const gradingData = await gradeResponse.json();
    let gradingText = gradingData.choices[0].message.content;

    // Clean up markdown code blocks if present
    gradingText = gradingText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const grading = JSON.parse(gradingText);

    console.log('Video grading completed:', grading.score);

    const result: VideoGrading = {
      score: grading.score,
      transcription: transcription,
      feedback: grading.feedback,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in transcribe-and-grade-video:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
