import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReceiveDialog = ({ open, onOpenChange }: ReceiveDialogProps) => {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    if (open) {
      getEmail();
    }
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast({
      title: "Email copied",
      description: "Your email address has been copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Funds</DialogTitle>
          <DialogDescription>
            Share your email address to receive funds
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Your Email Address</p>
            <p className="text-lg font-medium break-all">{email}</p>
          </div>
          <Button onClick={handleCopy} className="w-full">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Email
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Share this email with anyone who wants to send you funds
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiveDialog;
