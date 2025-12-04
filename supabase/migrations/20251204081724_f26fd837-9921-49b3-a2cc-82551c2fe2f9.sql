-- Add transfer_disabled column to wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS transfer_disabled boolean NOT NULL DEFAULT false;

-- Update transfer_funds_atomic function to check if sender or recipient is disabled
CREATE OR REPLACE FUNCTION public.transfer_funds_atomic(sender_id uuid, recipient_email text, transfer_amount numeric, transfer_description text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sender_balance DECIMAL;
  recipient_id UUID;
  new_sender_balance DECIMAL;
  sender_disabled BOOLEAN;
  recipient_disabled BOOLEAN;
BEGIN
  -- Validate inputs
  IF transfer_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  
  IF transfer_amount > 1000000 THEN
    RAISE EXCEPTION 'Amount exceeds maximum';
  END IF;

  -- Lock sender wallet and get balance (prevents race conditions)
  SELECT balance, transfer_disabled INTO sender_balance, sender_disabled
  FROM wallets
  WHERE user_id = sender_id
  FOR UPDATE;
  
  IF sender_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Check if sender is disabled from transfers
  IF sender_disabled THEN
    RAISE EXCEPTION 'Your account is restricted from making transfers';
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
  
  -- Lock recipient wallet and check if disabled
  SELECT transfer_disabled INTO recipient_disabled 
  FROM wallets 
  WHERE user_id = recipient_id 
  FOR UPDATE;
  
  IF recipient_disabled THEN
    RAISE EXCEPTION 'Recipient account is restricted from receiving transfers';
  END IF;
  
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
$function$;

-- Create admin function to adjust wallet balance
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(target_user_id uuid, amount_change numeric, adjustment_description text DEFAULT 'Admin adjustment')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_balance DECIMAL;
  new_balance DECIMAL;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM wallets
  WHERE user_id = target_user_id
  FOR UPDATE;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  new_balance := current_balance + amount_change;
  
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Resulting balance cannot be negative';
  END IF;
  
  -- Update balance
  UPDATE wallets 
  SET balance = new_balance,
      updated_at = NOW()
  WHERE user_id = target_user_id;
  
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
    CASE WHEN amount_change < 0 THEN target_user_id ELSE NULL END,
    CASE WHEN amount_change > 0 THEN target_user_id ELSE NULL END,
    ABS(amount_change), 
    CASE WHEN amount_change > 0 THEN 'deposit' ELSE 'withdrawal' END, 
    'completed', 
    adjustment_description
  );
  
  RETURN json_build_object(
    'success', true, 
    'new_balance', new_balance
  );
END;
$function$;

-- Create admin function to toggle transfer status
CREATE OR REPLACE FUNCTION public.admin_toggle_transfer(target_user_id uuid, disabled boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE wallets 
  SET transfer_disabled = disabled,
      updated_at = NOW()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'transfer_disabled', disabled
  );
END;
$function$;