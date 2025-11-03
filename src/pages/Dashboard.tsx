import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { User } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, Clock, Plus, Send, Download, Upload, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      
      // Fetch profiles for all user IDs in transactions
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
    if (type === 'deposit') return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    if (type === 'withdrawal') return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    return isOutgoing ? <ArrowUpRight className="w-4 h-4 text-orange-500" /> : <ArrowDownLeft className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Balance Section */}
        <div className="mb-8">
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
              <h1 className="text-5xl font-bold mb-1">
                ${wallet?.balance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500">+2.5%</span>
                <span className="text-muted-foreground">this month</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={() => navigate("/deposit")}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity">
              <Plus className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Add</span>
          </button>
          
          <button
            onClick={() => navigate("/transfer")}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity">
              <Send className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Send</span>
          </button>
          
          <button
            onClick={() => navigate("/deposit")}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity">
              <Download className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Receive</span>
          </button>
          
          <button
            onClick={() => navigate("/withdraw")}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity">
              <Upload className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">Withdraw</span>
          </button>
        </div>

        {/* Transactions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Transactions</h2>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start by adding funds or sending money</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isOutgoing = tx.from_user_id === user?.id;
                const otherUserId = isOutgoing ? tx.to_user_id : tx.from_user_id;
                const otherUser = otherUserId ? profiles[otherUserId] : null;
                
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-card rounded-xl hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        tx.transaction_type === 'deposit' ? 'bg-green-500/20' :
                        tx.transaction_type === 'withdrawal' ? 'bg-red-500/20' :
                        isOutgoing ? 'bg-orange-500/20' : 'bg-green-500/20'
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
                      <p className={`text-base font-bold ${isOutgoing ? 'text-foreground' : 'text-foreground'}`}>
                        {isOutgoing ? '-' : '+'} ${tx.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.status === 'completed' ? 'Completed' : tx.status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;