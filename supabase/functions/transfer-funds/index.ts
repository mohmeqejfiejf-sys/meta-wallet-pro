import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const TransferSchema = z.object({
  to_email: z.string().email().max(255),
  amount: z.number().positive().max(1000000).multipleOf(0.01),
  description: z.string().max(500).optional()
});

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
      throw new Error('AUTH_REQUIRED');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('AUTH_INVALID');
    }

    // Parse and validate input
    const body = await req.json();
    const validatedInput = TransferSchema.parse(body);
    
    console.log('Transfer request initiated:', { 
      userId: user.id, 
      amount: validatedInput.amount,
      timestamp: new Date().toISOString()
    });

    // Call the atomic transfer function
    const { data, error } = await supabase.rpc('transfer_funds_atomic', {
      sender_id: user.id,
      recipient_email: validatedInput.to_email,
      transfer_amount: validatedInput.amount,
      transfer_description: validatedInput.description || null
    });

    if (error) {
      // Log detailed error server-side
      console.error('Transfer failed:', {
        userId: user.id,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      
      // Check for specific error messages from database function
      if (error.message.includes('restricted from making transfers')) {
        throw new Error('ACCOUNT_RESTRICTED');
      } else if (error.message.includes('Recipient account is restricted')) {
        throw new Error('RECIPIENT_RESTRICTED');
      } else if (error.message.includes('Insufficient balance')) {
        throw new Error('INSUFFICIENT_BALANCE');
      } else if (error.message.includes('Cannot transfer to yourself')) {
        throw new Error('SELF_TRANSFER');
      } else if (error.message.includes('Recipient not found')) {
        throw new Error('RECIPIENT_NOT_FOUND');
      }
      
      throw new Error('TRANSFER_FAILED');
    }

    console.log('Transfer completed successfully:', {
      userId: user.id,
      newBalance: data.new_balance,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Transfer completed successfully',
        new_balance: data.new_balance
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    // Log detailed error for debugging
    console.error('Transfer error details:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Map errors to generic user-facing messages
    let userMessage = 'Transfer failed. Please verify the details and try again.';
    let statusCode = 400;
    
    if (error instanceof z.ZodError) {
      userMessage = 'Invalid transfer details provided.';
      statusCode = 400;
    } else if (error.message === 'AUTH_REQUIRED' || error.message === 'AUTH_INVALID') {
      userMessage = 'Authentication required. Please sign in again.';
      statusCode = 401;
    } else if (error.message === 'ACCOUNT_RESTRICTED') {
      userMessage = 'Your account is restricted from making transfers. Please contact support.';
      statusCode = 403;
    } else if (error.message === 'RECIPIENT_RESTRICTED') {
      userMessage = 'The recipient account is restricted from receiving transfers.';
      statusCode = 400;
    } else if (error.message === 'INSUFFICIENT_BALANCE') {
      userMessage = 'Insufficient balance to complete this transfer.';
      statusCode = 400;
    } else if (error.message === 'SELF_TRANSFER') {
      userMessage = 'You cannot transfer funds to yourself.';
      statusCode = 400;
    } else if (error.message === 'RECIPIENT_NOT_FOUND') {
      userMessage = 'Recipient email not found. Please verify the email address.';
      statusCode = 400;
    }
    
    return new Response(
      JSON.stringify({ error: userMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: statusCode }
    );
  }
});