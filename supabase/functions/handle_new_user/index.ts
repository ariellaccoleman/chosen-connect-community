
// This is an edge function that will be triggered when a new user is created
// It will create a profile record with first_name and last_name from the user metadata

// @ts-ignore: Deno-specific import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno-specific import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user data from the request
    const payload = await req.json();
    const { record, type } = payload;
    
    console.log("New user trigger called:", type, record?.id);
    console.log("Full payload:", JSON.stringify(payload, null, 2));
    console.log("Supabase URL:", supabaseUrl);
    
    if ((type === "INSERT" || type === "UPDATE") && record?.id) {
      console.log("Processing user:", record.id);
      console.log("User metadata:", record.raw_user_meta_data);
      
      try {
        // Check if profile already exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', record.id)
          .maybeSingle();
          
        if (checkError) {
          console.error("Error checking profile existence:", checkError);
          return new Response(JSON.stringify({ error: checkError.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
          });
        }
        
        if (existingProfile) {
          console.log("Profile already exists for user:", record.id);
          return new Response(JSON.stringify({ success: true, message: "Profile already exists" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          });
        }
        
        // Extract first_name and last_name from user metadata
        const first_name = record.raw_user_meta_data?.first_name;
        const last_name = record.raw_user_meta_data?.last_name;
        
        console.log("Creating profile with data:", { 
          id: record.id, 
          first_name, 
          last_name, 
          email: record.email 
        });
        
        // Create profile record
        const { data, error } = await supabase
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
        
        console.log("Successfully created profile for user:", record.id);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      } catch (innerError) {
        console.error("Error in profile creation process:", innerError);
        return new Response(JSON.stringify({ error: innerError.message }), {
          headers: { "Content-Type": "application/json" },
          status: 500,
        });
      }
    }
    
    return new Response(JSON.stringify({ success: true, message: "No action needed" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error handling user:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
