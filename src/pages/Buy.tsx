import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { TrendingUp, Loader2 } from "lucide-react";

const CRYPTO_OPTIONS = [
  { symbol: "BTC", name: "Bitcoin", price: 45000, icon: "₿" },
  { symbol: "ETH", name: "Ethereum", price: 2800, icon: "Ξ" },
  { symbol: "BNB", name: "Binance Coin", price: 320, icon: "BNB" },
  { symbol: "USDT", name: "Tether", price: 1, icon: "₮" },
  { symbol: "SOL", name: "Solana", price: 110, icon: "◎" },
  { symbol: "ADA", name: "Cardano", price: 0.55, icon: "₳" },
];

const Buy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [balance, setBalance] = useState(0);
  const [cryptoAmount, setCryptoAmount] = useState("0");

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

  useEffect(() => {
    if (amount && selectedCrypto) {
      const crypto = CRYPTO_OPTIONS.find(c => c.symbol === selectedCrypto);
      if (crypto) {
        const calculatedAmount = (parseFloat(amount) / crypto.price).toFixed(8);
        setCryptoAmount(calculatedAmount);
      }
    } else {
      setCryptoAmount("0");
    }
  }, [amount, selectedCrypto]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const buyAmount = parseFloat(amount);
    
    if (buyAmount > balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough funds to complete this purchase.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!selectedCrypto) {
      toast({
        title: "Select cryptocurrency",
        description: "Please select a cryptocurrency to buy.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulate purchase processing
    setTimeout(() => {
      const crypto = CRYPTO_OPTIONS.find(c => c.symbol === selectedCrypto);
      toast({
        title: "Purchase successful",
        description: `You bought ${cryptoAmount} ${crypto?.symbol} for $${buyAmount.toFixed(2)}`,
      });
      setIsLoading(false);
      navigate("/dashboard");
    }, 2000);
  };

  const selectedCryptoData = CRYPTO_OPTIONS.find(c => c.symbol === selectedCrypto);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Buy Cryptocurrency</CardTitle>
              <CardDescription>
                Purchase digital assets with your wallet balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 rounded-xl bg-card border border-border">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
              </div>

              <form onSubmit={handleBuy} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="crypto">Select Cryptocurrency</Label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CRYPTO_OPTIONS.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{crypto.icon}</span>
                            <span>{crypto.name} ({crypto.symbol})</span>
                            <span className="text-muted-foreground ml-auto">${crypto.price.toLocaleString()}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
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

                {selectedCrypto && amount && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">You will receive</p>
                        <p className="text-2xl font-bold">
                          {cryptoAmount} {selectedCryptoData?.symbol}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      1 {selectedCryptoData?.symbol} = ${selectedCryptoData?.price.toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>${amount || '0.00'}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !selectedCrypto}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Buy {selectedCryptoData?.name || 'Cryptocurrency'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  This is a simulated purchase. No real cryptocurrency will be transferred.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Buy;
