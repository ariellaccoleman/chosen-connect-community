
-- Create a helper function to execute SQL commands safely
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, testing
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;

COMMENT ON FUNCTION exec_sql IS 'Execute SQL commands for test setup (restricted to testing schema)';
