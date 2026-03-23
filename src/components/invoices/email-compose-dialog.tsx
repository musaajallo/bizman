"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Send, Bell, Loader2 } from "lucide-react";
import { sendInvoiceEmail, sendReminderEmail } from "@/lib/actions/invoice-email";

interface Props {
  invoiceId: string;
  clientName: string;
  clientEmail: string | null;
  invoiceNumber: string;
  ownerName: string;
  mode: "send" | "reminder";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}

export function EmailComposeDialog({
  invoiceId,
  clientName,
  clientEmail,
  invoiceNumber,
  ownerName,
  mode,
  open,
  onOpenChange,
  onSent,
}: Props) {
  const isReminder = mode === "reminder";
  const defaultSubject = isReminder
    ? `Payment Reminder: Invoice ${invoiceNumber} from ${ownerName}`
    : `Invoice ${invoiceNumber} from ${ownerName}`;

  const [to, setTo] = useState(clientEmail || "");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!to || !to.includes("@")) {
      setError("Enter a valid email address");
      return;
    }

    setSending(true);
    setError(null);

    const result = isReminder
      ? await sendReminderEmail(invoiceId, {
          to,
          message: message || undefined,
        })
      : await sendInvoiceEmail(invoiceId, {
          to,
          subject: subject || undefined,
          message: message || undefined,
        });

    if (result.error) {
      setError(result.error);
      setSending(false);
      return;
    }

    setSending(false);
    onOpenChange(false);
    onSent?.();
  };

  // Reset state when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setTo(clientEmail || "");
      setSubject(defaultSubject);
      setMessage("");
      setError(null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isReminder ? "Send Payment Reminder" : "Send Invoice"}</DialogTitle>
          <DialogDescription>
            {isReminder
              ? `Send a payment reminder for ${invoiceNumber} to ${clientName}.`
              : `Email invoice ${invoiceNumber} to ${clientName} with the PDF attached.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {error && (
            <div className="p-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded">
              {error}
            </div>
          )}

          <div>
            <Label className="text-xs">To *</Label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9"
              placeholder="client@example.com"
            />
          </div>

          <div>
            <Label className="text-xs">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <Label className="text-xs">Message (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="text-sm"
              placeholder={
                isReminder
                  ? "Add a note to the payment reminder..."
                  : "Add a personal message to the email..."
              }
            />
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              {isReminder ? "A payment reminder email" : "The invoice email"} will include:
            </p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <li>• Invoice summary (amount, due date)</li>
              <li>• Link to view the invoice online</li>
              <li>• PDF attachment ({invoiceNumber}.pdf)</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSend} disabled={sending}>
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isReminder ? (
                <Bell className="h-3.5 w-3.5" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {isReminder ? "Send Reminder" : "Send Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
