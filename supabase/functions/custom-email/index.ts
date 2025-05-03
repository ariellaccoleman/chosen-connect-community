
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { renderAsync } from "npm:@react-email/render@0.0.10";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { ConfirmationEmail } from "./email-templates/confirmation.tsx";
import { MagicLinkEmail } from "./email-templates/magic-link.tsx";
import { ResetPasswordEmail } from "./email-templates/reset-password.tsx";

// Initialize Resend email service
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for browser requests
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
    const { type, email, actionLink, additionalData } = await req.json();
    
    // Log the request details for debugging
    console.log(`Processing ${type} email for ${email} at ${new Date().toISOString()}`);
    
    let emailContent;
    let subject;

    switch (type) {
      case "confirmation":
        subject = "Welcome to Chosen - Please Confirm Your Email";
        emailContent = await renderAsync(
          ConfirmationEmail({ confirmLink: actionLink, firstName: additionalData?.firstName || "" })
        );
        break;
      case "magic_link":
        subject = "Your Magic Sign-in Link for Chosen";
        emailContent = await renderAsync(
          MagicLinkEmail({ signInLink: actionLink })
        );
        break;
      case "reset_password":
        subject = "Reset Your Chosen Password";
        emailContent = await renderAsync(
          ResetPasswordEmail({ resetLink: actionLink })
        );
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: "Chosen Community <noreply@chosen.community>",
      to: [email],
      subject: subject,
      html: emailContent,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in custom-email function:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
