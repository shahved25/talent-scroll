import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    
    if (!resumeUrl) {
      throw new Error('Resume URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Fetching resume from:', resumeUrl);
    
    // Fetch the resume PDF
    const resumeResponse = await fetch(resumeUrl);
    if (!resumeResponse.ok) {
      throw new Error('Failed to fetch resume');
    }

    const resumeBuffer = await resumeResponse.arrayBuffer();
    const resumeBase64 = btoa(
      new Uint8Array(resumeBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log('Analyzing resume with AI...');

    // Use Lovable AI to analyze the resume
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert technical recruiter evaluating candidates for ${category} positions. 
Analyze the resume and provide a comprehensive score (0-100) based on:
- Technical skills relevance (40%)
- Experience level and progression (25%)
- Education and certifications (15%)
- Projects and achievements (15%)
- Resume clarity and professionalism (5%)

Be critical but fair. A score of 70+ indicates a strong candidate, 80+ exceptional.`
          },
          {
            role: "user",
            content: `Please analyze this resume for ${candidateName} applying for a ${category} role. The resume is provided as a PDF.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_resume",
              description: "Provide a comprehensive score and analysis for a resume",
              parameters: {
                type: "object",
                properties: {
                  overall_score: {
                    type: "number",
                    description: "Overall score from 0-100"
                  },
                  technical_skills_score: {
                    type: "number",
                    description: "Technical skills relevance score (0-40)"
                  },
                  experience_score: {
                    type: "number",
                    description: "Experience level score (0-25)"
                  },
                  education_score: {
                    type: "number",
                    description: "Education and certifications score (0-15)"
                  },
                  projects_score: {
                    type: "number",
                    description: "Projects and achievements score (0-15)"
                  },
                  presentation_score: {
                    type: "number",
                    description: "Resume clarity score (0-5)"
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3-5 strengths of the candidate"
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3 areas for improvement"
                  },
                  summary: {
                    type: "string",
                    description: "Brief 2-3 sentence hiring recommendation"
                  }
                },
                required: ["overall_score", "technical_skills_score", "experience_score", "education_score", "projects_score", "presentation_score", "strengths", "improvements", "summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "score_resume" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI response received:', JSON.stringify(aiData, null, 2));

    // Extract the function call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('No analysis result from AI');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Resume analysis complete:', analysis);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error analyzing resume:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
