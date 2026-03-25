import { TopBar } from "@/components/layout/top-bar";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { getTaxProfiles } from "@/lib/actions/tax-profiles";
import { getInvoice } from "@/lib/actions/invoices";
import { getProjects } from "@/lib/actions/projects";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  if (invoice.status !== "draft") redirect(`/africs/accounting/invoices/${id}`);

  const [settings, taxProfiles, projects, clients] = await Promise.all([
    getInvoiceSettings(owner.id),
    getTaxProfiles(owner.id),
    getProjects(owner.id),
    prisma.tenant.findMany({
      where: { isOwnerBusiness: false },
      select: { id: true, name: true, slug: true, primaryContactEmail: true, primaryContactName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <TopBar title={`Edit ${invoice.invoiceNumber}`} subtitle="Edit draft invoice" />
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
          invoice={invoice as unknown as Parameters<typeof InvoiceForm>[0]["invoice"]}
          defaultTaxRate={settings.defaultTaxRate}
          defaultDiscountPercent={settings.defaultDiscountPercent}
          defaultRushFeePercent={settings.defaultRushFeePercent}
          taxProfiles={taxProfiles}
          defaultNotes={settings.defaultNotes}
          defaultTerms={settings.defaultTerms}
          defaultDueDays={settings.defaultDueDays}
        />
      </div>
    </div>
  );
}
