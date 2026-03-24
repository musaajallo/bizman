import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getEmployeesForSelect } from "@/lib/actions/employees";
import { notFound } from "next/navigation";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";

export default async function NewLeaveRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [employees, sp] = await Promise.all([
    getEmployeesForSelect(owner.id),
    searchParams,
  ]);

  return (
    <div>
      <TopBar
        title="New Leave Request"
        subtitle="Submit a leave request for an employee"
        actions={
          <Link href="/africs/hr/time-off">
            <Button size="sm" variant="ghost" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <LeaveRequestForm employees={employees} defaultEmployeeId={sp.employeeId} />
      </div>
    </div>
  );
}
