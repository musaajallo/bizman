# Documents Module — Implementation Plan

## Overview

General-purpose file storage and document management. Users upload files (PDF, images, spreadsheets, etc.), organize them in virtual folders, and track version history. New versions of a document can be uploaded, and all versions are retained.

---

## Data Model

### Document

The main record representing a document. Points to the latest version.

```
Document
  id              String    cuid
  tenantId        String    → Tenant
  name            String                  // display name (editable)
  slug            String                  // URL-safe identifier
  description     String?   @db.Text
  folder          String    default "/"   // virtual folder path e.g. "/contracts/2026"
  tags            String[]
  currentVersionId String?  → DocumentVersion  // points to latest version
  uploadedById    String    → User
  createdAt       DateTime
  updatedAt       DateTime
  archivedAt      DateTime?

  @@unique([tenantId, slug])
  @@index([tenantId, folder])
```

### DocumentVersion

Each upload (initial + subsequent) creates a new version.

```
DocumentVersion
  id          String   cuid
  documentId  String   → Document
  version     Int                      // 1, 2, 3, ...
  fileName    String                   // original filename
  fileUrl     String                   // storage path/URL
  fileSize    Int                      // bytes
  mimeType    String                   // e.g. "application/pdf"
  changelog   String?                  // optional note about what changed
  uploadedById String  → User
  createdAt   DateTime

  @@unique([documentId, version])
  @@index([documentId])
```

---

## Storage Strategy

**Phase 1 (dev):** Local filesystem — save to `public/uploads/documents/` with UUID filenames. The `fileUrl` stores the relative path.

**Phase 2 (production):** Swap to Vercel Blob or S3. Only the upload/download utility functions change; the `fileUrl` field abstracts storage.

---

## Server Actions (`src/lib/actions/documents.ts`)

- `getDocuments(tenantId, { folder?, search?, tags? })` — list with filters, includes current version info
- `getDocumentBySlug(tenantId, slug)` — single document with all versions
- `uploadDocument(formData)` — creates Document + first DocumentVersion
- `uploadNewVersion(documentId, formData)` — creates new DocumentVersion, updates currentVersionId
- `updateDocument(documentId, { name?, description?, folder?, tags? })` — metadata only
- `deleteDocument(documentId)` — soft delete (sets archivedAt)
- `getDocumentVersions(documentId)` — all versions with uploader info
- `downloadVersion(versionId)` — returns file URL for download

---

## Implementation Phases

### Phase 1: Core Upload & List
- Prisma models + migration
- Server actions: upload, list, get, delete
- Upload UI: drag-and-drop zone, file type validation
- List view: table with name, type, size, uploader, date, folder
- Folder filtering (sidebar or breadcrumb)
- Download button per document

### Phase 2: Versioning
- Upload new version dialog (file + changelog)
- Version history panel in document detail view
- Download specific version
- Version comparison (show changelog, size diff, date)

### Phase 3: Organization & Search
- Virtual folder management (create, rename, move)
- Tag management
- Full-text search across document names and descriptions
- Bulk operations (move, tag, delete)

### Phase 4: Preview & Permissions
- In-browser preview for PDF, images, text files
- Per-document or per-folder access control
- Share links with expiry

---

## Route Structure

```
src/app/(platform)/africs/documents/
├── page.tsx                    # Document list with upload zone
├── [slug]/
│   └── page.tsx                # Document detail: metadata, versions, preview
```

---

## Components (`src/components/documents/`)

| Component | Purpose |
|-----------|---------|
| `upload-zone.tsx` | Drag-and-drop file upload area |
| `document-table.tsx` | Table listing documents with actions |
| `document-detail.tsx` | Full detail view with metadata |
| `version-history.tsx` | List of all versions with download/changelog |
| `upload-version-dialog.tsx` | Dialog for uploading a new version |
| `folder-tree.tsx` | Sidebar folder navigation |
