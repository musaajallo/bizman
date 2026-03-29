import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShiftForm } from "@/components/attendance/shift-form";
import { getShift } from "@/lib/actions/attendance";
import { notFound } from "next/navigation";

export default async function EditShiftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shift = await getShift(id);
  if (!shift) notFound();

  return (
    <div>
      <TopBar
        title={`Edit: ${shift.name}`}
        subtitle="Update shift configuration"
        actions={
          <Link href="/africs/hr/attendance/shifts">
            <Button size="sm" variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />
      <div className="p-6 max-w-2xl">
        <ShiftForm existing={shift} />
      </div>
    </div>
  );
}
