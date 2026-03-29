import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DisciplinaryForm } from "@/components/movements/disciplinary-form";
import { getEmployeesForMovement } from "@/lib/actions/movements";

export default async function NewDisciplinaryPage() {
  const employees = await getEmployeesForMovement();

  return (
    <div>
      <TopBar
        title="Record Disciplinary Action"
        subtitle="Log a warning, suspension or termination notice"
        actions={
          <Link href="/africs/hr/movements">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <DisciplinaryForm employees={employees} />
      </div>
    </div>
  );
}
