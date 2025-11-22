-- Create storage buckets for candidate uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('resumes', 'resumes', true),
  ('videos', 'videos', true);

-- Create policies for resume uploads
CREATE POLICY "Anyone can upload resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Resumes are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resumes');

-- Create policies for video uploads
CREATE POLICY "Anyone can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

-- Allow public insert access to candidates table
CREATE POLICY "Anyone can create candidates" 
ON public.candidates 
FOR INSERT 
WITH CHECK (true);