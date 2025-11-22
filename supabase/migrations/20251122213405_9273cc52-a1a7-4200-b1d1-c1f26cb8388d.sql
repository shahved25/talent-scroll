-- Add audio_url column to candidates table
ALTER TABLE public.candidates 
ADD COLUMN audio_url text;

COMMENT ON COLUMN public.candidates.audio_url IS 'URL to candidate audio file';