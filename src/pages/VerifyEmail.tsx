import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import logo from "@/assets/meta-wallet-logo-new.png";
import { ArrowLeft, Mail, RefreshCw, Sparkles } from "lucide-react";
import { FadeIn, ScaleIn } from "@/components/PageTransition";

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
        title: "Error",
        description: "Please enter the 6-digit verification code",
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
        title: "Verification successful!",
        description: "Welcome to MetaWallet",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Verification error",
        description: error.message === "Token has expired or is invalid" 
          ? "The verification code is invalid or expired"
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
        title: "Code sent",
        description: "A new verification code has been sent to your email",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg noise-overlay relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Orbs */}
      <div className="orb w-[500px] h-[500px] bg-primary/20 -top-32 -right-32" />
      <div className="orb w-[400px] h-[400px] bg-secondary/20 -bottom-32 -left-32" style={{ animationDelay: '-3s' }} />
      
      {/* Grid Pattern */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/auth")}
        className="absolute top-6 left-6 z-20 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </Button>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <FadeIn className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <img src={logo} alt="Meta Wallet" className="w-20 h-20 rounded-2xl mx-auto" />
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-2xl" />
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground">
            Enter the 6-digit code sent to
            <br />
            <span className="font-semibold text-foreground">{email}</span>
          </p>
        </FadeIn>

        {/* Verification Card */}
        <ScaleIn delay={0.1}>
          <Card className="glass-card border-border/50">
            <CardContent className="p-8 space-y-6">
              {/* Email Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
              </div>

              {/* OTP Input */}
              <div className="flex flex-col items-center space-y-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot 
                        key={index}
                        index={index} 
                        className="w-12 h-14 text-xl rounded-xl bg-input/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 transition-all duration-300" 
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                onClick={handleVerify} 
                className="w-full h-12 btn-glow rounded-xl font-semibold" 
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?
                </p>
                <Button
                  variant="ghost"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-primary hover:text-primary/80"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScaleIn>

        {/* Security Badge */}
        <FadeIn delay={0.3} className="flex items-center justify-center gap-2 mt-6 text-muted-foreground text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Secured with 256-bit encryption</span>
        </FadeIn>
      </div>
    </div>
  );
};

export default VerifyEmail;
