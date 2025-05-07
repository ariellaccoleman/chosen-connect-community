
// This is an edge function that will be triggered when a new user is created
// It will create a profile record with first_name and last_name from the user metadata

// @ts-ignore: Deno-specific import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno-specific import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user data from the request
    const payload = await req.json();
    console.log(`[${new Date().toISOString()}] handle_new_user function called with payload:`, JSON.stringify(payload, null, 2));
    
    const userId = payload.userId;
    const firstName = payload.firstName;
    const lastName = payload.lastName;
    const email = payload.email;
    
    if (!userId) {
      console.error(`[${new Date().toISOString()}] Missing user ID in request`);
      return new Response(JSON.stringify({ error: "Missing user ID" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }
    
    console.log(`[${new Date().toISOString()}] Processing user:`, userId);
    console.log(`[${new Date().toISOString()}] User data:`, { firstName, lastName, email });
    
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (checkError) {
        console.error(`[${new Date().toISOString()}] Error checking profile existence:`, checkError);
        return new Response(JSON.stringify({ error: checkError.message }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 500,
        });
      }
      
      if (existingProfile) {
        console.log(`[${new Date().toISOString()}] Profile already exists for user:`, userId);
        return new Response(JSON.stringify({ success: true, message: "Profile already exists" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        });
      }
      
      console.log(`[${new Date().toISOString()}] Creating profile with data:`, { 
        id: userId, 
        firstName, 
        lastName, 
        email 
      });
      
      // Create profile record
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email: email
        });
        
      if (error) {
        console.error(`[${new Date().toISOString()}] Error creating profile:`, error);
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        });
      }
      
      console.log(`[${new Date().toISOString()}] Successfully created profile for user:`, userId);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      });
    } catch (innerError) {
      console.error(`[${new Date().toISOString()}] Error in profile creation process:`, innerError);
      return new Response(JSON.stringify({ error: innerError.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error handling user:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
