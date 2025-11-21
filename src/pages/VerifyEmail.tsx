import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import logo from "@/assets/meta-wallet-logo.png";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!email) {
      navigate("/auth");
    }
  }, [email, navigate]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز التحقق المكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) throw error;

      toast({
        title: "تم التحقق بنجاح!",
        description: "مرحباً بك في Meta Wallet",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "خطأ في التحقق",
        description: error.message === "Token has expired or is invalid" 
          ? "رمز التحقق غير صحيح أو منتهي الصلاحية"
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      toast({
        title: "تم إرسال الرمز",
        description: "تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Meta Wallet" className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">تحقق من بريدك الإلكتروني</CardTitle>
          <CardDescription className="text-sm sm:text-base px-2">
            أدخل رمز التحقق المكون من 6 أرقام المرسل إلى
            <br />
            <span className="font-semibold text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={isLoading}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl" />
                <InputOTPSlot index={1} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl" />
                <InputOTPSlot index={2} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl" />
                <InputOTPSlot index={3} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl" />
                <InputOTPSlot index={4} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl" />
                <InputOTPSlot index={5} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            onClick={handleVerify} 
            className="w-full" 
            disabled={isLoading || otp.length !== 6}
            size="lg"
          >
            {isLoading ? "جاري التحقق..." : "تحقق"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              لم يصلك الرمز؟
            </p>
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isLoading}
              className="text-sm"
            >
              إعادة إرسال الرمز
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate("/auth")}
            className="w-full"
            disabled={isLoading}
          >
            العودة لتسجيل الدخول
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
