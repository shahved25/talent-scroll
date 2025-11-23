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
    const urlHash = btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
    const cacheKey = `screenshots/${urlHash}.jpg`;

    // Check if screenshot already exists in storage
    const { data: existingFile } = await supabase.storage
      .from('videos')
      .list('screenshots', {
        search: urlHash
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

    // Try multiple screenshot services with fallbacks
    const services = [
      {
        name: 'screenshotmachine',
        url: `https://api.screenshotmachine.com/?key=demo&url=${encodeURIComponent(url)}&dimension=1200x800`
      },
      {
        name: 'apiflash-demo',
        url: `https://api.apiflash.com/v1/urltoimage?access_key=demo&url=${encodeURIComponent(url)}&width=1200&height=800&fresh=true`
      }
    ];

    let screenshotBlob = null;
    let successService = null;

    for (const service of services) {
      try {
        console.log(`Trying ${service.name}...`);
        const screenshotResponse = await fetch(service.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ScreenshotBot/1.0)'
          }
        });
        
        if (screenshotResponse.ok) {
          screenshotBlob = await screenshotResponse.blob();
          successService = service.name;
          console.log(`Success with ${service.name}`);
          break;
        } else {
          console.log(`${service.name} failed with status:`, screenshotResponse.status);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`${service.name} error:`, errorMsg);
        continue;
      }
    }

    // If all services failed, return a graceful error that the frontend can handle
    if (!screenshotBlob) {
      console.log('All screenshot services failed, returning fallback response');
      return new Response(
        JSON.stringify({ 
          screenshotUrl: null, 
          error: 'Screenshot generation unavailable',
          fallback: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

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

    console.log(`Screenshot generated via ${successService} and cached:`, publicUrl);

    return new Response(
      JSON.stringify({ screenshotUrl: publicUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-screenshot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // Return a graceful error that the frontend can handle
    return new Response(
      JSON.stringify({ 
        screenshotUrl: null, 
        error: errorMessage,
        fallback: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});