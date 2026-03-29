"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createLoan } from "@/lib/actions/loans";

const LOAN_TYPES = [
  { value: "staff_loan", label: "Staff Loan" },
  { value: "owner_loan", label: "Owner / Director Loan" },
  { value: "salary_advance", label: "Salary Advance" },
];

const SCHEDULES = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "lump_sum", label: "Lump Sum" },
];

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

export function LoanForm({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loanType, setLoanType] = useState("staff_loan");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [payrollDeduction, setPayrollDeduction] = useState(false);
  const [error, setError] = useState("");

  const isStaff = loanType === "staff_loan" || loanType === "salary_advance";
  const selectedEmployee = selectedEmployeeId ? employees.find((e) => e.id === selectedEmployeeId) : undefined;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("loanType", loanType);
    fd.set("payrollDeduction", payrollDeduction ? "true" : "false");

    if (isStaff) {
      if (!selectedEmployeeId) { setError("Please select an employee."); return; }
      fd.set("employeeId", selectedEmployeeId);
      if (selectedEmployee) {
        fd.set("borrowerName", `${selectedEmployee.firstName} ${selectedEmployee.lastName}`);
      }
    }

    startTransition(async () => {
      const result = await createLoan(fd);
      if ("error" in result) { setError(result.error ?? "Unknown error"); return; }
      router.push(`/africs/accounting/loans/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Loan Type</Label>
          <Select value={loanType} onValueChange={(v: string | null) => { if (v) setLoanType(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOAN_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" defaultValue="GMD" className="uppercase" />
        </div>
      </div>

      {isStaff ? (
        <div className="space-y-1.5">
          <Label>Employee</Label>
          <Select value={selectedEmployeeId} onValueChange={(v: string | null) => { if (v) setSelectedEmployeeId(v); }}>
            <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} · {e.employeeNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="borrowerName">Borrower Name</Label>
          <Input id="borrowerName" name="borrowerName" placeholder="Director / owner name" required />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="principal">Principal Amount <span className="text-destructive">*</span></Label>
          <Input id="principal" name="principal" type="number" step="0.01" min="0" required placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="interestRate">Interest Rate (%)</Label>
          <Input id="interestRate" name="interestRate" type="number" step="0.01" min="0" placeholder="0.00" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Repayment Schedule</Label>
          <Select defaultValue="monthly" name="repaymentSchedule" onValueChange={(_v: string | null) => {}}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCHEDULES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="repaymentAmount">Repayment Amount</Label>
          <Input id="repaymentAmount" name="repaymentAmount" type="number" step="0.01" min="0" placeholder="Per instalment" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-xs">
        <Label htmlFor="disbursementDate">Disbursement Date</Label>
        <Input id="disbursementDate" name="disbursementDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>

      {isStaff && (
        <div className="flex items-center gap-2">
          <Checkbox id="payrollDeduction" checked={payrollDeduction} onCheckedChange={(v) => setPayrollDeduction(!!v)} />
          <Label htmlFor="payrollDeduction" className="font-normal cursor-pointer text-sm">
            Deduct repayments automatically from payroll
          </Label>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Purpose or additional details..." />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Create Loan"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
