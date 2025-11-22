-- Allow public updates to candidates table (needed for resume score updates)
CREATE POLICY "Allow public update of resume scores"
ON candidates
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);