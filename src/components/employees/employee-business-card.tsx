import { Mail, Phone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "./employee-avatar";

interface Props {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
    department: string | null;
    personalEmail: string | null;
    personalPhone: string | null;
    photoUrl: string | null;
  };
  tenant: {
    name: string;
    primaryColor: string | null;
    accentColor: string | null;
  };
}

export function EmployeeBusinessCard({ employee, tenant }: Props) {
  const color = tenant.accentColor || tenant.primaryColor || "#4F6EF7";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Standard business card — 3.5" × 2"</p>
        <a href={`/api/employees/${employee.id}/business-card/pdf`} download>
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
        </a>
      </div>

      {/* Card preview — landscape 3.5:2 ratio */}
      <div className="flex justify-center">
        <div
          className="relative bg-white rounded-lg shadow-xl overflow-hidden"
          style={{ width: 420, height: 240 }}
        >
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />

          <div className="flex h-full p-5 pt-6">
            {/* Left — photo */}
            <div className="flex items-center justify-center w-[100px] shrink-0">
              <EmployeeAvatar
                firstName={employee.firstName}
                lastName={employee.lastName}
                photoUrl={employee.photoUrl}
                size="lg"
                color={color}
              />
            </div>

            {/* Divider */}
            <div className="w-px mx-4 self-stretch" style={{ backgroundColor: `${color}30` }} />

            {/* Right — details */}
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <p className="text-[17px] font-bold text-gray-900 font-display leading-tight truncate">
                {employee.firstName} {employee.lastName}
              </p>
              {employee.jobTitle && (
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{employee.jobTitle}</p>
              )}
              {employee.department && (
                <p className="text-[10px] text-gray-400 truncate">{employee.department}</p>
              )}

              {/* Colour divider */}
              <div className="my-3 h-px" style={{ backgroundColor: color }} />

              <div className="space-y-1">
                {employee.personalEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="shrink-0" style={{ width: 10, height: 10, color }} />
                    <span className="text-[9px] text-gray-600 truncate">{employee.personalEmail}</span>
                  </div>
                )}
                {employee.personalPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="shrink-0" style={{ width: 10, height: 10, color }} />
                    <span className="text-[9px] text-gray-600">{employee.personalPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Company name bottom-right */}
          <div className="absolute bottom-3 right-4">
            <p className="text-[8px] uppercase tracking-widest text-gray-400 font-medium">{tenant.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
