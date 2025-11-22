-- Add resume_score column to candidates table
ALTER TABLE candidates ADD COLUMN resume_score integer;

-- Add constraint to ensure score is between 0 and 100
ALTER TABLE candidates ADD CONSTRAINT resume_score_range CHECK (resume_score >= 0 AND resume_score <= 100);