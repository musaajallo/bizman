import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/providers/auth-guard";

export const dynamic = "force-dynamic";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <Sidebar />
        <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">{children}</main>
      </div>
    </AuthGuard>
  );
}
