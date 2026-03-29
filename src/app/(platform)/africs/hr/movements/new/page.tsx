import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MovementForm } from "@/components/movements/movement-form";
import { getEmployeesForMovement } from "@/lib/actions/movements";

export default async function NewMovementPage() {
  const employees = await getEmployeesForMovement();

  return (
    <div>
      <TopBar
        title="Record Staff Movement"
        subtitle="Log a promotion, demotion, or transfer"
        actions={
          <Link href="/africs/hr/movements">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <MovementForm employees={employees} />
      </div>
    </div>
  );
}
