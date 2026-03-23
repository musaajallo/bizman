import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { EmployeeProfilePdf } from "@/components/employees/employee-profile-pdf";
import React from "react";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      tenant: { select: { name: true, logoUrl: true, primaryColor: true, accentColor: true } },
      manager: { select: { firstName: true, lastName: true, jobTitle: true } },
    },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const element = React.createElement(EmployeeProfilePdf, {
    employee: {
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName,
      middleName: employee.middleName,
      lastName: employee.lastName,
      jobTitle: employee.jobTitle,
      department: employee.department,
      unit: employee.unit,
      employmentType: employee.employmentType,
      status: employee.status,
      leaveType: employee.leaveType,
      photoUrl: employee.photoUrl,
      dateOfBirth: employee.dateOfBirth,
      gender: employee.gender,
      nationality: employee.nationality,
      citizenship: employee.citizenship,
      nationalIdNumber: employee.nationalIdNumber,
      taxIdNumber: employee.taxIdNumber,
      personalEmail: employee.personalEmail,
      personalPhone: employee.personalPhone,
      homeAddress: employee.homeAddress,
      emergencyContactName: employee.emergencyContactName,
      emergencyContactPhone: employee.emergencyContactPhone,
      emergencyContactRelationship: employee.emergencyContactRelationship,
      startDate: employee.startDate,
      endDate: employee.endDate,
      probationEndDate: employee.probationEndDate,
      managerId: employee.managerId,
      basicSalary: employee.basicSalary ? Number(employee.basicSalary) : null,
      currency: employee.currency,
      payFrequency: employee.payFrequency,
      bankName: employee.bankName,
      bankAccountName: employee.bankAccountName,
      bankAccountNumber: employee.bankAccountNumber,
      hasMedicalAid: employee.hasMedicalAid,
      medicalAidProvider: employee.medicalAidProvider,
      medicalAidPlan: employee.medicalAidPlan,
      hasPension: employee.hasPension,
      pensionContribution: employee.pensionContribution ? Number(employee.pensionContribution) : null,
      housingAllowance: employee.housingAllowance ? Number(employee.housingAllowance) : null,
      transportAllowance: employee.transportAllowance ? Number(employee.transportAllowance) : null,
      otherAllowance: employee.otherAllowance ? Number(employee.otherAllowance) : null,
      otherAllowanceLabel: employee.otherAllowanceLabel,
      shirtSize: employee.shirtSize,
      trouserSize: employee.trouserSize,
      shoeSize: employee.shoeSize,
      jacketSize: employee.jacketSize,
      notes: employee.notes,
      manager: employee.manager,
    },
    tenant: {
      name: employee.tenant.name,
      logoUrl: employee.tenant.logoUrl,
      primaryColor: employee.tenant.primaryColor,
      accentColor: employee.tenant.accentColor,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  const filename = `profile-${employee.employeeNumber}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
