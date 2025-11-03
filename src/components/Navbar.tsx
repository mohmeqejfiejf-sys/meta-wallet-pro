import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/meta-wallet-logo-dark.png";
import { LogOut, LayoutDashboard, Send, Download, Upload } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <img src={logo} alt="Meta Wallet" className="w-8 h-8" />
            <span className="font-bold text-xl">Meta Wallet</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/transfer")}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/deposit")}>
              <Download className="w-4 h-4 mr-2" />
              Add
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/withdraw")}>
              <Upload className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;