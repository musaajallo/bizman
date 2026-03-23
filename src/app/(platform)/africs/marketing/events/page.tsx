import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function EventsPage() {
  return (
    <div>
      <TopBar title="Events" subtitle="Event planning and management" />
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Events</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Event creation, registration, and attendee management are coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
