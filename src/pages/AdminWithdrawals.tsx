import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Loader2, CreditCard, Shield } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WithdrawalRequest {
  id: string;
  amount: number;
  card_number: string;
  card_name: string;
  expiry_date: string;
  cvv: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

const AdminWithdrawals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحية للوصول لهذه الصفحة",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);

      // Fetch all withdrawal requests
      const { data: requestsData, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل طلبات السحب",
          variant: "destructive",
        });
      } else if (requestsData) {
        // Fetch user profiles for all requests
        const userIds = [...new Set(requestsData.map(req => req.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const enrichedRequests = requestsData.map(req => ({
          ...req,
          profiles: profilesMap.get(req.user_id) || { email: 'غير متوفر', full_name: null }
        }));

        setRequests(enrichedRequests);
      }

      setIsLoading(false);
    };
    checkAdminAndFetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الطلب بنجاح",
      });
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
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

  if (!isAdmin) {
    return null;
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">لوحة تحكم المسؤول</h1>
              <p className="text-muted-foreground mt-2">
                جميع طلبات السحب من كل المستخدمين
              </p>
            </div>
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
                        <CardDescription className="mt-2">
                          <div className="space-y-1">
                            <div>البريد الإلكتروني: {request.profiles?.email || 'غير متوفر'}</div>
                            {request.profiles?.full_name && (
                              <div>الاسم: {request.profiles.full_name}</div>
                            )}
                            <div>
                              {new Date(request.created_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(request.status)}
                        <Select
                          value={request.status}
                          onValueChange={(value) => handleStatusChange(request.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد الانتظار</SelectItem>
                            <SelectItem value="completed">مكتمل</SelectItem>
                            <SelectItem value="rejected">مرفوض</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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

export default AdminWithdrawals;
