import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ShieldCheck, User, Calendar, MapPin, Globe, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";

interface PublicProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  country: string | null;
  created_at: string | null;
}

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, is_verified, country, created_at')
          .eq('username', username)
          .eq('is_public', true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setProfile(data);
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/profile/${searchQuery.trim()}`);
    }
  };

  if (!username) {
    return (
      <div className="min-h-screen animated-bg noise-overlay relative">
        {/* Background Orbs */}
        <div className="orb w-[400px] h-[400px] bg-primary/10 top-20 -right-48 fixed" />
        <div className="orb w-[300px] h-[300px] bg-secondary/10 bottom-20 -left-32 fixed" style={{ animationDelay: '-3s' }} />
        
        <Navbar />
        <main className="container mx-auto px-4 py-16 relative z-10">
          <FadeIn className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto">
                <Search className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-display text-4xl font-bold gradient-text">Find a User</h1>
              <p className="text-muted-foreground text-lg">
                Search for any user and check their account status
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-4 max-w-md mx-auto">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Enter username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11"
                />
              </div>
              <Button type="submit" className="btn-glow rounded-xl px-6">
                Search
              </Button>
            </form>

            <StaggerContainer className="grid md:grid-cols-3 gap-4 pt-8">
              {[
                { icon: ShieldCheck, title: "Verify Status", desc: "Check if account is verified", color: "text-success" },
                { icon: User, title: "Account Info", desc: "View public account details", color: "text-primary" },
                { icon: Calendar, title: "Join Date", desc: "See when user joined", color: "text-secondary" }
              ].map((item, index) => (
                <StaggerItem key={index}>
                  <Card className="glass-card border-border/50 card-hover">
                    <CardContent className="pt-6 text-center">
                      <item.icon className={`w-12 h-12 ${item.color} mx-auto mb-3`} />
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </FadeIn>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg noise-overlay relative">
        <Navbar />
        <main className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen animated-bg noise-overlay relative">
        <div className="orb w-[400px] h-[400px] bg-destructive/10 top-20 -right-48 fixed" />
        
        <Navbar />
        <main className="container mx-auto px-4 py-16 relative z-10">
          <FadeIn className="max-w-md mx-auto text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold">User Not Found</h1>
            <p className="text-muted-foreground">
              We couldn't find an account with this username or the profile is not public
            </p>
            <Button variant="outline" onClick={() => navigate("/profile")} className="rounded-xl">
              Search for another user
            </Button>
          </FadeIn>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg noise-overlay relative">
      {/* Background Orbs */}
      <div className="orb w-[400px] h-[400px] bg-primary/10 top-20 -right-48 fixed" />
      <div className="orb w-[300px] h-[300px] bg-secondary/10 bottom-20 -left-32 fixed" style={{ animationDelay: '-3s' }} />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <ScaleIn className="max-w-2xl mx-auto">
          <Card className="glass-card border-border/50 overflow-hidden">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/10" />
            
            {/* Profile Header */}
            <CardHeader className="relative pt-0">
              <div className="flex flex-col items-center -mt-16">
                <Avatar className="w-32 h-32 border-4 border-background ring-2 ring-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-secondary/20">
                    {profile.full_name?.charAt(0) || profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="mt-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <h1 className="font-display text-2xl font-bold">{profile.full_name || profile.username}</h1>
                    {profile.is_verified && (
                      <ShieldCheck className="w-6 h-6 text-success" />
                    )}
                  </div>
                  
                  <p className="text-muted-foreground">@{profile.username}</p>
                  
                  <div className="flex items-center justify-center gap-2">
                    {profile.is_verified ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified Account
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Not Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {profile.bio && (
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <p className="text-muted-foreground">{profile.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {profile.country && (
                  <div className="flex items-center gap-3 p-4 rounded-xl glass-card">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-sm">{profile.country}</span>
                  </div>
                )}
                
                {profile.created_at && (
                  <div className="flex items-center gap-3 p-4 rounded-xl glass-card">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-sm">
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Public profile on MetaWallet</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScaleIn>
      </main>
    </div>
  );
};

export default PublicProfile;
