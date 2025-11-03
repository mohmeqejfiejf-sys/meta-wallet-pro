import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/meta-wallet-logo.png";
import { LogOut, Wallet, ArrowLeftRight, Download, Upload } from "lucide-react";

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
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <img src={logo} alt="Meta Wallet" className="w-8 h-8" />
            <span className="font-bold text-xl">Meta Wallet</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <Wallet className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/transfer")}>
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Transfer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/deposit")}>
              <Download className="w-4 h-4 mr-2" />
              Deposit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/withdraw")}>
              <Upload className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;