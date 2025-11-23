-- Add summary column to candidates table
ALTER TABLE public.candidates 
ADD COLUMN summary TEXT;