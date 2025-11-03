-- Fix search_path for update_wallet_timestamp function
CREATE OR REPLACE FUNCTION public.update_wallet_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;