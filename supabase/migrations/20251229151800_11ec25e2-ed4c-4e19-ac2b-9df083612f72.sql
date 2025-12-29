-- Add rejection_reason column to withdrawal_requests table
ALTER TABLE public.withdrawal_requests 
ADD COLUMN rejection_reason text DEFAULT NULL;