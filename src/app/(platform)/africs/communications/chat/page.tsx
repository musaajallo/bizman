import { TopBar } from "@/components/layout/top-bar";

export default function ChatPage() {
  return (
    <div>
      <TopBar title="Chat" subtitle="Live chat with clients and team members" />
      <div className="p-6">
        <div className="border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Live chat module coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
