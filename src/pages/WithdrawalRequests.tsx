import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { CreditCard, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";

interface WithdrawalRequest {
  id: string;
  amount: number;
  card_number: string;
  card_name: string;
  expiry_date: string;
  cvv: string;
  status: string;
  created_at: string;
}

const WithdrawalRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      const { data: requestsData, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        toast({
          title: "Error",
          description: "Failed to load withdrawal requests",
          variant: "destructive",
        });
      } else if (requestsData) {
        setRequests(requestsData);
      }
      
      setIsLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg noise-overlay relative">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any; label: string; className: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
      completed: { variant: "default", icon: CheckCircle, label: "Completed", className: "bg-success/10 text-success border-success/20" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
    };
    
    const { icon: Icon, label, className } = config[status] || config.pending;
    
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen animated-bg noise-overlay relative">
      {/* Background Orbs */}
      <div className="orb w-[400px] h-[400px] bg-primary/10 top-20 -right-48 fixed" />
      <div className="orb w-[300px] h-[300px] bg-secondary/10 bottom-20 -left-32 fixed" style={{ animationDelay: '-3s' }} />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Withdrawal Requests</h1>
                <p className="text-muted-foreground">Track all your withdrawal requests</p>
              </div>
            </div>
          </FadeIn>

          {requests.length === 0 ? (
            <FadeIn delay={0.1}>
              <Card className="glass-card border-border/50">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium mb-2">No withdrawal requests yet</p>
                  <p className="text-muted-foreground">Your withdrawal history will appear here</p>
                </CardContent>
              </Card>
            </FadeIn>
          ) : (
            <StaggerContainer className="space-y-4">
              {requests.map((request, index) => (
                <StaggerItem key={request.id}>
                  <Card className="glass-card border-border/50 card-hover">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="font-display text-xl">
                            Withdrawal of ${request.amount.toFixed(2)}
                          </CardTitle>
                          <CardDescription>
                            {new Date(request.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 rounded-xl bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Card Number</p>
                          <p className="font-mono text-sm">•••• {request.card_number.slice(-4)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Cardholder</p>
                          <p className="text-sm truncate">{request.card_name}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Expiry</p>
                          <p className="font-mono text-sm">{request.expiry_date}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Amount</p>
                          <p className="font-bold text-primary">${request.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </main>
    </div>
  );
};

export default WithdrawalRequests;
