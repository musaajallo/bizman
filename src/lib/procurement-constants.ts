export const REQUISITION_STATUSES = {
  draft:            { label: "Draft",            color: "text-muted-foreground border-border" },
  pending_approval: { label: "Pending Approval", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  approved:         { label: "Approved",         color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  rejected:         { label: "Rejected",         color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
  converted:        { label: "Converted to PO",  color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  cancelled:        { label: "Cancelled",        color: "text-zinc-500 border-zinc-500/30 bg-zinc-500/10" },
} as const;

export const REQUISITION_PRIORITIES = {
  low:    { label: "Low",    color: "text-zinc-400 border-zinc-500/30" },
  normal: { label: "Normal", color: "text-blue-400 border-blue-500/30" },
  high:   { label: "High",   color: "text-amber-400 border-amber-500/30" },
  urgent: { label: "Urgent", color: "text-rose-400 border-rose-500/30" },
} as const;

export const PO_STATUSES = {
  draft:               { label: "Draft",               color: "text-muted-foreground border-border" },
  sent:                { label: "Sent",                color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  partially_received:  { label: "Partially Received",  color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  received:            { label: "Received",            color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  billed:              { label: "Billed",              color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  cancelled:           { label: "Cancelled",           color: "text-zinc-500 border-zinc-500/30 bg-zinc-500/10" },
} as const;

export const UNITS = [
  "pcs", "box", "set", "pair",
  "kg", "g", "litre", "ml",
  "metre", "cm", "mm",
  "sheet", "roll", "pack", "carton",
  "hour", "day",
];

export type RequisitionStatus = keyof typeof REQUISITION_STATUSES;
export type RequisitionPriority = keyof typeof REQUISITION_PRIORITIES;
export type PoStatus = keyof typeof PO_STATUSES;
