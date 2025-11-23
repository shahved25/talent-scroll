import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Generating screenshot for:', url);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate a cache key from the URL
    const cacheKey = `screenshots/${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}.jpg`;

    // Check if screenshot already exists in storage
    const { data: existingFile } = await supabase.storage
      .from('videos')
      .list('screenshots', {
        search: btoa(url).replace(/[^a-zA-Z0-9]/g, '')
      });

    if (existingFile && existingFile.length > 0) {
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(cacheKey);
      
      console.log('Returning cached screenshot:', publicUrl);
      return new Response(
        JSON.stringify({ screenshotUrl: publicUrl, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use free screenshot service (thum.io - no API key required)
    const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/noanimate/${encodeURIComponent(url)}`;
    
    console.log('Fetching screenshot from API...');
    const screenshotResponse = await fetch(screenshotUrl);
    
    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error('Screenshot API error:', screenshotResponse.status, errorText);
      throw new Error(`Failed to generate screenshot: ${screenshotResponse.status}`);
    }
    
    console.log('Screenshot fetched successfully, status:', screenshotResponse.status);

    const screenshotBlob = await screenshotResponse.blob();
    const screenshotBuffer = await screenshotBlob.arrayBuffer();

    // Upload to Supabase storage for caching
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(cacheKey, screenshotBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Error caching screenshot:', uploadError);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(cacheKey);

    console.log('Screenshot generated and cached:', publicUrl);

    return new Response(
      JSON.stringify({ screenshotUrl: publicUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-screenshot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});