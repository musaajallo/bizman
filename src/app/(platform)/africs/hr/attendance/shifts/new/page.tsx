import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShiftForm } from "@/components/attendance/shift-form";

export default function NewShiftPage() {
  return (
    <div>
      <TopBar
        title="New Shift"
        subtitle="Create a new work shift"
        actions={
          <Link href="/africs/hr/attendance/shifts">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6 max-w-2xl">
        <ShiftForm />
      </div>
    </div>
  );
}
