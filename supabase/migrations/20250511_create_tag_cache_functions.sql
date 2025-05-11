
-- Function to get cached tags data
CREATE OR REPLACE FUNCTION public.get_cached_tags(cache_key TEXT)
RETURNS JSONB AS $$
DECLARE
  cached_data JSONB;
  cache_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get cache data and time
  SELECT data, updated_at INTO cached_data, cache_time 
  FROM public.cache 
  WHERE key = cache_key;
  
  -- Return data only if cache exists and is less than 5 minutes old
  IF cached_data IS NOT NULL AND 
     (EXTRACT(EPOCH FROM (now() - cache_time)) < 300) THEN
    RETURN cached_data;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tag cache
CREATE OR REPLACE FUNCTION public.update_tag_cache(cache_key TEXT, cache_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.cache (key, data, updated_at)
  VALUES (cache_key, cache_data, now())
  ON CONFLICT (key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = EXCLUDED.updated_at;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
