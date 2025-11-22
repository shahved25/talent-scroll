-- Remove the role column from candidates table since category serves this purpose
ALTER TABLE public.candidates DROP COLUMN IF EXISTS role;