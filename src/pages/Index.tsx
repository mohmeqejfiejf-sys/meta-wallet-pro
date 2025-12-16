import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/meta-wallet-logo-new.png";
import { Wallet, ArrowRight, Shield, Zap, Globe, Sparkles, ChevronRight } from "lucide-react";

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
    <div className="min-h-screen animated-bg noise-overlay relative overflow-hidden">
      {/* Animated Orbs */}
      <div className="orb w-[600px] h-[600px] bg-primary/20 -top-48 -left-48" />
      <div className="orb w-[400px] h-[400px] bg-secondary/20 top-1/2 -right-32" style={{ animationDelay: '-2s' }} />
      <div className="orb w-[300px] h-[300px] bg-primary/15 bottom-20 left-1/4" style={{ animationDelay: '-4s' }} />

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-4 py-6">
        <div className="glass-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={logo} alt="Meta Wallet" className="w-12 h-12 rounded-xl" />
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl" />
            </div>
            <span className="font-display font-bold text-2xl gradient-text">MetaWallet</span>
          </div>
          <Button 
            onClick={() => navigate("/auth")} 
            className="btn-glow rounded-full px-6 font-medium"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 pt-16 pb-32">
        <div className="text-center max-w-5xl mx-auto mb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">The Future of Digital Payments</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Your Digital Wallet
            <br />
            <span className="gradient-text">Reimagined</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Experience seamless transactions with cutting-edge security. 
            Send, receive, and manage your funds effortlessly.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="btn-glow rounded-full px-8 py-6 text-lg font-semibold group"
            >
              Create Free Account
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="rounded-full px-8 py-6 text-lg font-semibold border-border/50 hover:bg-card/50 hover:border-primary/50 transition-all duration-300"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Floating Card Preview */}
        <div className="relative max-w-lg mx-auto mb-20 opacity-0 animate-scale-in" style={{ animationDelay: '0.5s' }}>
          <div className="glass-card gradient-border p-8 card-hover">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-display font-bold">$24,650.00</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-success text-sm">
                  <ArrowRight className="w-3 h-3 rotate-[-45deg]" />
                  +12.5%
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 btn-glow rounded-xl">Send</Button>
              <Button variant="outline" className="flex-1 rounded-xl border-border/50 hover:border-primary/50">Receive</Button>
            </div>
          </div>
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl -z-10" />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: Wallet,
              title: "Instant Transfers",
              description: "Send money globally in seconds with just an email address",
              delay: "0.6s"
            },
            {
              icon: Shield,
              title: "Bank-Level Security",
              description: "Military-grade encryption protects every transaction",
              delay: "0.7s"
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Real-time processing available 24/7, 365 days",
              delay: "0.8s"
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="glass-card p-8 card-hover opacity-0 animate-fade-in-up group"
              style={{ animationDelay: feature.delay }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 glass-card p-8 md:p-12 max-w-4xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50K+", label: "Active Users" },
              { value: "$10M+", label: "Transactions" },
              { value: "150+", label: "Countries" },
              { value: "99.9%", label: "Uptime" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className="font-display text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 MetaWallet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
