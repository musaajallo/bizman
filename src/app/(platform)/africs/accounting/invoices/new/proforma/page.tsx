import { TopBar } from "@/components/layout/top-bar";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { getProjects } from "@/lib/actions/projects";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export default async function NewProformaPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [settings, projects, clients] = await Promise.all([
    getInvoiceSettings(owner.id),
    getProjects(owner.id),
    prisma.tenant.findMany({
      where: { isOwnerBusiness: false },
      select: { id: true, name: true, slug: true, primaryContactEmail: true, primaryContactName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <TopBar title="New Proforma Invoice" subtitle="Create a proforma invoice (estimate/quote)" />
      <div className="p-6">
        <InvoiceForm
          tenantId={owner.id}
          clients={clients}
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            billingType: p.billingType,
            budgetCurrency: p.budgetCurrency,
            clientTenantId: p.clientTenantId,
          }))}
          invoiceType="proforma"
          defaultTaxRate={settings.defaultTaxRate}
          defaultDiscountPercent={settings.defaultDiscountPercent}
          defaultRushFeePercent={settings.defaultRushFeePercent}
          defaultNotes={settings.defaultNotes}
          defaultTerms={settings.defaultTerms}
          defaultDueDays={settings.defaultDueDays}
        />
      </div>
    </div>
  );
}
