import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/meta-wallet-logo-new.png";
import { LogOut, LayoutDashboard, Send, Download, Upload, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
    { icon: Send, label: "Send", path: "/transfer" },
    { icon: Download, label: "Add", path: "/deposit" },
    { icon: Upload, label: "Withdraw", path: "/withdraw" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate("/dashboard")}
          >
            <div className="relative">
              <img src={logo} alt="Meta Wallet" className="w-10 h-10 rounded-xl transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl gradient-text hidden sm:block">MetaWallet</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button 
                key={item.path}
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative px-4 py-2 rounded-xl transition-all duration-300",
                  isActive(item.path) 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
                {isActive(item.path) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full" />
                )}
              </Button>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 ml-2"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-card/95 backdrop-blur-xl border-b border-border/50 p-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Button 
                  key={item.path}
                  variant="ghost" 
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "justify-start rounded-xl",
                    isActive(item.path) 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              ))}
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="justify-start text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
