import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { EmployeeStaffIdPdf } from "@/components/employees/employee-staff-id-pdf";
import React from "react";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { tenant: { select: { name: true, logoUrl: true, primaryColor: true, accentColor: true } } },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const element = React.createElement(EmployeeStaffIdPdf, {
    employee: {
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName,
      lastName: employee.lastName,
      jobTitle: employee.jobTitle,
      department: employee.department,
      photoUrl: employee.photoUrl,
      startDate: employee.startDate,
      endDate: employee.endDate,
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
  const filename = `staff-id-${employee.employeeNumber}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
