import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Application Received" };

export default function TalentPoolSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Application Received!</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Thank you for your interest. We&apos;ve added you to our talent pool and will be in touch when a suitable opportunity arises.
        </p>
        <Link href="/talent-pool" className="text-sm text-primary hover:underline">
          Submit another application
        </Link>
      </div>
    </div>
  );
}
