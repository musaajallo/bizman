"use client";

import { useState } from "react";
import { Mail, Phone, Download, Globe } from "lucide-react";
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
    logoUrl?: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  };
}

export function EmployeeBusinessCard({ employee, tenant }: Props) {
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
          <p className="text-xs text-muted-foreground">3.5" × 2"</p>
          <a href={`/api/employees/${employee.id}/business-card/pdf`} download>
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
            className="relative bg-white rounded-lg shadow-xl overflow-hidden"
            style={{ width: 420, height: 240 }}
          >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />

            <div className="flex h-full p-5 pt-6">
              {/* Photo */}
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

              {/* Details */}
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
        ) : (
          /* ── BACK ──────────────────────────────────────────────── */
          <div
            className="relative rounded-lg shadow-xl overflow-hidden flex flex-col items-center justify-center"
            style={{ width: 420, height: 240, backgroundColor: color }}
          >
            {/* Decorative circles */}
            <div
              className="absolute -top-12 -right-12 rounded-full opacity-10"
              style={{ width: 140, height: 140, backgroundColor: "#ffffff" }}
            />
            <div
              className="absolute -bottom-16 -left-16 rounded-full opacity-10"
              style={{ width: 180, height: 180, backgroundColor: "#ffffff" }}
            />

            {/* Bottom accent strip */}
            <div className="absolute bottom-0 left-0 right-0 h-[6px] bg-black/10" />

            {/* Content */}
            <div className="relative flex flex-col items-center gap-3 px-8">
              {tenant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-10 object-contain brightness-0 invert"
                />
              ) : (
                <p className="text-white font-display font-bold text-xl tracking-wide text-center">
                  {tenant.name}
                </p>
              )}

              <div className="w-12 h-px bg-white/40" />

              <p className="text-white/70 text-[9px] uppercase tracking-[0.2em] text-center">
                {employee.jobTitle || tenant.name}
              </p>

              {/* Globe icon as placeholder for website */}
              <div className="flex items-center gap-1.5 mt-1">
                <Globe style={{ width: 9, height: 9, color: "rgba(255,255,255,0.5)" }} />
                <span className="text-[8px] text-white/50">{tenant.name.toLowerCase().replace(/\s/g, "")}.com</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
