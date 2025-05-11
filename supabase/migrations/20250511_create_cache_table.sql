
-- Create a cache table for storing query results
CREATE TABLE IF NOT EXISTS public.cache (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies to allow read access to the cache table
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read from cache
CREATE POLICY "Anyone can read cache" 
  ON public.cache 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to update cache
CREATE POLICY "Anyone can update cache" 
  ON public.cache 
  FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to update cache
CREATE POLICY "Anyone can update existing cache" 
  ON public.cache 
  FOR UPDATE 
  USING (true);
