import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Wallet, Loader2 } from "lucide-react";


const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
    };
    checkUser();
  }, [navigate]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const withdrawAmount = parseFloat(amount);
    
    if (withdrawAmount > balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough funds to withdraw this amount.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulate withdrawal processing
    setTimeout(() => {
      toast({
        title: "Withdrawal initiated",
        description: "Your withdrawal is being processed and will arrive in 1-2 business days.",
      });
      setIsLoading(false);
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Withdraw Funds</CardTitle>
              <CardDescription>
                Transfer money from your wallet to your bank account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 rounded-xl bg-card border border-border">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
              </div>


              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Withdrawal Amount (USD)</Label>
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
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Card Details
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="card-name">Cardholder Name</Label>
                    <Input
                      id="card-name"
                      type="text"
                      placeholder="JOHN DOE"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                        setCardNumber(formatted);
                      }}
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 2) {
                            setExpiryDate(value);
                          } else {
                            setExpiryDate(value.slice(0, 2) + '/' + value.slice(2, 4));
                          }
                        }}
                        maxLength={5}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Withdraw ${amount || '0.00'}
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

export default Withdraw;