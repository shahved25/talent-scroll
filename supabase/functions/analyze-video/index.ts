import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, candidateName, category } = await req.json();
    
    console.log('Analyzing video for:', candidateName, 'Category:', category);
    console.log('Video URL:', videoUrl);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch video and convert to base64 for Gemini
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to fetch video file');
    }

    const videoBlob = await videoResponse.blob();
    const videoBuffer = await videoBlob.arrayBuffer();
    
    // Convert to base64 in chunks to avoid memory issues
    const uint8Array = new Uint8Array(videoBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const videoBase64 = btoa(binary);

    console.log('Video size:', videoBuffer.byteLength, 'bytes');

    // Use Gemini 2.5 Pro with tool calling for structured output
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert recruiter. Analyze this video introduction from ${candidateName} applying for a ${category} position. 

Transcribe all spoken content and evaluate based on:
- Communication clarity and confidence (25 points)
- Professionalism and presentation (25 points)  
- Relevance to ${category} role (25 points)
- Enthusiasm and engagement (25 points)

Provide honest, constructive feedback. Average scores should be 60-75. Only exceptional candidates score above 85.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:video/mp4;base64,${videoBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_video',
              description: 'Analyze a candidate video and provide structured feedback',
              parameters: {
                type: 'object',
                properties: {
                  transcription: {
                    type: 'string',
                    description: 'Full word-for-word transcription of spoken content'
                  },
                  feedback: {
                    type: 'string',
                    description: '2-3 sentences highlighting key strengths and one improvement area'
                  },
                  score: {
                    type: 'number',
                    description: 'Score from 1-100 based on the evaluation criteria'
                  }
                },
                required: ['transcription', 'feedback', 'score']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_video' } }
      }),
    });

    console.log('AI Response status:', aiResponse.status);

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
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(aiData));
      throw new Error('Invalid AI response structure');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Validate and clamp score
    if (analysis.score < 1 || analysis.score > 100) {
      analysis.score = Math.max(1, Math.min(100, analysis.score));
    }

    console.log('Video analysis complete:', analysis.score);

    return new Response(
      JSON.stringify(analysis),
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
        score: 0,
        transcription: '',
        feedback: 'Unable to analyze video at this time.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
