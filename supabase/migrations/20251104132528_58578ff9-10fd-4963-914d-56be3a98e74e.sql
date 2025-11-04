-- Fix Security Issue #1: Restrict profile visibility
-- Users can only view their own profile OR profiles of people they have transactions with
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view transaction participants"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE (from_user_id = auth.uid() OR to_user_id = auth.uid())
        AND (from_user_id = profiles.id OR to_user_id = profiles.id)
    )
  );

-- Fix Security Issue #2: Remove wallet UPDATE policy to prevent balance manipulation
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

-- Fix Security Issue #3: Create atomic transfer function to prevent race conditions
CREATE OR REPLACE FUNCTION public.transfer_funds_atomic(
  sender_id UUID,
  recipient_email TEXT,
  transfer_amount DECIMAL,
  transfer_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_balance DECIMAL;
  recipient_id UUID;
  new_sender_balance DECIMAL;
BEGIN
  -- Validate inputs
  IF transfer_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  
  IF transfer_amount > 1000000 THEN
    RAISE EXCEPTION 'Amount exceeds maximum';
  END IF;

  -- Lock sender wallet and get balance (prevents race conditions)
  SELECT balance INTO sender_balance
  FROM wallets
  WHERE user_id = sender_id
  FOR UPDATE;
  
  IF sender_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF sender_balance < transfer_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Get recipient ID by email
  SELECT id INTO recipient_id
  FROM profiles
  WHERE email = recipient_email;
  
  IF recipient_id IS NULL THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;
  
  IF recipient_id = sender_id THEN
    RAISE EXCEPTION 'Cannot transfer to self';
  END IF;
  
  -- Lock recipient wallet to prevent race conditions
  PERFORM 1 FROM wallets WHERE user_id = recipient_id FOR UPDATE;
  
  -- Perform atomic updates
  UPDATE wallets 
  SET balance = balance - transfer_amount,
      updated_at = NOW()
  WHERE user_id = sender_id;
  
  UPDATE wallets 
  SET balance = balance + transfer_amount,
      updated_at = NOW()
  WHERE user_id = recipient_id;
  
  -- Create transaction record
  INSERT INTO transactions (
    from_user_id, 
    to_user_id, 
    amount, 
    transaction_type, 
    status, 
    description
  )
  VALUES (
    sender_id, 
    recipient_id, 
    transfer_amount, 
    'transfer', 
    'completed', 
    COALESCE(transfer_description, 'Transfer to ' || recipient_email)
  );
  
  -- Calculate new balance
  new_sender_balance := sender_balance - transfer_amount;
  
  RETURN json_build_object(
    'success', true, 
    'new_balance', new_sender_balance,
    'recipient_id', recipient_id
  );
END;
$$;