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
        title: "رصيد غير كافٍ",
        description: "ليس لديك رصيد كافٍ لسحب هذا المبلغ.",
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
        title: "تم إرسال طلب السحب",
        description: "سيتم معالجة طلبك قريباً. يمكنك متابعة الطلبات من صفحة طلبات السحب.",
      });
      
      navigate("/withdrawal-requests");
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال طلب السحب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-2xl">سحب الأموال</CardTitle>
              <CardDescription>
                أدخل معلومات البطاقة لإرسال طلب السحب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 rounded-xl bg-card border border-border">
                <p className="text-sm text-muted-foreground">الرصيد المتاح</p>
                <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">مبلغ السحب (USD)</Label>
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
                  <p className="text-sm text-muted-foreground">
                    الحد الأقصى: ${balance.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-number">رقم البطاقة</Label>
                  <Input
                    id="card-number"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-name">اسم حامل البطاقة</Label>
                  <Input
                    id="card-name"
                    type="text"
                    placeholder="الاسم كما هو مكتوب على البطاقة"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                    <Input
                      id="expiry"
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Wallet className="w-4 h-4 mr-2" />
                  {isSubmitting ? "جاري الإرسال..." : "إرسال طلب السحب"}
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