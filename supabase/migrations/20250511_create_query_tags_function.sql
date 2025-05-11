
-- Create a function to execute dynamic SQL for tag queries
-- This allows us to use parameterized SQL for more efficient tag queries
CREATE OR REPLACE FUNCTION public.query_tags(query_text TEXT)
RETURNS SETOF tags AS $$
BEGIN
  RETURN QUERY EXECUTE query_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
