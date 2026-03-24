import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { PayslipPdf } from "@/components/payroll/payslip-pdf";
import React from "react";

function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  return Number(d);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string; payslipId: string }> }
) {
  const { runId, payslipId } = await params;

  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      payrollRun: { select: { id: true, periodLabel: true, status: true } },
      tenant: { select: { name: true, logoUrl: true, primaryColor: true, accentColor: true, address: true } },
    },
  });

  if (!payslip || payslip.payrollRunId !== runId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const element = React.createElement(PayslipPdf, {
    payslip: {
      employeeName: payslip.employeeName,
      employeeNumber: payslip.employeeNumber,
      jobTitle: payslip.jobTitle,
      department: payslip.department,
      bankName: payslip.bankName,
      bankAccountName: payslip.bankAccountName,
      bankAccountNumber: payslip.bankAccountNumber,
      basicSalary: toNum(payslip.basicSalary),
      housingAllowance: toNum(payslip.housingAllowance),
      transportAllowance: toNum(payslip.transportAllowance),
      otherAllowance: toNum(payslip.otherAllowance),
      otherAllowanceLabel: payslip.otherAllowanceLabel,
      grossPay: toNum(payslip.grossPay),
      pensionRate: toNum(payslip.pensionRate),
      pensionContribution: toNum(payslip.pensionContribution),
      medicalAidDeduction: toNum(payslip.medicalAidDeduction),
      payeTax: toNum(payslip.payeTax),
      otherDeduction: toNum(payslip.otherDeduction),
      otherDeductionLabel: payslip.otherDeductionLabel,
      totalDeductions: toNum(payslip.totalDeductions),
      netPay: toNum(payslip.netPay),
      currency: payslip.currency,
      status: payslip.status,
      notes: payslip.notes,
    },
    periodLabel: payslip.payrollRun.periodLabel,
    payrollRunId: payslip.payrollRunId,
    ownerName: payslip.tenant.name,
    ownerAddress: payslip.tenant.address,
    ownerColor: payslip.tenant.accentColor ?? payslip.tenant.primaryColor,
    logoUrl: payslip.tenant.logoUrl,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  const filename = `Payslip-${payslip.employeeNumber}-${payslip.payrollRun.periodLabel.replace(/\s/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
