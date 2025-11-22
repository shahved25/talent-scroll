-- Create shortlisted candidates table
CREATE TABLE public.shortlisted_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  candidate_role TEXT NOT NULL,
  video_url TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  thumbnail_url TEXT,
  skill_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (but allow all operations for now since this is a single-user app)
ALTER TABLE public.shortlisted_candidates ENABLE ROW LEVEL SECURITY;

-- Allow all operations on shortlisted_candidates
CREATE POLICY "Allow all operations on shortlisted_candidates"
ON public.shortlisted_candidates
FOR ALL
USING (true)
WITH CHECK (true);