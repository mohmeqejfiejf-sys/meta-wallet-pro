import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
}

interface User {
  email: string;
}

interface WebhookPayload {
  user: User;
  email_data: EmailData;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log("Received OTP request for:", payload.user.email);

    const { user, email_data } = payload;
    const { token, email_action_type } = email_data;

    // Only handle signup OTP emails
    if (email_action_type !== "signup") {
      console.log("Not a signup email, skipping");
      return new Response(
        JSON.stringify({ message: "Not a signup email" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send OTP email
    const emailResponse = await resend.emails.send({
      from: "Meta Wallet <onboarding@resend.dev>",
      to: [user.email],
      subject: "رمز التحقق من Meta Wallet",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Meta Wallet</h1>
              <h2 style="color: #666; font-weight: normal;">رمز التحقق</h2>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              مرحباً،
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              شكراً لتسجيلك في Meta Wallet. الرجاء استخدام رمز التحقق التالي لإكمال عملية التسجيل:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">
                ${token}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              هذا الرمز صالح لمدة 60 دقيقة فقط.
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
              إذا لم تقم بإنشاء حساب على Meta Wallet، يمكنك تجاهل هذا البريد الإلكتروني بأمان.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 Meta Wallet. جميع الحقوق محفوظة.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending OTP email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
