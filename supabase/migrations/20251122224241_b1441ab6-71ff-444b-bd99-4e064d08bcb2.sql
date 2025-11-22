-- Create audio storage bucket for extracted audio from videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for audio bucket
CREATE POLICY "Allow public read access to audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Allow public insert to audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio');

CREATE POLICY "Allow public update to audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio');