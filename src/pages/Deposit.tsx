import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { CreditCard, Loader2, Plus, AlertTriangle } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";

const Deposit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setIsLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Demo Feature",
      description: "This is a placeholder. Real payment processing would be implemented here.",
    });
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg noise-overlay relative">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg noise-overlay relative">
      {/* Background Orbs */}
      <div className="orb w-[400px] h-[400px] bg-success/10 top-20 -right-48 fixed" />
      <div className="orb w-[300px] h-[300px] bg-secondary/10 bottom-20 -left-32 fixed" style={{ animationDelay: '-3s' }} />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center">
                <Plus className="w-7 h-7 text-success" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Add Funds</h1>
                <p className="text-muted-foreground">Deposit money to your wallet</p>
              </div>
            </div>
          </FadeIn>

          <StaggerContainer className="space-y-6">
            {/* Demo Notice */}
            <StaggerItem>
              <div className="glass-card p-4 border-warning/30 bg-warning/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Demo Feature</p>
                    <p className="text-sm text-muted-foreground">
                      This is a placeholder. Real deposits would integrate with a secure payment provider.
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Deposit Form */}
            <StaggerItem>
              <Card className="glass-card border-border/50">
                <CardContent className="p-6">
                  <form onSubmit={handleDeposit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount" className="text-sm font-medium">Amount (USD)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                        <Input
                          id="deposit-amount"
                          type="number"
                          step="0.01"
                          min="1"
                          max="10000"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          className="pl-8 text-2xl h-14 font-display"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter an amount between $1 and $10,000
                      </p>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 50, 100, 500].map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          type="button"
                          variant="outline"
                          onClick={() => setAmount(quickAmount.toString())}
                          className="h-12 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          ${quickAmount}
                        </Button>
                      ))}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 btn-glow rounded-xl font-semibold"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Continue to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Payment Methods */}
            <StaggerItem>
              <div className="glass-card p-6">
                <p className="text-sm text-muted-foreground mb-4">Accepted Payment Methods</p>
                <div className="flex gap-4">
                  {['Visa', 'Mastercard', 'Apple Pay', 'Google Pay'].map((method) => (
                    <div 
                      key={method}
                      className="flex-1 h-12 rounded-xl bg-muted/30 flex items-center justify-center text-sm text-muted-foreground"
                    >
                      {method}
                    </div>
                  ))}
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </main>
    </div>
  );
};

export default Deposit;
