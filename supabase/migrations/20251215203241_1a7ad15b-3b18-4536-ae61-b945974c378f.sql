
-- Create support messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  admin_id UUID,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  language VARCHAR(2) DEFAULT 'ar',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own support messages"
ON public.support_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create messages (send to support)
CREATE POLICY "Users can send support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_from_admin = false);

-- Users can mark messages as read
CREATE POLICY "Users can mark their messages as read"
ON public.support_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all messages
CREATE POLICY "Admins can view all support messages"
ON public.support_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can send messages to users
CREATE POLICY "Admins can send support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND is_from_admin = true);

-- Admins can update any message
CREATE POLICY "Admins can update support messages"
ON public.support_messages
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
