
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the request body
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log(`Attempting to set user ${email} as admin`);

    // Get the user by email
    const { data: userData, error: userError } = await supabaseClient.auth
      .admin.listUsers({ filter: { email } });
    
    if (userError || !userData || userData.users.length === 0) {
      console.error("Error finding user:", userError || "User not found");
      return new Response(
        JSON.stringify({ error: userError?.message || "User not found" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    const user = userData.users[0];
    console.log(`Found user with ID: ${user.id}`);

    // Update the user's metadata to include admin role
    const { data, error } = await supabaseClient.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: { role: 'admin', ...user.user_metadata }
      }
    );

    if (error) {
      console.error("Error updating user:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    console.log(`Successfully set ${email} as admin`);

    return new Response(
      JSON.stringify({ message: `Successfully set ${email} as admin`, user: data }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
