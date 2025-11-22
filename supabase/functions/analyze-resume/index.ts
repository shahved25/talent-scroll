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
    const { resumeUrl, candidateName, category } = await req.json();
    
    console.log('Analyzing resume for:', candidateName, 'Category:', category);

    const resumeResponse = await fetch(resumeUrl);
    if (!resumeResponse.ok) {
      throw new Error('Failed to fetch resume');
    }

    const resumeBlob = await resumeResponse.blob();
    const resumeBuffer = await resumeBlob.arrayBuffer();
    const resumeBase64 = btoa(
      String.fromCharCode(...new Uint8Array(resumeBuffer))
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
                text: `Analyze this resume for ${candidateName} applying for a ${category} position. Evaluate their qualifications and provide a score from 1-100.`
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
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_resume',
              description: 'Analyze a resume and provide structured feedback',
              parameters: {
                type: 'object',
                properties: {
                  score: {
                    type: 'number',
                    description: 'Score from 1-100 based on qualifications, experience, and fit for the role'
                  },
                  strengths: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '2-3 key strengths from the resume'
                  },
                  improvements: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '1-2 areas for improvement'
                  },
                  summary: {
                    type: 'string',
                    description: 'Brief 1-2 sentence summary of the candidate'
                  }
                },
                required: ['score', 'strengths', 'improvements', 'summary']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_resume' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls[0];
    const analysis = JSON.parse(toolCall.function.arguments);

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
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
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
