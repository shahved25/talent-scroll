import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, candidateId } = await req.json();
    
    console.log('Transcribing video for candidate:', candidateId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the video file (Whisper can transcribe directly from video)
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to fetch video');
    }
    
    const videoBlob = await videoResponse.blob();
    console.log('Video downloaded, size:', videoBlob.size);

    // Prepare form data for transcription (Whisper accepts video files)
    const formData = new FormData();
    formData.append('file', videoBlob, 'video.mp4');
    formData.append('model', 'whisper-1');

    // Send to OpenAI Whisper for transcription
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('Transcription error:', transcriptionResponse.status, errorText);
      throw new Error(`Failed to transcribe audio: ${errorText}`);
    }

    const result = await transcriptionResponse.json();
    const transcription = result.text;

    console.log('Transcription completed, length:', transcription.length);

    // Update candidate record with transcription
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ transcription })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Transcription saved for candidate:', candidateId);

    return new Response(
      JSON.stringify({ success: true, transcription }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error transcribing audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
