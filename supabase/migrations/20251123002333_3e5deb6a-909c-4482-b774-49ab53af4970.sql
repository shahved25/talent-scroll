-- Change portfolio_url from text to text array to support multiple project URLs
ALTER TABLE candidates 
ALTER COLUMN portfolio_url TYPE text[] USING 
  CASE 
    WHEN portfolio_url IS NULL THEN NULL
    WHEN portfolio_url = '' THEN ARRAY[]::text[]
    ELSE ARRAY[portfolio_url]
  END;