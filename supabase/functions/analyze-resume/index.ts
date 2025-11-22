import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import PDFParser from 'https://esm.sh/pdf-parse@1.1.1';

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

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    // Fetch the resume PDF
    const resumeResponse = await fetch(resumeUrl);
    if (!resumeResponse.ok) {
      throw new Error('Failed to fetch resume');
    }
    
    const resumeBuffer = await resumeResponse.arrayBuffer();
    
    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const pdfData = await PDFParser(new Uint8Array(resumeBuffer));
    const resumeText = pdfData.text;
    
    console.log('Text extracted, length:', resumeText.length);

    // Analyze with Groq AI
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
            content: `You are an expert technical recruiter analyzing resumes for ${category} positions.`
          },
          {
            role: 'user',
            content: `Analyze this resume text and provide a comprehensive evaluation:

RESUME TEXT:
${resumeText}

POSITION: ${category}
CANDIDATE: ${candidateName}

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

Respond ONLY with valid JSON in this exact format:
{
  "score": 85,
  "strengths": ["Strong technical skills", "Relevant experience"],
  "improvements": ["Add more metrics", "Include certifications"],
  "summary": "Strong candidate with relevant experience."
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
      // Remove opening ```json or ```
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '');
      // Remove closing ```
      jsonContent = jsonContent.replace(/\n?```$/, '');
    }
    
    // Parse the JSON response
    const analysis: ResumeAnalysis = JSON.parse(jsonContent.trim());
    
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
