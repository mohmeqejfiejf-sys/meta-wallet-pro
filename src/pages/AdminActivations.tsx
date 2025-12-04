import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Loader2, ShieldCheck, Shield, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivationRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

const AdminActivations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<ActivationRequest[]>([]);

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

      // Fetch all activation requests
      const { data: requestsData, error } = await supabase
        .from('activation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activation requests:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل طلبات التفعيل",
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
    const { data: { session } } = await supabase.auth.getSession();
    
    // Find the request to get user info
    const request = requests.find(r => r.id === requestId);
    
    const { error } = await supabase
      .from('activation_requests')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: session?.user?.id
      })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive",
      });
    } else {
      // Send email notification if approved or rejected
      if ((newStatus === 'approved' || newStatus === 'rejected') && request?.profiles?.email) {
        try {
          await supabase.functions.invoke('send-activation-email', {
            body: {
              email: request.profiles.email,
              fullName: request.profiles.full_name,
              status: newStatus
            }
          });
          console.log('Activation email sent successfully');
        } catch (emailError) {
          console.error('Failed to send activation email:', emailError);
        }
      }
      
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
      approved: "default",
      rejected: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "قيد المراجعة",
      approved: "تم التفعيل",
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">طلبات تفعيل الحسابات</h1>
                <p className="text-muted-foreground">
                  مراجعة والموافقة على طلبات تفعيل الحسابات
                </p>
              </div>
            </div>

          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">لا توجد طلبات تفعيل حتى الآن</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {request.profiles?.full_name || request.profiles?.email || 'مستخدم'}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div>{request.profiles?.email || 'غير متوفر'}</div>
                            <div className="text-xs mt-1">
                              {new Date(request.created_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(request.status)}
                        <Select
                          value={request.status}
                          onValueChange={(value) => handleStatusChange(request.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد المراجعة</SelectItem>
                            <SelectItem value="approved">موافقة</SelectItem>
                            <SelectItem value="rejected">رفض</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminActivations;