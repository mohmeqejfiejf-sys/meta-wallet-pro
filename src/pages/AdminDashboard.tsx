import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatsCard from "@/components/admin/StatsCard";
import RecentActivityFeed from "@/components/admin/RecentActivityFeed";
import QuickActions from "@/components/admin/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  totalUsers: number;
  totalBalance: number;
  totalTransactions: number;
  pendingWithdrawals: number;
  pendingActivations: number;
  activeUsers: number;
  disabledUsers: number;
  todayTransactions: number;
  todayDeposits: number;
  todayWithdrawals: number;
}

interface Activity {
  id: string;
  type: "transfer" | "deposit" | "withdrawal" | "signup" | "activation";
  description: string;
  amount?: number;
  created_at: string;
  user_email?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))', '#22c55e', '#f59e0b'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    pendingWithdrawals: 0,
    pendingActivations: 0,
    activeUsers: 0,
    disabledUsers: 0,
    todayTransactions: 0,
    todayDeposits: 0,
    todayWithdrawals: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      // Fetch users count
      const { data: users, count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Fetch wallets data
      const { data: wallets } = await supabase
        .from('wallets')
        .select('balance, transfer_disabled');

      const totalBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) || 0;
      const disabledCount = wallets?.filter(w => w.transfer_disabled).length || 0;

      // Fetch transactions
      const { data: transactions, count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50);

      // Today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const { count: todayTxCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .gte('created_at', todayStr);

      // Fetch pending withdrawals
      const { count: pendingWithdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      // Fetch pending activations
      const { count: pendingActivations } = await supabase
        .from('activation_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      setStats({
        totalUsers: usersCount || 0,
        totalBalance,
        totalTransactions: transactionsCount || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        pendingActivations: pendingActivations || 0,
        activeUsers: (usersCount || 0) - disabledCount,
        disabledUsers: disabledCount,
        todayTransactions: todayTxCount || 0,
        todayDeposits: 0,
        todayWithdrawals: 0,
      });

      // Format activities
      const formattedActivities: Activity[] = (transactions || []).slice(0, 20).map(tx => ({
        id: tx.id,
        type: tx.transaction_type as any,
        description: tx.description || `${tx.transaction_type} - $${tx.amount}`,
        amount: Number(tx.amount),
        created_at: tx.created_at!,
      }));
      setActivities(formattedActivities);

      // Generate chart data for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          name: date.toLocaleDateString('ar', { weekday: 'short' }),
          transactions: Math.floor(Math.random() * 50) + 10,
          volume: Math.floor(Math.random() * 5000) + 1000,
        };
      });
      setChartData(last7Days);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

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
      await fetchDashboardData();
      setIsLoading(false);
    };

    checkAdminAndFetch();
  }, [navigate, toast]);

  const pieData = [
    { name: 'مستخدمين نشطين', value: stats.activeUsers },
    { name: 'محظورين', value: stats.disabledUsers },
  ];

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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">لوحة التحكم</h1>
                <p className="text-muted-foreground mt-1">مرحباً بك في لوحة إدارة MetaWallet</p>
              </div>
              <Badge variant="outline" className="px-4 py-2">
                <Activity className="w-4 h-4 ml-2" />
                آخر تحديث: الآن
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="إجمالي المستخدمين"
                value={stats.totalUsers}
                icon={Users}
                variant="primary"
                trend={{ value: 12, isPositive: true }}
              />
              <StatsCard
                title="إجمالي الأرصدة"
                value={`$${stats.totalBalance.toFixed(2)}`}
                icon={DollarSign}
                variant="success"
                trend={{ value: 8, isPositive: true }}
              />
              <StatsCard
                title="التحويلات اليوم"
                value={stats.todayTransactions}
                icon={ArrowLeftRight}
                variant="default"
              />
              <StatsCard
                title="طلبات معلقة"
                value={stats.pendingWithdrawals + stats.pendingActivations}
                icon={Clock}
                variant={stats.pendingWithdrawals + stats.pendingActivations > 0 ? "warning" : "default"}
              />
            </div>

            {/* Alerts */}
            {(stats.pendingWithdrawals > 0 || stats.pendingActivations > 0) && (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium">تنبيه: لديك طلبات تحتاج مراجعة</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.pendingWithdrawals > 0 && `${stats.pendingWithdrawals} طلب سحب معلق`}
                        {stats.pendingWithdrawals > 0 && stats.pendingActivations > 0 && ' • '}
                        {stats.pendingActivations > 0 && `${stats.pendingActivations} طلب تفعيل معلق`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Area Chart */}
              <Card className="lg:col-span-2 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    نشاط التحويلات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorTransactions)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    توزيع المستخدمين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm">نشطين</span>
                      </div>
                      <span className="font-bold">{stats.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted" />
                        <span className="text-sm">محظورين</span>
                      </div>
                      <span className="font-bold">{stats.disabledUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivityFeed activities={activities} />
              </div>
              <QuickActions onRefresh={fetchDashboardData} />
            </div>

            {/* System Health */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  حالة النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>قاعدة البيانات</span>
                      <span className="text-green-500">متصل</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>الخوادم</span>
                      <span className="text-green-500">يعمل</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>الأمان</span>
                      <span className="text-green-500">محمي</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
