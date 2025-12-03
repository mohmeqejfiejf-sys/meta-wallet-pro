import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, User as UserIcon, ShieldCheck, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activationRequested, setActivationRequested] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setFullName(profile.full_name || "");
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث معلومات الحساب بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمة المرور الحالية",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("كلمة المرور الحالية غير صحيحة");
      }

      // If verification successful, update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">الإعدادات</h1>
        
        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                معلومات الحساب
              </CardTitle>
              <CardDescription>
                تحديث معلومات حسابك الشخصية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  حفظ التغييرات
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                تغيير كلمة المرور
              </CardTitle>
              <CardDescription>
                تحديث كلمة مرور حسابك بشكل آمن
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    required
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  تغيير كلمة المرور
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Activation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                تفعيل الحساب
              </CardTitle>
              <CardDescription>
                قم بتفعيل حسابك للحصول على جميع المميزات
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!activationRequested ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">طلب تفعيل الحساب</p>
                    <p className="text-xs text-muted-foreground">
                      سيتم مراجعة حسابك من قبل فريق الدعم
                    </p>
                  </div>
                  <Switch
                    checked={activationRequested}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setActivationRequested(true);
                        toast({
                          title: "تم إرسال الطلب",
                          description: "سيتم مراجعة حسابك قريباً",
                        });
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-primary">جاري مراجعة حسابك</p>
                      <p className="text-sm text-muted-foreground">
                        قد تأخذ المدة من أسبوعين إلى 5 أسابيع كحد أقصى
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
