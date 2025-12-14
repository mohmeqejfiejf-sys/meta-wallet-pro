import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Search, Filter, Calendar, User, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

const AdminLogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
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
      await fetchLogs();
      setIsLoading(false);
    };

    checkAdminAndFetch();
  }, [navigate, toast]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'verify_user':
        return <Badge className="bg-green-500/10 text-green-500">توثيق</Badge>;
      case 'unverify_user':
        return <Badge className="bg-yellow-500/10 text-yellow-500">إلغاء توثيق</Badge>;
      case 'adjust_balance':
        return <Badge className="bg-blue-500/10 text-blue-500">تعديل رصيد</Badge>;
      case 'toggle_transfer':
        return <Badge className="bg-purple-500/10 text-purple-500">تعديل تحويل</Badge>;
      case 'approve_withdrawal':
        return <Badge className="bg-green-500/10 text-green-500">قبول سحب</Badge>;
      case 'reject_withdrawal':
        return <Badge className="bg-red-500/10 text-red-500">رفض سحب</Badge>;
      case 'approve_activation':
        return <Badge className="bg-green-500/10 text-green-500">قبول تفعيل</Badge>;
      case 'reject_activation':
        return <Badge className="bg-red-500/10 text-red-500">رفض تفعيل</Badge>;
      case 'delete_user':
        return <Badge variant="destructive">حذف مستخدم</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin_id.includes(searchQuery) ||
      (log.target_user_id && log.target_user_id.includes(searchQuery));
    const matchesFilter = filterAction === "all" || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

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
                  سجلات الأدمن
                </h1>
                <p className="text-muted-foreground mt-1">سجل جميع الإجراءات الإدارية</p>
              </div>
              <Badge variant="outline" className="px-4 py-2">
                <Activity className="w-4 h-4 ml-2" />
                {logs.length} سجل
              </Badge>
            </div>

            {/* Filters */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  فلترة السجلات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="نوع الإجراء" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الإجراءات</SelectItem>
                      {uniqueActions.map((action) => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="border-border/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراء</TableHead>
                      <TableHead>معرف الأدمن</TableHead>
                      <TableHead>المستخدم المستهدف</TableHead>
                      <TableHead>التفاصيل</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(log.created_at).toLocaleString('ar')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {log.admin_id.substring(0, 8)}...
                            </code>
                          </TableCell>
                          <TableCell>
                            {log.target_user_id ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {log.target_user_id.substring(0, 8)}...
                              </code>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.details ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded max-w-xs truncate block">
                                {JSON.stringify(log.details)}
                              </code>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.ip_address || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileText className="w-12 h-12 opacity-50" />
                            <p>لا توجد سجلات</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLogs;