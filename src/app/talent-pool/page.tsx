import { getOwnerBusiness } from "@/lib/actions/tenants";
import { TalentPoolPublicForm } from "@/components/talent-pool/talent-pool-public-form";
import { notFound } from "next/navigation";

export const metadata = { title: "Join Our Talent Pool" };

export default async function TalentPoolPublicPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">{owner.name}</h1>
          <p className="text-muted-foreground mt-1">Join our talent pool</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Express Your Interest</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Don&apos;t see an open role? Submit your details and we&apos;ll reach out when a suitable opportunity arises.
          </p>
          <TalentPoolPublicForm />
        </div>
      </div>
    </div>
  );
}
