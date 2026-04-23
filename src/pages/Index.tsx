import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/phantom-logo.png";
import { ArrowRight, Search, ChevronDown, Smartphone } from "lucide-react";

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

  const navLinks = ["Features", "Learn", "Explore", "Company", "Developers", "Support"];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logo} alt="Phantom" className="w-10 h-10" width={40} height={40} />
            <span className="font-bold text-2xl text-foreground">phantom</span>
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-card rounded-full px-2 py-2 shadow-[var(--shadow-soft)] border border-border">
            {navLinks.map((link) => (
              <button
                key={link}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {link}
                {["Features", "Learn", "Company", "Developers"].includes(link) && (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex w-10 h-10 rounded-full bg-card border border-border items-center justify-center hover:bg-secondary transition-colors">
              <Search className="w-4 h-4 text-foreground" />
            </button>
            <Button
              onClick={() => navigate("/auth")}
              className="btn-glow rounded-full px-6 py-2 font-semibold text-base"
            >
              Sign in
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dark Card */}
      <main className="container mx-auto px-4 py-8">
        <div className="hero-dark rounded-[2.5rem] relative overflow-hidden min-h-[600px] flex items-center justify-center px-6 py-24">
          {/* Background video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

          <div className="relative z-10 text-center max-w-4xl">
            <p className="text-white/70 text-base md:text-lg mb-6 animate-fade-in">
              The money app that'll take you places
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-12 leading-[1.05] tracking-tight opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Your home for trading crypto, predictions, and more
            </h1>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-base font-semibold opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Sign in to Phantom
            </Button>
          </div>
        </div>

        {/* Section: Trading */}
        <section className="py-24">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight">
              Trading tools <span className="text-muted-foreground">for everyone</span>
            </h2>
            <button className="text-primary font-semibold text-lg flex items-center gap-2 hover:gap-3 transition-all">
              See more <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Feature video showcase */}
          <div className="relative rounded-[2rem] overflow-hidden mb-8 hero-dark aspect-video">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-contain"
            >
              <source src="/videos/trading.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Buy & Sell", desc: "Buy and sell all types of crypto in an instant.", color: "from-purple-300 to-purple-400" },
              { title: "Explore", desc: "Find trending tokens, top traders, and apps.", color: "from-pink-300 to-purple-400" },
              { title: "Predictions", desc: "Trade big moments in culture with Prediction Markets.", color: "from-amber-300 to-pink-400" },
              { title: "Perps", desc: "Go long, go short, go anywhere with Perps.", color: "from-cyan-300 to-blue-400" },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card p-8 card-hover opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} mb-6`} />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Move Money */}
        <section className="py-24">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight">
              Spend, Send, <span className="text-muted-foreground">& Save</span>
            </h2>
            <button className="text-primary font-semibold text-lg flex items-center gap-2 hover:gap-3 transition-all">
              See more <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden mb-8 hero-dark aspect-video">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-contain"
            >
              <source src="/videos/money.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: "All your money", desc: "One home for all of your money." },
              { title: "Instant transfers", desc: "Instant money transfers. Even pay friends." },
              { title: "Spend anywhere", desc: "Spend wherever Apple Pay, Google Pay, or VISA is accepted." },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card p-8 card-hover opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Security */}
        <section className="py-24">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight">
              Controlled by you, <span className="text-muted-foreground">secured by us</span>
            </h2>
            <button className="text-primary font-semibold text-lg flex items-center gap-2 hover:gap-3 transition-all">
              See more <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden mb-8 hero-dark aspect-video">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-contain"
            >
              <source src="/videos/security.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Self-custodial", desc: "You control your funds. We never have access." },
              { title: "24/7 Support", desc: "Our global Support team is here for you 24/7." },
              { title: "Scam detection", desc: "Flags malicious transactions instantly." },
              { title: "Ledger ready", desc: "Connect Ledger to keep your crypto safer." },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card p-8 card-hover opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="hero-dark rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-primary/30 blur-2xl" />
            <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-pink-500/20 blur-3xl" />

            <p className="text-white/70 text-lg mb-4">Get started.</p>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 tracking-tight">
              Download <span className="text-primary">Phantom.</span>
            </h2>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-base font-semibold"
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Sign in to Phantom
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-center text-muted-foreground text-sm border-t border-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src={logo} alt="Phantom" className="w-6 h-6" width={24} height={24} />
            <span className="font-bold text-foreground">phantom</span>
          </div>
          <p>© 2026 Phantom. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
