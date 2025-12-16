import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Wallet, Loader2, CreditCard, Calendar, Lock, User } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();
      
      if (walletData) {
        setBalance(parseFloat(walletData.balance.toString()));
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

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const withdrawAmount = parseFloat(amount);
    
    if (withdrawAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to withdraw this amount.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: session.user.id,
          amount: withdrawAmount,
          card_number: cardNumber,
          card_name: cardName,
          expiry_date: expiryDate,
          cvv: cvv,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Sent",
        description: "Your request will be processed soon.",
      });
      
      navigate("/withdrawal-requests");
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="orb w-[400px] h-[400px] bg-destructive/10 top-20 -right-48 fixed" />
      <div className="orb w-[300px] h-[300px] bg-secondary/10 bottom-20 -left-32 fixed" style={{ animationDelay: '-3s' }} />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-destructive/20 to-secondary/20 flex items-center justify-center">
                <Wallet className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Withdraw Funds</h1>
                <p className="text-muted-foreground">Enter card details to request withdrawal</p>
              </div>
            </div>
          </FadeIn>

          <StaggerContainer className="space-y-6">
            {/* Balance Card */}
            <StaggerItem>
              <div className="glass-card gradient-border p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="font-display text-3xl font-bold gradient-text">${balance.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Withdrawal Form */}
            <StaggerItem>
              <Card className="glass-card border-border/50">
                <CardContent className="p-6">
                  <form onSubmit={handleWithdraw} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount" className="text-sm font-medium">Withdrawal Amount (USD)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          step="0.01"
                          min="1"
                          max={balance}
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          className="pl-8"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum: ${balance.toFixed(2)}
                      </p>
                    </div>

                    {/* Card Details Section */}
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <span className="font-medium">Card Details</span>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="card-number" className="text-sm font-medium">Card Number</Label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="card-number"
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              required
                              className="pl-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="card-name" className="text-sm font-medium">Cardholder Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="card-name"
                              type="text"
                              placeholder="Name on card"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              required
                              className="pl-11"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry" className="text-sm font-medium">Expiry Date</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="expiry"
                                type="text"
                                placeholder="MM/YY"
                                maxLength={5}
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                required
                                className="pl-11"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cvv" className="text-sm font-medium">CVV</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="cvv"
                                type="text"
                                placeholder="123"
                                maxLength={4}
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value)}
                                required
                                className="pl-11"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 btn-glow rounded-xl font-semibold" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Wallet className="w-5 h-5" />
                          Submit Withdrawal Request
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </main>
    </div>
  );
};

export default Withdraw;
