
// This is an edge function that will be triggered when a new user is created
// It will create a profile record with first_name and last_name from the user metadata

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get the user data from the request
  const payload = await req.json();
  const { record, type } = payload;
  
  if (type === "INSERT" && record?.id) {
    // Extract first_name and last_name from user metadata
    const first_name = record.raw_user_meta_data?.first_name;
    const last_name = record.raw_user_meta_data?.last_name;
    
    // Create profile record
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: record.id,
        first_name,
        last_name,
        email: record.email
      });
      
    if (error) {
      console.error("Error creating profile:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
