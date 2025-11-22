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
    
    console.log('Converting video to audio for candidate:', candidateId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the video file
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to fetch video');
    }
    
    const videoBlob = await videoResponse.blob();
    const videoBuffer = await videoBlob.arrayBuffer();
    
    console.log('Video downloaded, size:', videoBuffer.byteLength);

    // Create temporary files for FFmpeg processing
    const videoPath = `/tmp/video_${candidateId}.mp4`;
    const audioPath = `/tmp/audio_${candidateId}.mp3`;
    
    // Write video to temporary file
    await Deno.writeFile(videoPath, new Uint8Array(videoBuffer));
    
    console.log('Extracting audio with FFmpeg...');
    
    // Extract audio using FFmpeg
    const ffmpegProcess = new Deno.Command('ffmpeg', {
      args: [
        '-i', videoPath,
        '-vn', // No video
        '-acodec', 'libmp3lame',
        '-q:a', '2', // High quality
        '-ar', '44100', // Sample rate
        audioPath
      ],
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code, stderr } = await ffmpegProcess.output();
    
    if (code !== 0) {
      const errorString = new TextDecoder().decode(stderr);
      console.error('FFmpeg error:', errorString);
      throw new Error('Failed to extract audio from video');
    }

    console.log('Audio extracted successfully');

    // Read the extracted audio file
    const audioData = await Deno.readFile(audioPath);
    
    // Upload audio to Supabase storage
    const audioFileName = `${candidateId}_${Date.now()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(audioFileName, audioData, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl: audioUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(audioFileName);

    console.log('Audio uploaded:', audioUrl);

    // Update candidate record with audio URL
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ audio_url: audioUrl })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    // Clean up temporary files
    try {
      await Deno.remove(videoPath);
      await Deno.remove(audioPath);
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }

    console.log('Conversion complete for candidate:', candidateId);

    // Trigger audio transcription (fire and forget)
    try {
      const transcribeResponse = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl, candidateId }
      });
      
      if (transcribeResponse.error) {
        console.error('Transcription trigger error:', transcribeResponse.error);
      } else {
        console.log('Transcription triggered successfully');
      }
    } catch (transcribeError) {
      console.error('Failed to trigger transcription:', transcribeError);
      // Don't fail the conversion if transcription fails
    }

    return new Response(
      JSON.stringify({ success: true, audioUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error converting video to audio:', error);
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
