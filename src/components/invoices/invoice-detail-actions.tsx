"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Copy, Trash2, Loader2, Send, Ban, Bell, ExternalLink, Download, Check, ArrowRightLeft, Clock, ScrollText, ChevronDown, Link2, FileMinus } from "lucide-react";
import { deleteInvoice, duplicateInvoice, voidInvoice, acceptProforma, expireProforma, convertProformaToInvoice } from "@/lib/actions/invoices";
import { EmailComposeDialog } from "./email-compose-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  invoiceId: string;
  invoiceType?: string;
  status: string;
  shareToken?: string;
  clientName: string;
  clientEmail: string | null;
  invoiceNumber: string;
  ownerName: string;
}

export function InvoiceDetailActions({ invoiceId, invoiceType = "standard", status, shareToken, clientName, clientEmail, invoiceNumber, ownerName }: Props) {
  const router = useRouter();
  const [acting, setActing] = useState(false);
  const [emailMode, setEmailMode] = useState<"send" | "reminder">("send");
  const [emailOpen, setEmailOpen] = useState(false);

  const act = async (fn: () => Promise<{ error?: string; success?: boolean; invoiceId?: string }>) => {
    setActing(true);
    const result = await fn();
    if (result.error) {
      alert(result.error);
      setActing(false);
      return result;
    }
    setActing(false);
    router.refresh();
    return result;
  };

  const handleSend = () => {
    setEmailMode("send");
    setEmailOpen(true);
  };

  const handleReminder = () => {
    setEmailMode("reminder");
    setEmailOpen(true);
  };

  const handleVoid = async () => {
    if (!confirm("Void this invoice? This cannot be undone.")) return;
    act(() => voidInvoice(invoiceId));
  };

  const handleDuplicate = async () => {
    const result = await act(() => duplicateInvoice(invoiceId));
    if (result.invoiceId) {
      router.push(`/africs/accounting/invoices/${result.invoiceId}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setActing(true);
    const result = await deleteInvoice(invoiceId);
    if (result.error) {
      alert(result.error);
      setActing(false);
      return;
    }
    router.push("/africs/accounting/invoices");
  };

  const isProforma = invoiceType === "proforma";
  const isStandard = invoiceType === "standard";
  const isCreditNote = invoiceType === "credit_note";

  const handleIssueCreditNote = () => {
    router.push(`/africs/accounting/credit-notes/new?invoiceId=${invoiceId}&invoiceNumber=${invoiceNumber}`);
  };

  const handleAccept = async () => {
    if (!confirm("Accept this proforma? This indicates the client has agreed to the quote.")) return;
    act(() => acceptProforma(invoiceId));
  };

  const handleConvert = async () => {
    if (!confirm("Convert this proforma to a standard invoice? A new invoice will be created.")) return;
    const result = await act(() => convertProformaToInvoice(invoiceId));
    if (result.invoiceId) {
      router.push(`/africs/accounting/invoices/${result.invoiceId}`);
    }
  };

  const handleExpire = async () => {
    if (!confirm("Mark this proforma as expired?")) return;
    act(() => expireProforma(invoiceId));
  };

  const canSend = status === "draft" && !isCreditNote;
  const canEdit = status === "draft";
  const canDelete = status === "draft";
  const canVoid = status !== "void" && status !== "paid" && status !== "converted" && status !== "expired" && status !== "applied";
  const canRemind = !isProforma && isStandard && (status === "sent" || status === "viewed" || status === "overdue");
  const canAccept = isProforma && (status === "sent" || status === "viewed");
  const canConvert = isProforma && (status === "sent" || status === "viewed" || status === "accepted");
  const canExpire = isProforma && !["expired", "converted", "void"].includes(status);
  const canIssueCreditNote = isStandard && (status === "sent" || status === "viewed" || status === "paid" || status === "overdue");

  return (
    <>
      <div className="flex items-center gap-2">
        {canSend && (
          <Button size="sm" className="gap-2" onClick={handleSend} disabled={acting}>
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        )}
        {canAccept && (
          <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleAccept} disabled={acting}>
            <Check className="h-3.5 w-3.5" />
            Accept
          </Button>
        )}
        {canConvert && (
          <Button size="sm" className="gap-2" onClick={handleConvert} disabled={acting}>
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Convert to Invoice
          </Button>
        )}
        {canIssueCreditNote && (
          <Button size="sm" variant="outline" className="gap-2 text-rose-400 border-rose-500/30 hover:text-rose-300" onClick={handleIssueCreditNote} disabled={acting}>
            <FileMinus className="h-3.5 w-3.5" />
            Issue Credit Note
          </Button>
        )}
        {canRemind && (
          <Button size="sm" variant="outline" className="gap-2" onClick={handleReminder} disabled={acting}>
            <Bell className="h-3.5 w-3.5" />
            Reminder
          </Button>
        )}
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/africs/accounting/invoices/${invoiceId}/edit`)}
            disabled={acting}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button size="sm" variant="outline" className="gap-2" disabled={acting}>
              <Download className="h-3.5 w-3.5" />
              Download
              <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => window.open(`/api/invoices/${invoiceId}/pdf`, "_blank")}>
              <Download className="h-3.5 w-3.5 mr-2" />
              Download Invoice PDF
            </DropdownMenuItem>
            {status === "paid" && (
              <DropdownMenuItem onClick={() => window.open(`/api/invoices/${invoiceId}/receipt`, "_blank")}>
                <ScrollText className="h-3.5 w-3.5 mr-2" />
                Download Receipt PDF
              </DropdownMenuItem>
            )}
            {shareToken && status !== "draft" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const url = `${window.location.origin}/view/invoice/${shareToken}`;
                    navigator.clipboard.writeText(url);
                  }}
                >
                  <Link2 className="h-3.5 w-3.5 mr-2" />
                  Copy Invoice Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/view/invoice/${shareToken}`, "_blank")}>
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Open Client View
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="outline" className="gap-2" onClick={handleDuplicate} disabled={acting}>
          {acting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
          Duplicate
        </Button>
        {canExpire && (
          <Button size="sm" variant="ghost" className="gap-2 text-amber-400 hover:text-amber-300" onClick={handleExpire} disabled={acting}>
            <Clock className="h-3.5 w-3.5" />
            Expire
          </Button>
        )}
        {canVoid && (
          <Button size="sm" variant="ghost" className="gap-2 text-red-400 hover:text-red-300" onClick={handleVoid} disabled={acting}>
            <Ban className="h-3.5 w-3.5" />
            Void
          </Button>
        )}
        {canDelete && (
          <Button size="sm" variant="destructive" className="gap-2" onClick={handleDelete} disabled={acting}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>

      <EmailComposeDialog
        invoiceId={invoiceId}
        clientName={clientName}
        clientEmail={clientEmail}
        invoiceNumber={invoiceNumber}
        ownerName={ownerName}
        mode={emailMode}
        open={emailOpen}
        onOpenChange={setEmailOpen}
        onSent={() => router.refresh()}
      />
    </>
  );
}
