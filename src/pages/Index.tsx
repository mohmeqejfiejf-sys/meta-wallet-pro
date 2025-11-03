import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/meta-wallet-logo-dark.png";
import { Wallet, ArrowRight, Shield, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Meta Wallet" className="w-10 h-10" />
          <span className="font-bold text-2xl">Meta Wallet</span>
        </div>
        <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Your Digital Wallet,<br />
            <span className="text-primary">Simplified</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Send, receive, and manage your money with ease. Experience the future of digital payments.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
              Create Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-8 rounded-2xl bg-card border border-border text-center hover:border-primary/50 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Transfers</h3>
            <p className="text-muted-foreground">
              Send money to anyone instantly using just their email address
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border text-center hover:border-primary/50 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Safe</h3>
            <p className="text-muted-foreground">
              Your money is protected with bank-level security and encryption
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border text-center hover:border-primary/50 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Transactions are processed in real-time, 24/7
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
