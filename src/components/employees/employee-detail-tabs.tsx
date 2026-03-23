"use client";

import { useState } from "react";
import { EmployeeProfileSections } from "./employee-profile-sections";
import { EmployeeBusinessCard } from "./employee-business-card";
import { EmployeeStaffIdCard } from "./employee-staff-id-card";
import { EmployeeDocumentList } from "./employee-document-list";

type Employee = Parameters<typeof EmployeeProfileSections>[0]["employee"] &
  Parameters<typeof EmployeeBusinessCard>[0]["employee"] &
  Parameters<typeof EmployeeStaffIdCard>[0]["employee"] & {
    documents: Parameters<typeof EmployeeDocumentList>[0]["documents"];
  };

type Tenant = Parameters<typeof EmployeeBusinessCard>[0]["tenant"] &
  Parameters<typeof EmployeeStaffIdCard>[0]["tenant"];

const TABS = ["Profile", "Business Card", "Staff ID", "Documents"] as const;

export function EmployeeDetailTabs({ employee, tenant }: { employee: Employee; tenant: Tenant }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border pb-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "Profile" && <EmployeeProfileSections employee={employee} />}
      {tab === "Business Card" && <EmployeeBusinessCard employee={employee} tenant={tenant} />}
      {tab === "Staff ID" && <EmployeeStaffIdCard employee={employee} tenant={tenant} />}
      {tab === "Documents" && <EmployeeDocumentList employeeId={employee.id} documents={employee.documents} />}
    </div>
  );
}
