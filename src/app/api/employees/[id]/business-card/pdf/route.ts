import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { EmployeeBusinessCardPdf } from "@/components/employees/employee-business-card-pdf";
import React from "react";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { tenant: { select: { name: true, primaryColor: true, accentColor: true } } },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const element = React.createElement(EmployeeBusinessCardPdf, {
    employee: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      jobTitle: employee.jobTitle,
      department: employee.department,
      personalEmail: employee.personalEmail,
      personalPhone: employee.personalPhone,
      photoUrl: employee.photoUrl,
    },
    tenant: {
      name: employee.tenant.name,
      primaryColor: employee.tenant.primaryColor,
      accentColor: employee.tenant.accentColor,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  const filename = `business-card-${employee.employeeNumber}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
