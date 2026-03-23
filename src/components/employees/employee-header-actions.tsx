"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, ChevronDown, UserCheck, UserX, PauseCircle, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmployeeStatusDialog } from "./employee-status-dialog";

type StatusTarget = "on_leave" | "terminated" | "resigned" | "suspended" | "active" | null;

interface Props {
  employeeId: string;
  currentStatus: string;
}

export function EmployeeHeaderActions({ employeeId, currentStatus }: Props) {
  const [dialogStatus, setDialogStatus] = useState<StatusTarget>(null);

  const isActive = currentStatus === "active";
  const isInactive = currentStatus === "terminated" || currentStatus === "resigned";

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href="/africs/hr/employees">
          <Button size="sm" variant="ghost" className="gap-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            All Employees
          </Button>
        </Link>

        {/* Activate / Deactivate */}
        {!isActive && (
          <Button size="sm" variant="outline" className="gap-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => setDialogStatus("active")}>
            <UserCheck className="h-3.5 w-3.5" />
            Activate
          </Button>
        )}

        {/* Status change dropdown — only for non-terminal states */}
        {!isInactive && (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button size="sm" variant="outline" className="gap-1.5">
                Change Status
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-48">
              {currentStatus !== "active" && (
                <DropdownMenuItem onClick={() => setDialogStatus("active")}>
                  <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                  Set Active
                </DropdownMenuItem>
              )}
              {currentStatus !== "on_leave" && (
                <DropdownMenuItem onClick={() => setDialogStatus("on_leave")}>
                  <PauseCircle className="h-3.5 w-3.5 mr-2 text-amber-400" />
                  Place on Leave
                </DropdownMenuItem>
              )}
              {currentStatus !== "suspended" && (
                <DropdownMenuItem onClick={() => setDialogStatus("suspended")}>
                  <UserX className="h-3.5 w-3.5 mr-2 text-orange-400" />
                  Suspend
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDialogStatus("resigned")} className="text-muted-foreground">
                <UserMinus className="h-3.5 w-3.5 mr-2" />
                Record Resignation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialogStatus("terminated")} className="text-destructive focus:text-destructive">
                <UserX className="h-3.5 w-3.5 mr-2" />
                Terminate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Link href={`/africs/hr/employees/${employeeId}/edit`}>
          <Button size="sm" variant="outline" className="gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
      </div>

      {dialogStatus && (
        <EmployeeStatusDialog
          employeeId={employeeId}
          targetStatus={dialogStatus}
          onClose={() => setDialogStatus(null)}
        />
      )}
    </>
  );
}
