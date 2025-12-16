import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, User as UserIcon, ShieldCheck, Clock, Edit, ExternalLink, Settings as SettingsIcon, Key } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activationStatus, setActivationStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) {
        setFullName(profileData.full_name || "");
        setProfile(profileData);
      }

      const { data: activationData } = await supabase
        .from('activation_requests')
        .select('status')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (activationData) {
        setActivationStatus(activationData.status);
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
        title: "Updated",
        description: "Account information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
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
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Updated",
        description: "Password changed successfully",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg noise-overlay relative">
      {/* Background Orbs */}
      <div className="orb w-[400px] h-[400px] bg-primary/10 top-20 -right-48 fixed" />
      <div className="orb w-[300px] h-[300px] bg-secondary/10 bottom-20 -left-32 fixed" style={{ animationDelay: '-3s' }} />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        <FadeIn>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <SettingsIcon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences</p>
            </div>
          </div>
        </FadeIn>
        
        <StaggerContainer className="space-y-6">
          {/* Profile Card */}
          <StaggerItem>
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-display">
                    <UserIcon className="w-5 h-5 text-primary" />
                    Profile
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild className="rounded-xl">
                    <Link to="/edit-profile">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{profile?.full_name || 'No name'}</h3>
                      {profile?.is_verified && (
                        <ShieldCheck className="w-5 h-5 text-success" />
                      )}
                    </div>
                    {profile?.username && (
                      <p className="text-muted-foreground">@{profile.username}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                {profile?.is_public && profile?.username && (
                  <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Your public profile:</span>
                      <Button variant="ghost" size="sm" asChild className="rounded-lg">
                        <Link to={`/profile/${profile.username}`}>
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Account Info */}
          <StaggerItem>
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <UserIcon className="w-5 h-5 text-primary" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Update your personal account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <Button type="submit" disabled={loading} className="rounded-xl">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Password Settings */}
          <StaggerItem>
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Key className="w-5 h-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="pl-11"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="pl-11"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        className="pl-11"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="rounded-xl">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Account Activation */}
          <StaggerItem>
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Account Activation
                </CardTitle>
                <CardDescription>
                  Activate your account to access all features
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!activationStatus ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Request Account Activation</p>
                      <p className="text-xs text-muted-foreground">
                        Your account will be reviewed by our team
                      </p>
                    </div>
                    <Switch
                      checked={false}
                      onCheckedChange={async (checked) => {
                        if (checked && user) {
                          const { error } = await supabase
                            .from('activation_requests')
                            .insert({ user_id: user.id });
                          
                          if (error) {
                            toast({
                              title: "Error",
                              description: "An error occurred while sending the request",
                              variant: "destructive",
                            });
                          } else {
                            setActivationStatus('pending');
                            toast({
                              title: "Request Sent",
                              description: "Your account will be reviewed soon",
                            });
                          }
                        }
                      }}
                    />
                  </div>
                ) : activationStatus === 'approved' ? (
                  <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-success mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-success">Account Activated</p>
                        <p className="text-sm text-muted-foreground">
                          Your account is active and you can access all features
                        </p>
                      </div>
                    </div>
                  </div>
                ) : activationStatus === 'rejected' ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-destructive mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-destructive">Request Rejected</p>
                        <p className="text-sm text-muted-foreground">
                          Your activation request was rejected. Please contact support
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-primary">Under Review</p>
                        <p className="text-sm text-muted-foreground">
                          This may take 2-5 weeks to complete
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </main>
    </div>
  );
};

export default Settings;
