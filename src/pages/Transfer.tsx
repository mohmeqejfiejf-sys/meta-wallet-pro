import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { ArrowRight, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
      
      // Fetch current balance
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

      // Refresh balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();
      
      if (walletData) {
        setBalance(parseFloat(walletData.balance.toString()));
      }

      // Reset form
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Send Money</CardTitle>
              <CardDescription>
                Transfer funds to another Meta Wallet user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 rounded-xl bg-card border border-border">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
              </div>

              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Email</Label>
                  <Input
                    id="recipient"
                    type="email"
                    placeholder="recipient@email.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the email address of the recipient
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (USD)</Label>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this transfer for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Send Money
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Transfer;