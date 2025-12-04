import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Settings,
  Shield,
  Bell,
  Lock,
  Globe,
  Database,
  Wallet,
  Mail,
  Save
} from "lucide-react";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    twoFactorRequired: false,
    minTransferAmount: "1",
    maxTransferAmount: "10000",
    dailyTransferLimit: "50000",
    withdrawalFee: "2.5",
  });

  useEffect(() => {
    const checkAdmin = async () => {
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
      setIsLoading(false);
    };

    checkAdmin();
  }, [navigate, toast]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "تم الحفظ",
      description: "تم حفظ الإعدادات بنجاح",
    });
    
    setIsSaving(false);
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">إعدادات النظام</h1>
                  <p className="text-muted-foreground">تكوين وإدارة إعدادات المنصة</p>
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                حفظ التغييرات
              </Button>
            </div>

            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  الإعدادات العامة
                </CardTitle>
                <CardDescription>
                  إعدادات عامة للمنصة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="font-medium">وضع الصيانة</label>
                    <p className="text-sm text-muted-foreground">
                      تعطيل الوصول للمنصة مؤقتاً
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.maintenanceMode && (
                      <Badge variant="destructive">مفعل</Badge>
                    )}
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, maintenanceMode: checked })
                      }
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="font-medium">تسجيل المستخدمين الجدد</label>
                    <p className="text-sm text-muted-foreground">
                      السماح بتسجيل حسابات جديدة
                    </p>
                  </div>
                  <Switch
                    checked={settings.registrationEnabled}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, registrationEnabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  إعدادات الأمان
                </CardTitle>
                <CardDescription>
                  تكوين خيارات الأمان
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="font-medium">المصادقة الثنائية إلزامية</label>
                    <p className="text-sm text-muted-foreground">
                      مطالبة جميع المستخدمين بتفعيل 2FA
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorRequired}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, twoFactorRequired: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  إعدادات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="font-medium">إشعارات البريد الإلكتروني</label>
                    <p className="text-sm text-muted-foreground">
                      إرسال إشعارات بالبريد للمستخدمين
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, emailNotifications: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Transaction Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  إعدادات التحويلات
                </CardTitle>
                <CardDescription>
                  تكوين حدود وقواعد التحويلات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الحد الأدنى للتحويل ($)</label>
                    <Input
                      type="number"
                      value={settings.minTransferAmount}
                      onChange={(e) => 
                        setSettings({ ...settings, minTransferAmount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الحد الأقصى للتحويل ($)</label>
                    <Input
                      type="number"
                      value={settings.maxTransferAmount}
                      onChange={(e) => 
                        setSettings({ ...settings, maxTransferAmount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الحد اليومي للتحويلات ($)</label>
                    <Input
                      type="number"
                      value={settings.dailyTransferLimit}
                      onChange={(e) => 
                        setSettings({ ...settings, dailyTransferLimit: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رسوم السحب (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.withdrawalFee}
                      onChange={(e) => 
                        setSettings({ ...settings, withdrawalFee: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  معلومات النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">إصدار النظام</p>
                    <p className="font-mono font-bold">v2.0.1</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">قاعدة البيانات</p>
                    <p className="font-mono font-bold text-green-500">متصل</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">البيئة</p>
                    <p className="font-mono font-bold">Production</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">آخر تحديث</p>
                    <p className="font-mono font-bold">2025-12-04</p>
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

export default AdminSettings;
