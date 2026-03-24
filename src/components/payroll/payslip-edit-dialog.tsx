"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { updatePayslip } from "@/lib/actions/payroll";

interface Payslip {
  id: string;
  employeeName: string;
  employeeNumber: string;
  currency: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  otherAllowanceLabel: string | null;
  pensionRate: number;
  medicalAidDeduction: number;
  payeTax: number;
  otherDeduction: number;
  otherDeductionLabel: string | null;
  notes: string | null;
}

interface Props {
  payslip: Payslip;
  onClose: () => void;
}

export function PayslipEditDialog({ payslip, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [vals, setVals] = useState({
    basicSalary: payslip.basicSalary,
    housingAllowance: payslip.housingAllowance,
    transportAllowance: payslip.transportAllowance,
    otherAllowance: payslip.otherAllowance,
    otherAllowanceLabel: payslip.otherAllowanceLabel ?? "",
    pensionRate: payslip.pensionRate,
    medicalAidDeduction: payslip.medicalAidDeduction,
    payeTax: payslip.payeTax,
    otherDeduction: payslip.otherDeduction,
    otherDeductionLabel: payslip.otherDeductionLabel ?? "",
    notes: payslip.notes ?? "",
  });

  const gross = vals.basicSalary + vals.housingAllowance + vals.transportAllowance + vals.otherAllowance;
  const pension = parseFloat(((vals.pensionRate / 100) * vals.basicSalary).toFixed(2));
  const totalDed = parseFloat((pension + vals.medicalAidDeduction + vals.payeTax + vals.otherDeduction).toFixed(2));
  const net = parseFloat((gross - totalDed).toFixed(2));

  function num(key: keyof typeof vals) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setVals((v) => ({ ...v, [key]: parseFloat(e.target.value) || 0 }));
  }
  function str(key: keyof typeof vals) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setVals((v) => ({ ...v, [key]: e.target.value }));
  }

  function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: payslip.currency }).format(n);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updatePayslip(payslip.id, {
        basicSalary: vals.basicSalary,
        housingAllowance: vals.housingAllowance,
        transportAllowance: vals.transportAllowance,
        otherAllowance: vals.otherAllowance,
        otherAllowanceLabel: vals.otherAllowanceLabel || null,
        pensionRate: vals.pensionRate,
        medicalAidDeduction: vals.medicalAidDeduction,
        payeTax: vals.payeTax,
        otherDeduction: vals.otherDeduction,
        otherDeductionLabel: vals.otherDeductionLabel || null,
        notes: vals.notes || null,
      });
      if ("error" in result) {
        setError(result.error ?? "An error occurred");
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Payslip — {payslip.employeeName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Earnings */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Earnings</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Basic Salary</Label>
                <Input type="number" min={0} step="0.01" value={vals.basicSalary} onChange={num("basicSalary")} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Housing Allowance</Label>
                <Input type="number" min={0} step="0.01" value={vals.housingAllowance} onChange={num("housingAllowance")} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Transport Allowance</Label>
                <Input type="number" min={0} step="0.01" value={vals.transportAllowance} onChange={num("transportAllowance")} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Other Allowance</Label>
                <Input type="number" min={0} step="0.01" value={vals.otherAllowance} onChange={num("otherAllowance")} className="h-8 text-sm" />
              </div>
              {(vals.otherAllowance > 0) && (
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Other Allowance Label</Label>
                  <Input type="text" value={vals.otherAllowanceLabel} onChange={str("otherAllowanceLabel")} className="h-8 text-sm" placeholder="e.g. Bonus" />
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/40">
              <span>Gross Pay</span>
              <span className="font-mono">{fmt(gross)}</span>
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deductions</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pension Rate (%)</Label>
                <Input type="number" min={0} max={100} step="0.01" value={vals.pensionRate} onChange={num("pensionRate")} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Pension Amount (computed)</Label>
                <Input value={fmt(pension)} readOnly className="h-8 text-sm bg-muted/50 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Medical Aid</Label>
                <Input type="number" min={0} step="0.01" value={vals.medicalAidDeduction} onChange={num("medicalAidDeduction")} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PAYE Tax</Label>
                <Input type="number" min={0} step="0.01" value={vals.payeTax} onChange={num("payeTax")} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Other Deduction</Label>
                <Input type="number" min={0} step="0.01" value={vals.otherDeduction} onChange={num("otherDeduction")} className="h-8 text-sm" />
              </div>
              {vals.otherDeduction > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Other Deduction Label</Label>
                  <Input type="text" value={vals.otherDeductionLabel} onChange={str("otherDeductionLabel")} className="h-8 text-sm" placeholder="e.g. Loan repayment" />
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/40 text-destructive">
              <span>Total Deductions</span>
              <span className="font-mono">{fmt(totalDed)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-base font-bold text-emerald-400 py-1">
            <span>Net Pay</span>
            <span className="font-mono">{fmt(net)}</span>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea value={vals.notes} onChange={str("notes")} rows={2} placeholder="Optional note on this payslip…" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
