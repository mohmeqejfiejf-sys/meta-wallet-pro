import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Loader2, CreditCard } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  amount: number;
  card_number: string;
  card_name: string;
  expiry_date: string;
  cvv: string;
  status: string;
  created_at: string;
}

const WithdrawalRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      const { data: requestsData, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل طلبات السحب",
          variant: "destructive",
        });
      } else if (requestsData) {
        setRequests(requestsData);
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
  }, [navigate, toast]);

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      completed: "default",
      rejected: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "قيد الانتظار",
      completed: "مكتمل",
      rejected: "مرفوض",
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">طلبات السحب</h1>
            <p className="text-muted-foreground mt-2">
              جميع طلبات السحب الخاصة بك
            </p>
          </div>

          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">لا توجد طلبات سحب حتى الآن</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          طلب سحب ${request.amount.toFixed(2)}
                        </CardTitle>
                        <CardDescription>
                          {new Date(request.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">رقم البطاقة</p>
                          <p className="font-mono">{request.card_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">اسم حامل البطاقة</p>
                          <p>{request.card_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                          <p className="font-mono">{request.expiry_date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CVV</p>
                          <p className="font-mono">{request.cvv}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WithdrawalRequests;
