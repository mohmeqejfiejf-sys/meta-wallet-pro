import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { to_email, amount, description } = await req.json();

    console.log('Transfer request:', { from: user.id, to_email, amount });

    // Get recipient profile by email
    const { data: toProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', to_email)
      .single();

    if (profileError || !toProfile) {
      throw new Error('Recipient not found');
    }

    // Get sender wallet
    const { data: fromWallet, error: fromWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (fromWalletError || !fromWallet) {
      throw new Error('Sender wallet not found');
    }

    // Check sufficient balance
    if (parseFloat(fromWallet.balance) < amount) {
      throw new Error('Insufficient balance');
    }

    // Get recipient wallet
    const { data: toWallet, error: toWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', toProfile.id)
      .single();

    if (toWalletError || !toWallet) {
      throw new Error('Recipient wallet not found');
    }

    // Update sender balance
    const { error: deductError } = await supabase
      .from('wallets')
      .update({ balance: parseFloat(fromWallet.balance) - amount })
      .eq('user_id', user.id);

    if (deductError) {
      console.error('Deduct error:', deductError);
      throw new Error('Failed to deduct from sender');
    }

    // Update recipient balance
    const { error: addError } = await supabase
      .from('wallets')
      .update({ balance: parseFloat(toWallet.balance) + amount })
      .eq('user_id', toProfile.id);

    if (addError) {
      console.error('Add error:', addError);
      // Rollback sender balance
      await supabase
        .from('wallets')
        .update({ balance: fromWallet.balance })
        .eq('user_id', user.id);
      throw new Error('Failed to add to recipient');
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        from_user_id: user.id,
        to_user_id: toProfile.id,
        amount: amount,
        transaction_type: 'transfer',
        status: 'completed',
        description: description || `Transfer to ${to_email}`
      });

    if (transactionError) {
      console.error('Transaction record error:', transactionError);
    }

    console.log('Transfer completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Transfer completed successfully',
        new_balance: parseFloat(fromWallet.balance) - amount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Transfer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});