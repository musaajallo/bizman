import { TopBar } from "@/components/layout/top-bar";
import { getOwnerBusiness } from "@/lib/actions/tenants";
import { getDocuments, getDocumentFolders } from "@/lib/actions/documents";
import { DocumentList } from "@/components/documents/document-list";
import { notFound } from "next/navigation";

export default async function DocumentsPage() {
  const owner = await getOwnerBusiness();
  if (!owner) notFound();

  const [documents, folders] = await Promise.all([
    getDocuments(owner.id),
    getDocumentFolders(owner.id),
  ]);

  return (
    <div>
      <TopBar title="Documents" subtitle="File storage and document management" />
      <div className="p-6">
        <DocumentList
          tenantId={owner.id}
          documents={documents}
          folders={folders}
        />
      </div>
    </div>
  );
}
