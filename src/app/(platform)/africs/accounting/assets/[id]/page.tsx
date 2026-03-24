import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAsset } from "@/lib/actions/assets";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { prisma } from "@/lib/prisma";
import { AssetDetailCard } from "@/components/assets/asset-detail-card";
import { AssetActions } from "@/components/assets/asset-actions";
import { AssetAssignmentTable } from "@/components/assets/asset-assignment-table";
import { AssetAssignDialog } from "@/components/assets/asset-assign-dialog";
import { AssetMaintenanceTable } from "@/components/assets/asset-maintenance-table";
import { AssetMaintenanceForm } from "@/components/assets/asset-maintenance-form";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [asset, owner] = await Promise.all([getAsset(id), getOwnerBusiness()]);
  if (!asset) notFound();

  const employees = owner
    ? await prisma.employee.findMany({
        where: { tenantId: owner.id, status: "active" },
        select: { id: true, firstName: true, lastName: true, jobTitle: true },
        orderBy: { firstName: "asc" },
      })
    : [];

  const hasActiveAssignment = asset.assignments.some((a: { returnedDate: string | null }) => !a.returnedDate);

  return (
    <div>
      <TopBar
        title={asset.assetNumber}
        subtitle={asset.name}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/africs/accounting/assets">
              <Button size="sm" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            </Link>
            <AssetActions assetId={asset.id} hasActiveAssignment={hasActiveAssignment} />
          </div>
        }
      />
      <div className="p-6 max-w-4xl space-y-6">
        <AssetDetailCard asset={asset} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Assignments</CardTitle>
            <AssetAssignDialog assetId={asset.id} employees={employees} />
          </CardHeader>
          <CardContent>
            <AssetAssignmentTable assetId={asset.id} assignments={asset.assignments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Maintenance</CardTitle>
            <AssetMaintenanceForm assetId={asset.id} currency={asset.currency} />
          </CardHeader>
          <CardContent>
            <AssetMaintenanceTable assetId={asset.id} records={asset.maintenance} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
