import { CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function receiptNumber(invoiceNumber: string) {
  return `RCP-${invoiceNumber.replace(/^[A-Z]+-/, "")}`;
}

function methodLabel(method: string | null) {
  if (!method) return "—";
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Payment {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  date: Date | string;
}

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  currency: string;
  amountPaid: number;
  paidDate: Date | string | null;
  payments: Payment[];
  projectName?: string | null;
  ownerName: string;
  accentColor?: string | null;
  logoUrl?: string | null;
  compact?: boolean;
}

export function ReceiptPreview({
  invoiceId,
  invoiceNumber,
  clientName,
  clientEmail,
  currency,
  amountPaid,
  paidDate,
  payments,
  projectName,
  ownerName,
  accentColor,
  logoUrl,
  compact = false,
}: Props) {
  const color = accentColor || "#4F6EF7";
  const rcp = receiptNumber(invoiceNumber);
  const dateLabel = paidDate
    ? fmtDate(paidDate)
    : payments[0]?.date
    ? fmtDate(payments[0].date)
    : "—";

  if (compact) {
    return (
      <div className="relative bg-white rounded-xl shadow-md overflow-visible text-gray-900">
        {/* Side notches */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-muted rounded-full z-10 border border-border/30" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-muted rounded-full z-10 border border-border/30" />

        {/* Top accent stripe */}
        <div className="h-1.5 rounded-t-xl" style={{ background: color }} />

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Payment Receipt</span>
            </div>
            <span className="font-mono text-xs font-bold text-gray-500">{rcp}</span>
          </div>

          {/* Amount */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{clientName}</p>
              {clientEmail && <p className="text-xs text-gray-400">{clientEmail}</p>}
              <p className="text-xs text-gray-400 mt-0.5">{dateLabel}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black font-mono text-gray-900 leading-none">{fmt(amountPaid, currency)}</p>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border border-emerald-200 text-emerald-600 bg-emerald-50">PAID</span>
              </div>
            </div>
          </div>

          {/* Payment breakdown */}
          {payments.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: `${color}18`, color }}
                    >
                      {methodLabel(p.method)}
                    </span>
                    <div className="min-w-0">
                      {p.reference && <p className="text-gray-500 truncate">Ref: {p.reference}</p>}
                      <p className="text-gray-400">{fmtDate(p.date)}</p>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-gray-800 shrink-0 ml-2">{fmt(p.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t-2 border-dashed border-gray-200 flex items-center gap-2">
            <a
              href={`/api/invoices/${invoiceId}/receipt`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 flex-1 text-center text-xs py-2 px-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: color }}
            >
              <CheckCircle2 className="h-3 w-3" />
              Download Receipt PDF
            </a>
          </div>
        </div>

        {/* Bottom accent stripe */}
        <div className="h-1 rounded-b-xl opacity-30" style={{ background: color }} />
      </div>
    );
  }

  // Full receipt
  return (
    <div className="relative mx-auto max-w-sm py-2 px-3">
      {/* Side notches */}
      <div className="absolute left-0 top-[38%] -translate-y-1/2 w-6 h-6 bg-muted rounded-full z-10 border border-border/20" />
      <div className="absolute right-0 top-[38%] -translate-y-1/2 w-6 h-6 bg-muted rounded-full z-10 border border-border/20" />

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden text-gray-900">
        {/* Header */}
        <div className="px-6 py-5 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="object-contain brightness-0 invert opacity-90 mb-1"
                    style={{ height: "3.375rem" }}
                  />
                  <p className="text-white/70 text-[10px] uppercase tracking-[0.2em]">
                    Payment Receipt
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-lg leading-tight">{ownerName}</p>
                  <p className="text-white/70 text-[10px] uppercase tracking-[0.2em] mt-0.5">
                    Payment Receipt
                  </p>
                </div>
              )}
            </div>
            <CheckCircle2 className="h-7 w-7 text-white/70 mt-0.5 shrink-0" />
          </div>
        </div>

        {/* Perforation divider */}
        <div className="flex items-center px-3 -mt-px -mb-px relative z-10">
          <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: `${color}40` }} />
          <span className="mx-2 text-base leading-none" style={{ color: `${color}60` }}>✂</span>
          <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: `${color}40` }} />
        </div>

        {/* Body */}
        <div className="px-6 pb-5 pt-4 space-y-4">
          {/* Receipt # and date */}
          <div className="flex justify-between items-start text-sm">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-0.5">Receipt No.</p>
              <p className="font-mono font-black text-gray-900 text-base">{rcp}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-0.5">Date Paid</p>
              <p className="font-semibold text-gray-900">{dateLabel}</p>
            </div>
          </div>

          {/* Client */}
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-1">Received From</p>
            <p className="font-bold text-gray-900">{clientName}</p>
            {clientEmail && <p className="text-xs text-gray-500 mt-0.5">{clientEmail}</p>}
          </div>

          {/* Invoice reference */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 text-xs uppercase tracking-wide">For Invoice</span>
            <div className="text-right">
              <Link
                href={`/africs/accounting/invoices/${invoiceId}`}
                className="font-mono font-bold text-gray-900 hover:underline flex items-center gap-1 justify-end"
              >
                <FileText className="h-3 w-3 text-gray-400" />
                {invoiceNumber}
              </Link>
              {projectName && <p className="text-xs text-gray-400 mt-0.5">{projectName}</p>}
            </div>
          </div>

          {/* Amount — prominent */}
          <div className="relative rounded-2xl overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${color} 0, ${color} 1px, transparent 0, transparent 50%)`,
                backgroundSize: "10px 10px",
              }}
            />
            <div className="relative py-5 px-4 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1">Total Amount Paid</p>
              <p className="text-5xl font-black font-mono text-gray-900 leading-none">
                {fmt(amountPaid, currency)}
              </p>
            </div>
          </div>

          {/* Payment breakdown */}
          {payments.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-2">Payment Details</p>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="bg-gray-50 rounded-xl p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold inline-block"
                          style={{ background: `${color}18`, color }}
                        >
                          {methodLabel(p.method)}
                        </span>
                        {p.reference && (
                          <p className="text-xs text-gray-500">Ref: <span className="font-mono">{p.reference}</span></p>
                        )}
                        <p className="text-xs text-gray-400">{fmtDate(p.date)}</p>
                      </div>
                      <span className="font-mono text-gray-900 font-bold text-base shrink-0">
                        {fmt(p.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAID stamp */}
          <div className="flex justify-center pt-1 pb-2">
            <div className="border-[3px] border-emerald-500 text-emerald-500 rounded-xl px-8 py-1.5 text-3xl font-black uppercase tracking-[0.2em] -rotate-6 select-none opacity-90">
              PAID
            </div>
          </div>
        </div>

        {/* Bottom perforation + footer */}
        <div
          className="mx-4 border-t-2 border-dashed"
          style={{ borderColor: `${color}40` }}
        />
        <div className="px-6 py-3 text-center text-[11px] text-gray-400 tracking-wide">
          {rcp} &bull; {ownerName} &bull; Thank you!
        </div>
      </div>
    </div>
  );
}
