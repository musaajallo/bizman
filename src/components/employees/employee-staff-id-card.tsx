"use client";

import { useState } from "react";
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
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRelationship: string | null;
    personalPhone: string | null;
    personalEmail: string | null;
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
  const [side, setSide] = useState<"front" | "back">("front");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          <button
            onClick={() => setSide("front")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${side === "front" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Front
          </button>
          <button
            onClick={() => setSide("back")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${side === "back" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Back
          </button>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">CR-80 — 2.13" × 3.38"</p>
          <a href={`/api/employees/${employee.id}/staff-id/pdf`} download>
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          </a>
        </div>
      </div>

      <div className="flex justify-center">
        {side === "front" ? (
          /* ── FRONT ─────────────────────────────────────────────── */
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

            {/* Photo overlapping header */}
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

              {/* Employee number */}
              <div className="mt-4 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-100 w-full text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-0.5">ID</p>
                <p className="font-mono font-bold text-sm tracking-[0.2em]" style={{ color }}>
                  {employee.employeeNumber}
                </p>
              </div>

              {/* Barcode decoration */}
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
            <div className="px-4 py-2 text-center" style={{ backgroundColor: `${color}20` }}>
              <p className="text-[8px] font-medium" style={{ color }}>
                Valid: {fmt(employee.startDate)} — {employee.endDate ? fmt(employee.endDate) : "No Expiry"}
              </p>
            </div>
          </div>
        ) : (
          /* ── BACK ──────────────────────────────────────────────── */
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ width: 255, height: 405 }}
          >
            {/* Top strip */}
            <div className="h-3 shrink-0" style={{ backgroundColor: color }} />

            {/* Company branding */}
            <div className="flex flex-col items-center py-4 px-5 border-b border-gray-100">
              {tenant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logoUrl} alt="Logo" className="h-7 object-contain" />
              ) : (
                <p className="font-display font-bold text-[12px] text-center" style={{ color }}>{tenant.name}</p>
              )}
            </div>

            {/* Emergency contact */}
            <div className="flex-1 px-5 py-4 space-y-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color }}>
                  Emergency Contact
                </p>
                {employee.emergencyContactName ? (
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-900">{employee.emergencyContactName}</p>
                    {employee.emergencyContactRelationship && (
                      <p className="text-[9px] text-gray-400">{employee.emergencyContactRelationship}</p>
                    )}
                    {employee.emergencyContactPhone && (
                      <p className="text-[10px] font-mono text-gray-700 mt-1">{employee.emergencyContactPhone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-400 italic">Not specified</p>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Employee contact */}
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color }}>
                  Employee Contact
                </p>
                <div className="space-y-0.5">
                  {employee.personalPhone && (
                    <p className="text-[9px] text-gray-600">{employee.personalPhone}</p>
                  )}
                  {employee.personalEmail && (
                    <p className="text-[9px] text-gray-600 break-all">{employee.personalEmail}</p>
                  )}
                  {!employee.personalPhone && !employee.personalEmail && (
                    <p className="text-[9px] text-gray-400 italic">Not specified</p>
                  )}
                </div>
              </div>
            </div>

            {/* If found footer */}
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <p className="text-[7px] text-gray-400 uppercase tracking-wide">If found, please return to</p>
              <p className="text-[9px] font-bold text-gray-700 mt-0.5">{tenant.name}</p>
            </div>

            {/* Bottom strip */}
            <div className="h-2 shrink-0" style={{ backgroundColor: color }} />
          </div>
        )}
      </div>
    </div>
  );
}
