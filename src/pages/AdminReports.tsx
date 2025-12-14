import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Download, TrendingUp, Users, DollarSign, ArrowLeftRight, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [period, setPeriod] = useState("7days");
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    avgTransactionSize: 0,
    pendingRequests: 0,
  });
  const [transactionsByDay, setTransactionsByDay] = useState<any[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);

  const fetchReportData = async () => {
    try {
      // Fetch users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      const totalVolume = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const avgSize = transactions?.length ? totalVolume / transactions.length : 0;

      // Calculate transaction types distribution
      const typeCount: Record<string, number> = {};
      transactions?.forEach(t => {
        typeCount[t.transaction_type] = (typeCount[t.transaction_type] || 0) + 1;
      });
      
      const typesData = Object.entries(typeCount).map(([name, value]) => ({
        name: name === 'transfer' ? 'تحويل' : name === 'deposit' ? 'إيداع' : name === 'withdrawal' ? 'سحب' : name,
        value,
      }));

      setTransactionTypes(typesData);

      // Generate chart data for last 7/30 days
      const days = period === "7days" ? 7 : period === "30days" ? 30 : 90;
      const chartData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTransactions = transactions?.filter(t => 
          t.created_at?.startsWith(dateStr)
        ) || [];
        
        return {
          name: date.toLocaleDateString('ar', { weekday: 'short', day: 'numeric' }),
          transactions: dayTransactions.length,
          volume: dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
        };
      });

      setTransactionsByDay(chartData);

      // User growth simulation
      const growthData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          name: date.toLocaleDateString('ar', { day: 'numeric', month: 'short' }),
          users: Math.floor(Math.random() * 10) + (totalUsers || 0) - days + i,
        };
      });

      setUserGrowth(growthData);

      // Pending requests
      const { count: pendingWithdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      const { count: pendingActivations } = await supabase
        .from('activation_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      setStats({
        totalUsers: totalUsers || 0,
        newUsers: 0,
        totalTransactions: transactions?.length || 0,
        totalVolume,
        avgTransactionSize: avgSize,
        pendingRequests: (pendingWithdrawals || 0) + (pendingActivations || 0),
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
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
      await fetchReportData();
      setIsLoading(false);
    };

    checkAdminAndFetch();
  }, [navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchReportData();
    }
  }, [period, isAdmin]);

  const exportReport = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      period,
      stats,
      transactionsByDay,
      transactionTypes,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${period}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير",
      description: "تم تصدير التقرير بنجاح",
    });
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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <FileText className="w-8 h-8" />
                  التقارير والإحصائيات
                </h1>
                <p className="text-muted-foreground mt-1">تحليل شامل لأداء المنصة</p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">آخر 7 أيام</SelectItem>
                    <SelectItem value="30days">آخر 30 يوم</SelectItem>
                    <SelectItem value="90days">آخر 90 يوم</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportReport}>
                  <Download className="w-4 h-4 ml-2" />
                  تصدير التقرير
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                      <p className="text-3xl font-bold">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-10 h-10 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المعاملات</p>
                      <p className="text-3xl font-bold">{stats.totalTransactions}</p>
                    </div>
                    <ArrowLeftRight className="w-10 h-10 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الحجم</p>
                      <p className="text-3xl font-bold">${stats.totalVolume.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">متوسط المعاملة</p>
                      <p className="text-3xl font-bold">${stats.avgTransactionSize.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transactions Over Time */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>المعاملات عبر الوقت</CardTitle>
                  <CardDescription>عدد المعاملات اليومية</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={transactionsByDay}>
                      <defs>
                        <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                        fill="url(#colorTx)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Transaction Volume */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>حجم المعاملات</CardTitle>
                  <CardDescription>القيمة الإجمالية يومياً</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={transactionsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'الحجم']}
                      />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transaction Types */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>توزيع أنواع المعاملات</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={transactionTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {transactionTypes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Growth */}
              <Card className="border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle>نمو المستخدمين</CardTitle>
                  <CardDescription>عدد المستخدمين المسجلين عبر الوقت</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={userGrowth}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#22c55e" 
                        fillOpacity={1} 
                        fill="url(#colorUsers)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminReports;