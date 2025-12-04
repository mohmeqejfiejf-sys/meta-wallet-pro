import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { 
  Loader2, 
  ArrowLeftRight, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Download,
  Calendar
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Transaction {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  transaction_type: string;
  status: string;
  description: string | null;
  created_at: string;
  from_email?: string;
  to_email?: string;
}

const AdminTransactions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [totalVolume, setTotalVolume] = useState(0);

  const fetchTransactions = async () => {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterType !== "all") {
      query = query.eq('transaction_type', filterType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    // Get user emails
    const userIds = new Set<string>();
    data?.forEach(tx => {
      if (tx.from_user_id) userIds.add(tx.from_user_id);
      if (tx.to_user_id) userIds.add(tx.to_user_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', Array.from(userIds));

    const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

    const enrichedTransactions = data?.map(tx => ({
      ...tx,
      from_email: tx.from_user_id ? emailMap.get(tx.from_user_id) : undefined,
      to_email: tx.to_user_id ? emailMap.get(tx.to_user_id) : undefined,
    })) || [];

    setTransactions(enrichedTransactions);
    setTotalVolume(data?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0);
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
      await fetchTransactions();
      setIsLoading(false);
    };

    checkAdminAndFetch();
  }, [navigate, toast, filterType]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer': return <ArrowUpRight className="w-4 h-4" />;
      case 'deposit': return <ArrowDownRight className="w-4 h-4" />;
      case 'withdrawal': return <Wallet className="w-4 h-4" />;
      default: return <ArrowLeftRight className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      transfer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      deposit: "bg-green-500/10 text-green-500 border-green-500/20",
      withdrawal: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };
    const labels: Record<string, string> = {
      transfer: "تحويل",
      deposit: "إيداع",
      withdrawal: "سحب",
    };
    return (
      <Badge variant="outline" className={styles[type] || ""}>
        {getTypeIcon(type)}
        <span className="mr-1">{labels[type] || type}</span>
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter(tx =>
    tx.from_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.to_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['التاريخ', 'النوع', 'من', 'إلى', 'المبلغ', 'الوصف'];
    const rows = filteredTransactions.map(tx => [
      format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm'),
      tx.transaction_type,
      tx.from_email || '-',
      tx.to_email || '-',
      tx.amount,
      tx.description || '-'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ArrowLeftRight className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">سجل التحويلات</h1>
                  <p className="text-muted-foreground">جميع التحويلات في النظام</p>
                </div>
              </div>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 ml-2" />
                تصدير CSV
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">إجمالي التحويلات</div>
                  <div className="text-2xl font-bold">{transactions.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">إجمالي الحجم</div>
                  <div className="text-2xl font-bold">${totalVolume.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">المعروض</div>
                  <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث بالبريد أو الوصف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="نوع التحويل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="transfer">تحويلات</SelectItem>
                      <SelectItem value="deposit">إيداعات</SelectItem>
                      <SelectItem value="withdrawal">سحوبات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">من</TableHead>
                      <TableHead className="text-right">إلى</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          لا توجد تحويلات
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(tx.transaction_type)}</TableCell>
                          <TableCell className="text-sm">{tx.from_email || '-'}</TableCell>
                          <TableCell className="text-sm">{tx.to_email || '-'}</TableCell>
                          <TableCell>
                            <span className="font-bold text-primary">${Number(tx.amount).toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {tx.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))
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

export default AdminTransactions;
