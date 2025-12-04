import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Loader2, Users, User, Trash2, Plus, Minus, Ban, CheckCircle, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string | null;
  wallet?: {
    balance: number;
    transfer_disabled: boolean;
  };
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    // Fetch wallets for all users
    const userIds = profilesData.map(p => p.id);
    const { data: walletsData } = await supabase
      .from('wallets')
      .select('user_id, balance, transfer_disabled')
      .in('user_id', userIds);

    const walletsMap = new Map(walletsData?.map(w => [w.user_id, w]) || []);

    const enrichedUsers = profilesData.map(profile => ({
      ...profile,
      wallet: walletsMap.get(profile.id)
    }));

    setUsers(enrichedUsers);
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
      await fetchUsers();
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

  const handleAdjustBalance = async () => {
    if (!selectedUser || !adjustAmount) return;
    
    setIsProcessing(true);
    const amount = adjustType === "add" ? parseFloat(adjustAmount) : -parseFloat(adjustAmount);
    
    const { data, error } = await supabase.rpc('admin_adjust_balance', {
      target_user_id: selectedUser.id,
      amount_change: amount,
      adjustment_description: adjustDescription || (adjustType === "add" ? "إضافة رصيد بواسطة الأدمن" : "خصم رصيد بواسطة الأدمن")
    });

    if (error) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: `تم ${adjustType === "add" ? "إضافة" : "خصم"} ${adjustAmount} من رصيد المستخدم`,
      });
      await fetchUsers();
    }
    
    setIsProcessing(false);
    setShowAdjustDialog(false);
    setAdjustAmount("");
    setAdjustDescription("");
    setSelectedUser(null);
  };

  const handleToggleTransfer = async (user: UserData) => {
    const newStatus = !user.wallet?.transfer_disabled;
    
    const { error } = await supabase.rpc('admin_toggle_transfer', {
      target_user_id: user.id,
      disabled: newStatus
    });

    if (error) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: newStatus ? "تم تعطيل التحويلات لهذا الحساب" : "تم تفعيل التحويلات لهذا الحساب",
      });
      await fetchUsers();
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    
    // Delete user from auth (this will cascade to profiles due to trigger)
    const { error } = await supabase.auth.admin.deleteUser(selectedUser.id);

    if (error) {
      // If admin API fails, try deleting profile directly
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
      
      if (profileError) {
        toast({
          title: "خطأ",
          description: "لا يمكن حذف هذا المستخدم",
          variant: "destructive",
        });
        setIsProcessing(false);
        setShowDeleteDialog(false);
        return;
      }
    }

    toast({
      title: "تم بنجاح",
      description: "تم حذف المستخدم",
    });
    
    await fetchUsers();
    setIsProcessing(false);
    setShowDeleteDialog(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
              <p className="text-muted-foreground mt-2">
                إدارة حسابات المستخدمين والأرصدة
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="البحث بالبريد الإلكتروني أو الاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {user.full_name || user.email}
                        </CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={user.wallet?.transfer_disabled ? "destructive" : "default"}>
                        {user.wallet?.transfer_disabled ? "التحويلات معطلة" : "نشط"}
                      </Badge>
                      <span className="text-lg font-bold text-primary">
                        ${user.wallet?.balance?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setAdjustType("add");
                        setShowAdjustDialog(true);
                      }}
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة رصيد
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setAdjustType("deduct");
                        setShowAdjustDialog(true);
                      }}
                    >
                      <Minus className="w-4 h-4 ml-1" />
                      خصم رصيد
                    </Button>
                    <Button
                      size="sm"
                      variant={user.wallet?.transfer_disabled ? "default" : "secondary"}
                      onClick={() => handleToggleTransfer(user)}
                    >
                      {user.wallet?.transfer_disabled ? (
                        <>
                          <CheckCircle className="w-4 h-4 ml-1" />
                          تفعيل التحويلات
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4 ml-1" />
                          تعطيل التحويلات
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف الحساب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Adjust Balance Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustType === "add" ? "إضافة رصيد" : "خصم رصيد"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">المبلغ</label>
              <Input
                type="number"
                placeholder="0.00"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الوصف (اختياري)</label>
              <Input
                placeholder="سبب التعديل..."
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleAdjustBalance} 
              disabled={isProcessing || !adjustAmount}
            >
              {isProcessing && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف حساب {selectedUser?.email} نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
