import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, AlarmClock } from "lucide-react";

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  totalHoursApproved: number;
}

export function OvertimeDashboardCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-semibold tabular-nums">{stats.pending}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approved (this year)</p>
              <p className="text-xl font-semibold tabular-nums">{stats.approved}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rejected (this year)</p>
              <p className="text-xl font-semibold tabular-nums">{stats.rejected}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <AlarmClock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Hours Approved</p>
              <p className="text-xl font-semibold tabular-nums font-mono">{stats.totalHoursApproved}h</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
