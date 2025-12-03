-- Create activation_requests table
CREATE TABLE public.activation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.activation_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own activation request
CREATE POLICY "Users can view their own activation request"
ON public.activation_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own activation request
CREATE POLICY "Users can create their own activation request"
ON public.activation_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all activation requests
CREATE POLICY "Admins can view all activation requests"
ON public.activation_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update activation requests
CREATE POLICY "Admins can update activation requests"
ON public.activation_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));