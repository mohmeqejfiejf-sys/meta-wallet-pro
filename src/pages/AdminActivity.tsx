import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Activity,
  UserPlus,
  ArrowLeftRight,
  Wallet,
  Shield,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'failed';
  metadata?: any;
}

const AdminActivity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const fetchActivityLog = async () => {
    // Fetch recent transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch recent activation requests
    const { data: activations } = await supabase
      .from('activation_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent withdrawal requests
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent users
    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Combine and format activities
    const allActivities: ActivityItem[] = [];

    transactions?.forEach(tx => {
      allActivities.push({
        id: tx.id,
        type: tx.transaction_type,
        title: tx.transaction_type === 'transfer' ? 'تحويل أموال' : 
               tx.transaction_type === 'deposit' ? 'إيداع' : 'سحب',
        description: tx.description || `$${tx.amount}`,
        timestamp: tx.created_at!,
        status: tx.status === 'completed' ? 'success' : 'pending',
      });
    });

    activations?.forEach(act => {
      allActivities.push({
        id: act.id,
        type: 'activation',
        title: 'طلب تفعيل حساب',
        description: `حالة: ${act.status === 'pending' ? 'معلق' : act.status === 'approved' ? 'مقبول' : 'مرفوض'}`,
        timestamp: act.created_at,
        status: act.status === 'pending' ? 'pending' : act.status === 'approved' ? 'success' : 'failed',
      });
    });

    withdrawals?.forEach(wd => {
      allActivities.push({
        id: wd.id,
        type: 'withdrawal_request',
        title: 'طلب سحب',
        description: `$${wd.amount}`,
        timestamp: wd.created_at,
        status: wd.status === 'pending' ? 'pending' : wd.status === 'approved' ? 'success' : 'failed',
      });
    });

    users?.forEach(user => {
      allActivities.push({
        id: user.id,
        type: 'signup',
        title: 'مستخدم جديد',
        description: user.email,
        timestamp: user.created_at!,
        status: 'success',
      });
    });

    // Sort by timestamp
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setActivities(allActivities.slice(0, 50));
  };

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحية للوصول لهذه الصفحة",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await fetchActivityLog();
      setIsLoading(false);
    };

    checkAdminAndFetch();
  }, [navigate, toast]);

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      transfer: ArrowLeftRight,
      deposit: Wallet,
      withdrawal: Wallet,
      withdrawal_request: Wallet,
      activation: Shield,
      signup: UserPlus,
    };
    const Icon = icons[type] || Activity;
    return Icon;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 ml-1" />مكتمل</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 ml-1" />معلق</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 ml-1" />فشل</Badge>;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      transfer: 'bg-blue-500/10 text-blue-500',
      deposit: 'bg-green-500/10 text-green-500',
      withdrawal: 'bg-orange-500/10 text-orange-500',
      withdrawal_request: 'bg-orange-500/10 text-orange-500',
      activation: 'bg-purple-500/10 text-purple-500',
      signup: 'bg-primary/10 text-primary',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        <AdminSidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">سجل النشاط</h1>
                <p className="text-muted-foreground">جميع الأحداث في النظام</p>
              </div>
            </div>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>آخر الأحداث</span>
                  <Badge variant="outline">{activities.length} حدث</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="p-6 space-y-4">
                    {activities.map((activity, index) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div 
                          key={`${activity.type}-${activity.id}-${index}`}
                          className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeColor(activity.type)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <p className="font-medium">{activity.title}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {activity.description}
                                </p>
                              </div>
                              {getStatusBadge(activity.status)}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatDistanceToNow(new Date(activity.timestamp), { 
                                  addSuffix: true, 
                                  locale: ar 
                                })}
                              </span>
                              <span>•</span>
                              <span>
                                {format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminActivity;
