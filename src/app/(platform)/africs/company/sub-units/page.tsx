import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Component } from "lucide-react";

export default function SubUnitsPage() {
  return (
    <div>
      <TopBar title="Sub-Units" subtitle="Unit subdivisions" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <Component className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Sub-Units</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Manage sub-units within units for granular organizational structure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
