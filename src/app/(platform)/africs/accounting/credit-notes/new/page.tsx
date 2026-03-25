import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getInvoiceSettings } from "@/lib/actions/invoice-settings";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export default async function NewCreditNotePage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string; invoiceNumber?: string }>;
}) {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const params = await searchParams;

  const [settings, clients, projects] = await Promise.all([
    getInvoiceSettings(owner.id),
    prisma.tenant.findMany({
      where: { isOwnerBusiness: false },
      select: { id: true, name: true, slug: true, primaryContactEmail: true, primaryContactName: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { tenantId: owner.id },
      select: { id: true, name: true, slug: true, billingType: true, budgetCurrency: true, clientTenantId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // If linked to a specific invoice, pre-fetch its number for display
  let linkedInvoiceNumber: string | null = params.invoiceNumber || null;
  if (params.invoiceId && !linkedInvoiceNumber) {
    const inv = await prisma.invoice.findUnique({
      where: { id: params.invoiceId },
      select: { invoiceNumber: true },
    });
    linkedInvoiceNumber = inv?.invoiceNumber || null;
  }

  return (
    <div>
      <TopBar
        title="New Credit Note"
        subtitle="Issue a credit against an existing invoice"
        actions={
          <Link href="/africs/accounting/credit-notes">
            <Button size="sm" variant="ghost" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <InvoiceForm
          tenantId={owner.id}
          clients={clients}
          projects={projects}
          invoiceType="credit_note"
          creditNoteForId={params.invoiceId || null}
          creditNoteForNumber={linkedInvoiceNumber}
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
