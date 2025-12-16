import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { ArrowRight, Loader2, Send, Wallet, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";

const Transfer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [balance, setBalance] = useState(0);

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
    };
    
    checkUser();
  }, [navigate]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const transferAmount = parseFloat(amount);
      
      if (transferAmount <= 0) {
        throw new Error('Amount must be greater than zero');
      }
      
      if (transferAmount > balance) {
        throw new Error('Insufficient balance');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('transfer-funds', {
        body: {
          to_email: recipientEmail,
          amount: transferAmount,
          description: description || `Transfer to ${recipientEmail}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Transfer successful!",
        description: `Successfully sent $${transferAmount.toFixed(2)} to ${recipientEmail}`,
      });

      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();
      
      if (walletData) {
        setBalance(parseFloat(walletData.balance.toString()));
      }

      setRecipientEmail("");
      setAmount("");
      setDescription("");
      
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      toast({
        title: "Transfer failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg noise-overlay relative">
      {/* Background Orbs */}
      <div className="orb w-[400px] h-[400px] bg-primary/10 top-20 -right-48 fixed" />
      <div className="orb w-[300px] h-[300px] bg-secondary/10 bottom-20 -left-32 fixed" style={{ animationDelay: '-3s' }} />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Send className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Send Money</h1>
                <p className="text-muted-foreground">Transfer funds to another user</p>
              </div>
            </div>
          </FadeIn>

          <StaggerContainer className="space-y-6">
            {/* Balance Card */}
            <StaggerItem>
              <div className="glass-card gradient-border p-6">
                <div className="flex items-center justify-between">
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
              </div>
            </StaggerItem>

            {/* Transfer Form */}
            <StaggerItem>
              <Card className="glass-card border-border/50">
                <CardContent className="p-6">
                  <form onSubmit={handleTransfer} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="text-sm font-medium">Recipient Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="recipient"
                          type="email"
                          placeholder="recipient@email.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          required
                          className="pl-11"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter the email address of the recipient
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium">Amount (USD)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={balance}
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="What's this transfer for?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="resize-none bg-input/50 border-border/50 rounded-xl focus:border-primary/50"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 btn-glow rounded-xl font-semibold" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Send Money
                          <ArrowRight className="w-5 h-5" />
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

export default Transfer;
