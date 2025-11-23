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

    // Use a simple, reliable screenshot service that works with plain URLs
    // Microlink.io has a generous free tier and doesn't require API keys for basic usage
    const screenshotApiUrl = `https://api.microlink.io/?url=${url}&screenshot=true&meta=false&embed=screenshot.url`;
    
    console.log('Fetching screenshot from Microlink API...');
    
    let screenshotUrl = null;
    
    try {
      const response = await fetch(screenshotApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScreenshotBot/1.0)'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data?.screenshot?.url) {
          screenshotUrl = data.data.screenshot.url;
          console.log('Screenshot URL obtained:', screenshotUrl);
          
          // Download the screenshot
          const imgResponse = await fetch(screenshotUrl);
          if (imgResponse.ok) {
            const screenshotBuffer = await imgResponse.arrayBuffer();
            
            // Upload to Supabase storage for caching
            const { error: uploadError } = await supabase.storage
              .from('videos')
              .upload(cacheKey, screenshotBuffer, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (uploadError) {
              console.error('Error caching screenshot:', uploadError);
            } else {
              console.log('Screenshot cached successfully');
            }

            const { data: { publicUrl } } = supabase.storage
              .from('videos')
              .getPublicUrl(cacheKey);

            return new Response(
              JSON.stringify({ screenshotUrl: publicUrl, cached: false }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } else {
        console.log('Microlink API returned status:', response.status);
      }
    } catch (apiError) {
      const errorMsg = apiError instanceof Error ? apiError.message : 'Unknown error';
      console.log('Microlink API error:', errorMsg);
    }

    // If screenshot generation failed, return a graceful fallback
    console.log('Screenshot generation failed, returning fallback');
    return new Response(
      JSON.stringify({ 
        screenshotUrl: null, 
        error: 'Screenshot generation unavailable',
        fallback: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-screenshot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // Always return 200 with fallback flag to prevent breaking the UI
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