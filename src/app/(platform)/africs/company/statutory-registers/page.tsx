import { TopBar } from "@/components/layout/top-bar";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getDirectors, getShareholders } from "@/lib/actions/statutory-registers";
import { notFound } from "next/navigation";
import { StatutoryRegistersClient } from "@/components/company/statutory-registers-client";

export default async function StatutoryRegistersPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [directors, shareholders] = await Promise.all([
    getDirectors(owner.id),
    getShareholders(owner.id),
  ]);

  return (
    <div>
      <TopBar
        title="Statutory Registers"
        subtitle="Register of Directors and Register of Members (Shareholders)"
      />
      <div className="p-6">
        <StatutoryRegistersClient
          directors={JSON.parse(JSON.stringify(directors))}
          shareholders={JSON.parse(JSON.stringify(shareholders))}
        />
      </div>
    </div>
  );
}
