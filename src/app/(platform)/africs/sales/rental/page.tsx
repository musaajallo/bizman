import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { KeyRound } from "lucide-react";

export default function RentalPage() {
  return (
    <div>
      <TopBar title="Rental" subtitle="Asset and equipment rental management" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <KeyRound className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Rental</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Equipment rental, availability tracking, and rental agreements are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
