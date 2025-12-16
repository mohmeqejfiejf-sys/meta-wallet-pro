import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { User } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, Clock, Plus, Send, Download, TrendingUp, Sparkles } from "lucide-react";
import ReceiveDialog from "@/components/ReceiveDialog";

interface Wallet {
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string;
  created_at: string;
  from_user_id: string | null;
  to_user_id: string | null;
}

interface Profile {
  email: string;
  full_name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<{ [key: string]: Profile }>({});
  const [loading, setLoading] = useState(true);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchWallet(session.user.id);
      fetchTransactions(session.user.id);
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

  const fetchWallet = async (userId: string) => {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance, currency')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching wallet:', error);
    } else {
      setWallet(data);
    }
    setLoading(false);
  };

  const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
      
      const userIds = new Set<string>();
      data?.forEach(t => {
        if (t.from_user_id) userIds.add(t.from_user_id);
        if (t.to_user_id) userIds.add(t.to_user_id);
      });
      
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', Array.from(userIds));
        
        if (profilesData) {
          const profilesMap: { [key: string]: Profile } = {};
          profilesData.forEach(p => {
            profilesMap[p.id] = { email: p.email, full_name: p.full_name };
          });
          setProfiles(profilesMap);
        }
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string, isOutgoing: boolean) => {
    if (type === 'deposit') return <ArrowDownLeft className="w-5 h-5 text-success" />;
    if (type === 'withdrawal') return <ArrowUpRight className="w-5 h-5 text-destructive" />;
    return isOutgoing ? <ArrowUpRight className="w-5 h-5 text-warning" /> : <ArrowDownLeft className="w-5 h-5 text-success" />;
  };

  const quickActions = [
    { icon: Plus, label: "Add", action: () => navigate("/deposit"), gradient: "from-success/20 to-success/5" },
    { icon: Send, label: "Send", action: () => navigate("/transfer"), gradient: "from-primary/20 to-primary/5" },
    { icon: Download, label: "Receive", action: () => setReceiveDialogOpen(true), gradient: "from-secondary/20 to-secondary/5" },
  ];

  return (
    <div className="min-h-screen animated-bg noise-overlay relative">
      {/* Background Orbs */}
      <div className="orb w-[400px] h-[400px] bg-primary/10 top-20 -right-48 fixed" />
      <div className="orb w-[300px] h-[300px] bg-secondary/10 bottom-20 -left-32 fixed" style={{ animationDelay: '-3s' }} />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Balance Card */}
        <div className="glass-card gradient-border p-8 mb-8 text-center opacity-0 animate-fade-in">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-3 gradient-text">
                ${wallet?.balance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">+2.5%</span>
                </div>
                <span className="text-muted-foreground">this month</span>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="glass-card p-6 flex flex-col items-center gap-3 card-hover group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Transactions Section */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Recent Transactions</h2>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-2">No transactions yet</p>
              <p className="text-sm text-muted-foreground">Start by adding funds or sending money</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, index) => {
                const isOutgoing = tx.from_user_id === user?.id;
                const otherUserId = isOutgoing ? tx.to_user_id : tx.from_user_id;
                const otherUser = otherUserId ? profiles[otherUserId] : null;
                
                return (
                  <div 
                    key={tx.id} 
                    className="glass-card p-4 flex items-center justify-between card-hover opacity-0 animate-slide-in-left"
                    style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        tx.transaction_type === 'deposit' ? 'bg-success/10' :
                        tx.transaction_type === 'withdrawal' ? 'bg-destructive/10' :
                        isOutgoing ? 'bg-warning/10' : 'bg-success/10'
                      }`}>
                        {getTransactionIcon(tx.transaction_type, isOutgoing)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-bold ${
                        tx.transaction_type === 'deposit' || (!isOutgoing && tx.transaction_type === 'transfer') 
                          ? 'text-success' 
                          : 'text-foreground'
                      }`}>
                        {isOutgoing || tx.transaction_type === 'withdrawal' ? '-' : '+'} ${tx.amount.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === 'completed' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {tx.status === 'completed' ? 'Completed' : tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <ReceiveDialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen} />
    </div>
  );
};

export default Dashboard;
