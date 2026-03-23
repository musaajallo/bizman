"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { createInvoice, updateInvoice, addLineItem, updateLineItem, deleteLineItem } from "@/lib/actions/invoices";
import { LineItemEditor, type LineItemData } from "./line-item-editor";
import { InvoiceSummary } from "./invoice-summary";

interface Client {
  id: string;
  name: string;
  slug: string;
  primaryContactEmail: string | null;
  primaryContactName: string | null;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  billingType: string | null;
  budgetCurrency: string | null;
  clientTenantId: string | null;
}

interface InvoiceData {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  projectId: string | null;
  clientTenantId: string | null;
  invoiceNumber: string;
  referenceNumber: string | null;
  issueDate: Date | string;
  dueDate: Date | string;
  currency: string;
  taxRate: number | null;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  terms: string | null;
  lineItems: (LineItemData & { id: string })[];
}

interface Props {
  tenantId: string;
  clients: Client[];
  projects: Project[];
  invoice?: InvoiceData | null;
  invoiceType?: "standard" | "proforma";
  defaultTaxRate?: number | null;
  defaultNotes?: string | null;
  defaultTerms?: string | null;
  defaultDueDays?: number;
}

const CURRENCIES = ["USD", "EUR", "GBP", "KES", "NGN", "GHS", "ZAR", "CAD", "AUD", "JPY"];

function dateToInput(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}

export function InvoiceForm({ tenantId, clients, projects, invoice, invoiceType = "standard", defaultTaxRate, defaultNotes, defaultTerms, defaultDueDays = 30 }: Props) {
  const router = useRouter();
  const isEditing = !!invoice;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [clientTenantId, setClientTenantId] = useState(invoice?.clientTenantId || "");
  const [clientName, setClientName] = useState(invoice?.clientName || "");
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail || "");
  const [clientPhone, setClientPhone] = useState(invoice?.clientPhone || "");
  const [clientAddress, setClientAddress] = useState(invoice?.clientAddress || "");
  const [projectId, setProjectId] = useState(invoice?.projectId || "");
  const [referenceNumber, setReferenceNumber] = useState(invoice?.referenceNumber || "");
  const [issueDate, setIssueDate] = useState(invoice ? dateToInput(invoice.issueDate) : dateToInput(new Date()));
  const [dueDate, setDueDate] = useState(
    invoice ? dateToInput(invoice.dueDate) : dateToInput(new Date(Date.now() + defaultDueDays * 86400000))
  );
  const [currency, setCurrency] = useState(invoice?.currency || "USD");
  const [taxRate, setTaxRate] = useState(String(invoice?.taxRate ?? defaultTaxRate ?? ""));
  const [discountAmount, setDiscountAmount] = useState(String(invoice?.discountAmount || ""));
  const [notes, setNotes] = useState(invoice?.notes || defaultNotes || "");
  const [terms, setTerms] = useState(invoice?.terms || defaultTerms || "");

  // Line items (for new invoices; existing invoices use server-side line item operations)
  const [lineItems, setLineItems] = useState<LineItemData[]>(
    invoice?.lineItems || [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]
  );

  // Auto-fill client info when selecting from dropdown
  const handleClientSelect = (value: string | null) => {
    if (!value) return;
    if (value === "manual") {
      setClientTenantId("");
      setClientName("");
      setClientEmail("");
      return;
    }
    setClientTenantId(value);
    const client = clients.find((c) => c.id === value);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.primaryContactEmail || "");
    }
  };

  // Auto-fill currency when selecting project
  const handleProjectSelect = (value: string | null) => {
    if (!value) return;
    if (value === "none") {
      setProjectId("");
      return;
    }
    setProjectId(value);
    const project = projects.find((p) => p.id === value);
    if (project?.budgetCurrency) {
      setCurrency(project.budgetCurrency);
    }
    if (project?.clientTenantId) {
      setClientTenantId(project.clientTenantId);
      const client = clients.find((c) => c.id === project.clientTenantId);
      if (client) {
        setClientName(client.name);
        setClientEmail(client.primaryContactEmail || "");
      }
    }
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
  const taxRateNum = parseFloat(taxRate) || 0;
  const taxAmount = Math.round(subtotal * (taxRateNum / 100) * 100) / 100;
  const discountNum = parseFloat(discountAmount) || 0;
  const total = Math.round((subtotal + taxAmount - discountNum) * 100) / 100;
  const amountPaid = invoice?.amountPaid || 0;
  const amountDue = Math.round((total - amountPaid) * 100) / 100;

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      setError("Client name is required");
      return;
    }

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("tenantId", tenantId);
    formData.set("type", invoiceType);
    formData.set("clientName", clientName);
    formData.set("clientEmail", clientEmail);
    formData.set("clientPhone", clientPhone);
    formData.set("clientAddress", clientAddress);
    if (projectId) formData.set("projectId", projectId);
    if (clientTenantId) formData.set("clientTenantId", clientTenantId);
    formData.set("referenceNumber", referenceNumber);
    formData.set("issueDate", issueDate);
    formData.set("dueDate", dueDate);
    formData.set("currency", currency);
    formData.set("taxRate", taxRate);
    formData.set("discountAmount", discountAmount);
    formData.set("notes", notes);
    formData.set("terms", terms);

    if (isEditing) {
      const result = await updateInvoice(invoice.id, formData);
      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }

      // Sync line items for existing invoices
      const existingIds = new Set(invoice.lineItems.map((li) => li.id));
      const currentIds = new Set(lineItems.filter((li) => li.id).map((li) => li.id!));

      // Delete removed items
      for (const li of invoice.lineItems) {
        if (!currentIds.has(li.id)) {
          await deleteLineItem(li.id);
        }
      }

      // Add new items and update existing
      for (const li of lineItems) {
        if (li.id && existingIds.has(li.id)) {
          await updateLineItem(li.id, {
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          });
        } else {
          await addLineItem(invoice.id, {
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          });
        }
      }

      router.push(`/africs/accounting/invoices/${invoice.id}`);
    } else {
      const result = await createInvoice(formData);
      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }

      // Add line items to new invoice
      if (result.invoiceId) {
        for (const li of lineItems) {
          if (li.description && li.quantity > 0) {
            await addLineItem(result.invoiceId, {
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
            });
          }
        }
        router.push(`/africs/accounting/invoices/${result.invoiceId}`);
      }
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Select Client</Label>
                <Select
                  value={clientTenantId || "manual"}
                  onValueChange={(v: string | null) => handleClientSelect(v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select client or enter manually" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Enter manually</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Client Name *</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} type="email" className="h-9" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="h-9" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project & Dates */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Project (optional)</Label>
                  <Select
                    value={projectId || "none"}
                    onValueChange={(v: string | null) => handleProjectSelect(v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="No project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Reference / PO Number</Label>
                  <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="h-9" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Issue Date</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Select value={currency} onValueChange={(v: string | null) => { if (v) setCurrency(v); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemEditor items={lineItems} onChange={setLineItems} currency={currency} />
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="text-xs" placeholder="Additional notes for the client..." />
              </div>
              <div>
                <Label className="text-xs">Terms & Conditions</Label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} className="text-xs" placeholder="Payment terms..." />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="h-9"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs">Discount</Label>
                <Input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="h-9"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>

              <div className="pt-2">
                <InvoiceSummary
                  subtotal={subtotal}
                  taxRate={taxRateNum || null}
                  taxAmount={taxAmount}
                  discountAmount={discountNum}
                  total={total}
                  amountPaid={amountPaid}
                  amountDue={amountDue}
                  currency={currency}
                />
              </div>
            </CardContent>
          </Card>

          <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}
