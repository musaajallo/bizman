"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Users, ListChecks } from "lucide-react";
import { getProjectTimeReport } from "@/lib/actions/time-entries";

interface Props {
  projectId: string;
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
}

export function TimeReport({ projectId }: Props) {
  const [data, setData] = useState<{
    byUser: { id: string; name: string; image: string | null; totalMinutes: number }[];
    byTask: { id: string; title: string; totalMinutes: number }[];
    totalMinutes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const report = await getProjectTimeReport(projectId);
      setData(report);
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded" />;
  }
  if (!data || data.totalMinutes === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No time logged yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* By team member */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Time by Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.byUser.sort((a, b) => b.totalMinutes - a.totalMinutes).map((user) => {
              const pct = Math.round((user.totalMinutes / data.totalMinutes) * 100);
              return (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px]">
                      {(user.name ?? "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{user.name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{formatHours(user.totalMinutes)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-sm font-mono font-medium">{formatHours(data.totalMinutes)}</span>
          </div>
        </CardContent>
      </Card>

      {/* By task */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Time by Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.byTask
              .sort((a, b) => b.totalMinutes - a.totalMinutes)
              .slice(0, 10)
              .map((task) => {
                const pct = Math.round((task.totalMinutes / data.totalMinutes) * 100);
                return (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className="text-sm truncate flex-1">{task.title}</span>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{formatHours(task.totalMinutes)}</span>
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
