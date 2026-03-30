import { prisma } from "@/lib/prisma";
import { getOwnerBusiness } from "@/lib/actions/tenants";

export async function GET() {
  const owner = await getOwnerBusiness();
  if (!owner) return new Response("Unauthorized", { status: 401 });

  const assets = await prisma.asset.findMany({
    where: { tenantId: owner.id },
    include: {
      depreciationEntries: { select: { amount: true } },
    },
    orderBy: { assetNumber: "asc" },
  });

  const rows: string[] = [
    "Asset Number,Name,Category,Status,Purchase Date,Cost,Salvage Value,Useful Life (months),Depreciation Method,Accumulated Depreciation,Book Value,Currency,Location,Serial Number,Brand,Model\r\n",
  ];

  for (const a of assets) {
    const cost = Number(a.purchasePrice ?? 0);
    const salvage = Number(a.salvageValue ?? 0);
    const accumulated = a.depreciationEntries.reduce((s, e) => s + Number(e.amount), 0);
    const bookValue = Math.max(0, cost - accumulated);

    const col = (v: string | number | null | undefined) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    rows.push(
      [
        col(a.assetNumber),
        col(a.name),
        col(a.category),
        col(a.status),
        col(a.purchaseDate ? a.purchaseDate.toISOString().split("T")[0] : ""),
        col(cost.toFixed(2)),
        col(salvage.toFixed(2)),
        col(a.usefulLifeMonths ?? ""),
        col(a.depreciationMethod ?? "none"),
        col(accumulated.toFixed(2)),
        col(bookValue.toFixed(2)),
        col(a.currency),
        col(a.location ?? ""),
        col(a.serialNumber ?? ""),
        col(a.brand ?? ""),
        col(a.model ?? ""),
      ].join(",") + "\r\n",
    );
  }

  const date = new Date().toISOString().split("T")[0];
  return new Response(rows.join(""), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asset-register-${date}.csv"`,
    },
  });
}
