import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, UserCheck, CalendarDays } from "lucide-react";

interface Props {
  pending: number;
  approved: number;
  onLeaveNow: number;
  totalRequests: number;
}

export function LeaveDashboardCards({ pending, approved, onLeaveNow, totalRequests }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{approved}</p>
            <p className="text-xs text-muted-foreground">Approved This Year</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-blue-500/10">
            <UserCheck className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{onLeaveNow}</p>
            <p className="text-xs text-muted-foreground">On Leave Now</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-purple-500/10">
            <CalendarDays className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{totalRequests}</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
