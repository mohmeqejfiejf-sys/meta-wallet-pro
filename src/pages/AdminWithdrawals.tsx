import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Loader2, CreditCard, Wallet, X, Check, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  rejection_reason?: string | null;
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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleApprove = async (request: WithdrawalRequest) => {
    setIsUpdating(true);
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ 
        status: 'completed', 
        updated_at: new Date().toISOString(),
        rejection_reason: null 
      })
      .eq('id', request.id);

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الموافقة على الطلب",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تمت الموافقة",
        description: "تمت الموافقة على طلب السحب بنجاح",
      });
      setRequests(requests.map(req => 
        req.id === request.id ? { ...req, status: 'completed', rejection_reason: null } : req
      ));
    }
    setIsUpdating(false);
  };

  const openRejectDialog = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (!rejectionReason.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة سبب الرفض",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ 
        status: 'rejected', 
        updated_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim()
      })
      .eq('id', selectedRequest.id);

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفض الطلب",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم الرفض",
        description: "تم رفض طلب السحب",
      });
      setRequests(requests.map(req => 
        req.id === selectedRequest.id ? { ...req, status: 'rejected', rejection_reason: rejectionReason.trim() } : req
      ));
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
    }
    setIsUpdating(false);
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
      
      <div className="flex">
        <AdminSidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">طلبات السحب</h1>
                <p className="text-muted-foreground">
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
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          طلب سحب ${request.amount.toFixed(2)}
                          {getStatusBadge(request.status)}
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
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(request)}
                            disabled={isUpdating}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(request)}
                            disabled={isUpdating}
                          >
                            <X className="w-4 h-4 mr-1" />
                            رفض
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      
                      {request.status === 'rejected' && request.rejection_reason && (
                        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                            <div>
                              <p className="font-medium text-destructive">سبب الرفض:</p>
                              <p className="text-sm text-muted-foreground">{request.rejection_reason}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              رفض طلب السحب
            </DialogTitle>
            <DialogDescription>
              سيتم إبلاغ المستخدم بسبب الرفض
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">سبب الرفض *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="اكتب سبب رفض طلب السحب..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            
            {selectedRequest && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">تفاصيل الطلب:</p>
                <p className="font-medium">المبلغ: ${selectedRequest.amount.toFixed(2)}</p>
                <p className="text-sm">المستخدم: {selectedRequest.profiles?.email}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isUpdating || !rejectionReason.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الرفض...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  تأكيد الرفض
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
