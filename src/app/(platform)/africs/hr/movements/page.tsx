import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStaffMovements, getDisciplinaryRecords, getMovementStats } from "@/lib/actions/movements";
import { MovementsTable } from "@/components/movements/movements-table";
import { DisciplinaryTable } from "@/components/movements/disciplinary-table";
import { Plus, ArrowUpCircle, ArrowDownCircle, Building2, AlertTriangle } from "lucide-react";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const [stats, movements, disciplinary] = await Promise.all([
    getMovementStats(),
    getStaffMovements(),
    getDisciplinaryRecords(),
  ]);

  return (
    <div>
      <TopBar
        title="Movements & Disciplinary"
        subtitle="Promotions, demotions, transfers and disciplinary records"
        actions={
          <div className="flex gap-2">
            <Link href="/africs/hr/movements/new">
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Record Movement</Button>
            </Link>
            <Link href="/africs/hr/movements/disciplinary/new">
              <Button size="sm" variant="outline" className="gap-2"><Plus className="h-4 w-4" />Disciplinary Action</Button>
            </Link>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Promotions", value: stats.promotions, icon: ArrowUpCircle, color: "text-emerald-400" },
            { label: "Demotions", value: stats.demotions, icon: ArrowDownCircle, color: "text-red-400" },
            { label: "Transfers", value: stats.transfers, icon: Building2, color: "text-violet-400" },
            { label: "Active Disciplinary", value: stats.disciplinary, icon: AlertTriangle, color: "text-amber-400" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue={tab === "disciplinary" ? "disciplinary" : "movements"}>
          <TabsList>
            <TabsTrigger value="movements">Staff Movements</TabsTrigger>
            <TabsTrigger value="disciplinary">Disciplinary Records</TabsTrigger>
          </TabsList>
          <TabsContent value="movements" className="rounded-md border overflow-hidden mt-4">
            <MovementsTable movements={movements} />
          </TabsContent>
          <TabsContent value="disciplinary" className="rounded-md border overflow-hidden mt-4">
            <DisciplinaryTable records={disciplinary} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
