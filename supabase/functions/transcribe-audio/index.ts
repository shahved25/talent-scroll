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
    const { audioUrl, candidateId } = await req.json();
    
    console.log('Transcribing audio for candidate:', candidateId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio');
    }
    
    const audioBlob = await audioResponse.blob();
    console.log('Audio downloaded, size:', audioBlob.size);

    // Prepare form data for transcription
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');

    // Send to Lovable AI for transcription
    const transcriptionResponse = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
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
