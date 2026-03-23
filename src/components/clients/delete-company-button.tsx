"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteTenant } from "@/lib/actions/tenants";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCompanyButton({ tenantId, name }: { tenantId: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    setDeleting(true);
    setError("");
    const result = await deleteTenant(tenantId);

    if (result.error) {
      setError(result.error);
      setDeleting(false);
      alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={deleting}
      title="Delete company"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
