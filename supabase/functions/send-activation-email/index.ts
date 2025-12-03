import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ActivationEmailRequest {
  email: string;
  fullName: string | null;
  status: "approved" | "rejected";
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-activation-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, status }: ActivationEmailRequest = await req.json();
    console.log(`Sending activation email to: ${email}, status: ${status}`);

    const name = fullName || "عزيزي المستخدم";
    
    let subject: string;
    let htmlContent: string;

    if (status === "approved") {
      subject = "تم تفعيل حسابك بنجاح - Meta Wallet";
      htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1a1a2e; border-radius: 12px; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
            .success-icon { font-size: 60px; margin: 20px 0; }
            h1 { color: #22c55e; margin-bottom: 20px; }
            p { line-height: 1.8; color: #d1d5db; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Meta Wallet</div>
            </div>
            <div class="success-icon" style="text-align: center;">✅</div>
            <h1 style="text-align: center;">مبروك! تم تفعيل حسابك</h1>
            <p>مرحباً ${name}،</p>
            <p>يسعدنا إبلاغك بأنه تم تفعيل حسابك بنجاح في Meta Wallet. يمكنك الآن الاستفادة من جميع مميزات المنصة.</p>
            <p>شكراً لثقتك بنا!</p>
            <div class="footer">
              <p>© 2024 Meta Wallet. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "تحديث حالة طلب التفعيل - Meta Wallet";
      htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1a1a2e; border-radius: 12px; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
            .status-icon { font-size: 60px; margin: 20px 0; }
            h1 { color: #ef4444; margin-bottom: 20px; }
            p { line-height: 1.8; color: #d1d5db; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Meta Wallet</div>
            </div>
            <div class="status-icon" style="text-align: center;">❌</div>
            <h1 style="text-align: center;">تحديث حالة الطلب</h1>
            <p>مرحباً ${name}،</p>
            <p>نأسف لإبلاغك بأنه تم رفض طلب تفعيل حسابك. إذا كان لديك أي استفسار، يرجى التواصل مع فريق الدعم.</p>
            <div class="footer">
              <p>© 2024 Meta Wallet. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Meta Wallet <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-activation-email function:", error);
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