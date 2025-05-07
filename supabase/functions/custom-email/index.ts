
// @ts-ignore: Deno-specific import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno-specific import
import { renderAsync } from "npm:@react-email/render@0.0.10";
// @ts-ignore: Deno-specific import
import { Resend } from "npm:resend@2.0.0";
// @ts-ignore: Deno-specific import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
// @ts-ignore: Deno-specific import
import { ConfirmationEmail } from "./email-templates/confirmation.tsx";
// @ts-ignore: Deno-specific import
import { MagicLinkEmail } from "./email-templates/magic-link.tsx";
// @ts-ignore: Deno-specific import
import { ResetPasswordEmail } from "./email-templates/reset-password.tsx";

// Initialize Resend email service with API key
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
    console.log("Action link:", actionLink);
    console.log("Additional data:", additionalData);
    
    let emailContent;
    let subject;

    switch (type) {
      case "confirmation":
        subject = "Welcome to CHOSEN - Please Confirm Your Email";
        emailContent = await renderAsync(
          ConfirmationEmail({ confirmLink: actionLink, firstName: additionalData?.firstName || "" })
        );
        console.log("Generated confirmation email content");
        break;
      case "magic_link":
        subject = "Your Magic Sign-in Link for CHOSEN";
        emailContent = await renderAsync(
          MagicLinkEmail({ signInLink: actionLink })
        );
        console.log("Generated magic link email content");
        break;
      case "reset_password":
        subject = "Reset Your CHOSEN Password";
        emailContent = await renderAsync(
          ResetPasswordEmail({ resetLink: actionLink })
        );
        console.log("Generated reset password email content");
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Send the email using Resend with a pre-verified sender
    console.log("Sending email to:", email);
    console.log("From: CHOSEN Community <onboarding@resend.dev>");
    
    try {
      const { data, error } = await resend.emails.send({
        from: "CHOSEN Community <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: emailContent,
      });

      if (error) {
        console.error("Error sending email:", error);
        // Just log the error but don't throw - let the function complete successfully
        // so the user creation process isn't interrupted
      } else {
        console.log("Email sent successfully:", data);
      }
    } catch (emailError) {
      // Log but don't throw - this shouldn't block the signup process
      console.error("Error in email sending:", emailError);
    }
    
    // Always return success to ensure the signup flow continues
    return new Response(JSON.stringify({ success: true, message: "Email processed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in custom-email function:", error);
    
    // Still return a 200 status to prevent blocking the main signup flow
    return new Response(
      JSON.stringify({ success: false, error: error.message, message: "Error processing email but continuing signup" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
