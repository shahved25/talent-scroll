import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoAnalysis {
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
    
    console.log('Analyzing video for:', candidateName, 'Category:', category);

    // Fetch the video file
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to fetch video file');
    }

    // Convert video to base64
    const videoBlob = await videoResponse.blob();
    const videoBuffer = await videoBlob.arrayBuffer();
    const base64Video = btoa(
      String.fromCharCode(...new Uint8Array(videoBuffer))
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Use Lovable AI to transcribe and analyze the video
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                text: `You are an expert recruiter evaluating a candidate's video introduction for a ${category} position.

Candidate Name: ${candidateName}

Please:
1. Transcribe the entire video word-for-word
2. Evaluate the candidate's presentation from a recruiter's perspective
3. Provide a score from 1-100 based on:
   - Communication clarity and confidence
   - Professionalism and presentation
   - Relevance to the ${category} role
   - Enthusiasm and engagement
   - Overall impression

Return your response in this EXACT JSON format:
{
  "transcription": "full transcription here",
  "feedback": "brief feedback on strengths and areas for improvement",
  "score": 75
}

Be fair but critical. Only exceptional candidates should score above 85.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:video/mp4;base64,${base64Video}`
                }
              }
            ]
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Lovable AI credits exhausted. Please add credits.');
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to analyze video with AI');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI');
    }

    // Parse the JSON response
    let analysisResult: VideoAnalysis;
    try {
      // Clean up markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI analysis response');
    }

    // Validate score is within range
    if (analysisResult.score < 1 || analysisResult.score > 100) {
      analysisResult.score = Math.max(1, Math.min(100, analysisResult.score));
    }

    console.log('Analysis complete:', analysisResult.score);

    return new Response(
      JSON.stringify(analysisResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        score: 0 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
