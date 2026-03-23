import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "./employee-avatar";

interface Props {
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    department: string | null;
    photoUrl: string | null;
    startDate: Date | string;
    endDate: Date | string | null;
  };
  tenant: {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  };
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function EmployeeStaffIdCard({ employee, tenant }: Props) {
  const color = tenant.accentColor || tenant.primaryColor || "#4F6EF7";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">CR-80 staff ID card — 2.13" × 3.38"</p>
        <a href={`/api/employees/${employee.id}/staff-id/pdf`} download>
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
        </a>
      </div>

      {/* Card preview — portrait CR-80 ratio ~1:1.586 */}
      <div className="flex justify-center">
        <div
          className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ width: 255, height: 405 }}
        >
          {/* Header band */}
          <div
            className="flex flex-col items-center justify-center px-4 py-4 shrink-0"
            style={{ backgroundColor: color, minHeight: 90 }}
          >
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt="Logo" className="h-9 object-contain brightness-0 invert" />
            ) : (
              <p className="text-white font-display font-bold text-sm text-center">{tenant.name}</p>
            )}
          </div>

          {/* Photo — overlapping header */}
          <div className="flex justify-center" style={{ marginTop: -40 }}>
            <div className="rounded-full ring-4 ring-white shadow-lg overflow-hidden" style={{ width: 80, height: 80 }}>
              <EmployeeAvatar
                firstName={employee.firstName}
                lastName={employee.lastName}
                photoUrl={employee.photoUrl}
                size="lg"
                color={color}
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col items-center px-5 pt-3 pb-2 flex-1">
            <p className="font-display font-bold text-gray-900 text-[15px] text-center leading-tight mt-1">
              {employee.firstName} {employee.lastName}
            </p>
            {employee.jobTitle && (
              <p className="text-[10px] text-gray-500 text-center mt-0.5">{employee.jobTitle}</p>
            )}
            {employee.department && (
              <p className="text-[10px] text-gray-400 text-center">{employee.department}</p>
            )}

            {/* Employee number — barcode feel */}
            <div className="mt-4 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-100 w-full text-center">
              <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-0.5">ID</p>
              <p
                className="font-mono font-bold text-sm tracking-[0.2em]"
                style={{ color }}
              >
                {employee.employeeNumber}
              </p>
            </div>

            {/* Barcode stripes decoration */}
            <div className="flex gap-[2px] mt-3 opacity-20">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  style={{ backgroundColor: color, width: i % 3 === 0 ? 3 : 2, height: i % 5 === 0 ? 20 : 14 }}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2 text-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <p className="text-[8px] font-medium" style={{ color }}>
              Valid: {fmt(employee.startDate)} — {employee.endDate ? fmt(employee.endDate) : "No Expiry"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
