-- Add category_id column to candidates table (nullable for existing data)
ALTER TABLE public.candidates 
ADD COLUMN category_id uuid REFERENCES public.categories(id);

-- Migrate existing data from candidate_categories junction table
UPDATE public.candidates c
SET category_id = cc.category_id
FROM public.candidate_categories cc
WHERE c.id = cc.candidate_id;

-- Add index for better query performance
CREATE INDEX idx_candidates_category_id ON public.candidates(category_id);