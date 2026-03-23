import { TopBar } from "@/components/layout/top-bar";

export default function EmailClientPage() {
  return (
    <div>
      <TopBar title="Email" subtitle="Send, receive, and manage emails" />
      <div className="p-6">
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Email client coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
