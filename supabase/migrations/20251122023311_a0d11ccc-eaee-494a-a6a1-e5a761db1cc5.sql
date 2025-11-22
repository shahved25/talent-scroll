-- Create candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  video_url TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  thumbnail_url TEXT,
  skill_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidate_categories junction table (many-to-many)
CREATE TABLE public.candidate_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, category_id)
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now - no auth yet)
CREATE POLICY "Allow public read access to candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to candidate_categories" ON public.candidate_categories FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_candidate_categories_candidate ON public.candidate_categories(candidate_id);
CREATE INDEX idx_candidate_categories_category ON public.candidate_categories(category_id);
CREATE INDEX idx_candidates_role ON public.candidates(role);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.categories (name, slug) VALUES
  ('Backend Engineer', 'backend-engineer'),
  ('Frontend Engineer', 'frontend-engineer'),
  ('Full Stack Developer', 'full-stack-developer'),
  ('DevOps Engineer', 'devops-engineer'),
  ('Data Scientist', 'data-scientist'),
  ('Product Manager', 'product-manager');

-- Seed sample candidates
INSERT INTO public.candidates (name, role, video_url, resume_url, thumbnail_url, skill_tags) VALUES
  ('Sarah Chen', 'Senior Backend Engineer', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', ARRAY['Node.js', 'Python', 'PostgreSQL', 'Docker']),
  ('Marcus Johnson', 'Frontend Developer', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', ARRAY['React', 'TypeScript', 'Tailwind', 'Next.js']),
  ('Emily Rodriguez', 'Full Stack Developer', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', ARRAY['JavaScript', 'React', 'Node.js', 'MongoDB']);

-- Link candidates to categories
INSERT INTO public.candidate_categories (candidate_id, category_id)
SELECT c.id, cat.id 
FROM public.candidates c, public.categories cat 
WHERE (c.name = 'Sarah Chen' AND cat.slug = 'backend-engineer')
   OR (c.name = 'Marcus Johnson' AND cat.slug = 'frontend-engineer')
   OR (c.name = 'Emily Rodriguez' AND cat.slug = 'full-stack-developer');