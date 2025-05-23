
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid site admin roles (distinct from organization admin roles)
const VALID_SITE_ADMIN_ROLES = ['admin'];

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
    const { email, role = 'admin' } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Validate role
    if (!VALID_SITE_ADMIN_ROLES.includes(role)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid site admin role: "${role}". The only valid site admin role is: ${VALID_SITE_ADMIN_ROLES.join(', ')}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log(`Attempting to set user ${email} as site ${role}`);

    // Get the user by email - explicitly filter by the exact email
    const { data: userData, error: userError } = await supabaseClient.auth
      .admin.listUsers({ 
        filter: { email: email } 
      });
    
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

    // Get the first user that exactly matches the email
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found with exact email match" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    console.log(`Found user with ID: ${user.id}`);

    // Update the user's metadata to include admin role
    const { data, error } = await supabaseClient.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: { 
          role: role,
          ...user.user_metadata 
        }
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

    console.log(`Successfully set ${email} as site ${role}`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully set ${email} as site ${role}`, 
        user: data 
      }),
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
