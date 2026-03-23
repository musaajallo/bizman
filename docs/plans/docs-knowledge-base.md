# Docs (Knowledge Base) Module — Implementation Plan

## Overview

Internal documentation platform where the company publishes policies, SOPs, guides, training materials, and other markdown-based content. Users can:

1. **Upload** `.md` files (single or zipped folder) to bulk-create pages
2. **Edit** markdown directly in the browser with a rich editor
3. **Version** every edit — full revision history with diff viewing
4. **Browse** a docs-like site with sidebar navigation, categories, and search

---

## Data Model

### DocPage

The canonical page. Always holds the **current** content.

```
DocPage
  id           String    cuid
  tenantId     String    → Tenant
  title        String
  slug         String                   // URL path segment
  content      String    @db.Text       // current markdown content
  excerpt      String?                  // auto-generated or manual summary
  parentId     String?   → DocPage      // tree nesting (sections → pages)
  category     String    default "General"  // top-level grouping
  icon         String?                  // emoji or lucide icon name
  order        Int       default 0
  published    Boolean   default false
  publishedAt  DateTime?
  createdById  String    → User
  lastEditedById String? → User
  createdAt    DateTime
  updatedAt    DateTime
  archivedAt   DateTime?

  @@unique([tenantId, slug])
  @@index([tenantId, category, order])
  @@index([tenantId, parentId])
```

### DocRevision

Every save (edit or upload) creates a revision. The current content on DocPage always matches the latest revision.

```
DocRevision
  id          String   cuid
  docPageId   String   → DocPage
  version     Int                      // 1, 2, 3, ... auto-incremented
  title       String                   // title at time of revision
  content     String   @db.Text        // full markdown at this version
  changelog   String?                  // "Updated section 3" or "Initial upload"
  editedById  String   → User
  createdAt   DateTime

  @@unique([docPageId, version])
  @@index([docPageId])
```

---

## Upload Flow

### Single `.md` file
1. User selects a `.md` file
2. Server reads content, parses optional YAML frontmatter:
   ```yaml
   ---
   title: Onboarding Guide
   category: HR Policies
   order: 1
   ---
   ```
3. Creates `DocPage` + initial `DocRevision` (version 1)
4. If no frontmatter title, derives from filename (`onboarding-guide.md` → "Onboarding Guide")

### Zipped folder
1. User uploads a `.zip` containing `.md` files, optionally nested in folders
2. Server extracts, walks the tree:
   - Top-level folders → `category` values
   - Nested folders → parent `DocPage` entries (section headings)
   - `.md` files → `DocPage` entries with content
3. Each file creates a `DocPage` + `DocRevision`
4. Folder structure maps to `parentId` relationships
5. File order within folders determined by filename prefix (`01-intro.md`, `02-setup.md`) or alphabetical

### Upload new version of a page
1. User uploads a `.md` file targeting an existing `DocPage`
2. Server creates a new `DocRevision` with incremented version
3. Updates `DocPage.content` to match the new upload
4. Records changelog (auto: "Uploaded new version" or user-provided)

---

## In-App Editing

### Editor
- Use a markdown editor component (e.g., `@uiw/react-md-editor` or custom `textarea` with preview toggle)
- Split view: edit pane (left) + live preview (right)
- Toolbar: headings, bold, italic, links, images, code blocks, tables, checklists
- Auto-save draft to localStorage, explicit "Save" creates a new revision

### Save Flow
1. User edits content in the browser
2. Clicks "Save" → optionally enters a changelog message
3. Server action:
   - Gets current version number for the page
   - Creates new `DocRevision` (version + 1)
   - Updates `DocPage.content`, `DocPage.updatedAt`, `DocPage.lastEditedById`
4. Toast confirmation with version number

### Version History
- Panel showing all revisions: version number, editor name, date, changelog
- Click a revision to view its full content (read-only)
- "Restore this version" button → creates a NEW revision with that old content (never destructive)
- Diff view between any two versions (future enhancement)

---

## Server Actions (`src/lib/actions/docs.ts`)

- `getDocPages(tenantId, { category?, search?, parentId?, published? })` — list pages
- `getDocPageBySlug(tenantId, slug)` — single page with current content
- `getDocTree(tenantId)` — full tree structure for sidebar nav
- `createDocPage({ title, content, category, parentId, ... })` — creates page + revision v1
- `updateDocPage(pageId, { title?, content?, category?, order?, published? })` — updates page, creates new revision if content/title changed
- `uploadMarkdownFile(formData)` — parse single .md, create page + revision
- `uploadMarkdownZip(formData)` — extract zip, create pages tree + revisions
- `uploadNewVersion(pageId, formData)` — upload .md file as new version of existing page
- `archiveDocPage(pageId)` — soft delete
- `publishDocPage(pageId)` — sets published = true, publishedAt
- `unpublishDocPage(pageId)` — sets published = false
- `getDocRevisions(pageId)` — all revisions ordered by version desc
- `getDocRevision(revisionId)` — single revision content
- `restoreRevision(pageId, revisionId)` — creates new revision from old content
- `reorderDocPages(parentId, orderedIds[])` — batch reorder

---

## Implementation Phases

### Phase 1: Core CRUD + Upload
- Prisma models (DocPage, DocRevision) + migration
- Server actions: create, read, update, list, tree
- Single `.md` file upload with frontmatter parsing
- Basic list page with category grouping
- Doc reader page (render markdown with react-markdown)

### Phase 2: In-App Editor + Versioning
- Markdown editor component (split view with preview)
- Save flow with revision creation
- Version history panel
- View old revisions
- Restore from revision

### Phase 3: Docs Site Layout
- Sidebar navigation tree (categories → sections → pages)
- Breadcrumb navigation
- Table of contents (auto-generated from headings)
- Search across all pages (title + content)
- Previous/Next page navigation

### Phase 4: Bulk Upload + Management
- Zipped folder upload with tree extraction
- Upload new version of existing page via file
- Drag-and-drop reordering
- Bulk publish/unpublish/archive
- Category management (create, rename, reorder)

### Phase 5: Polish
- Full-text search with highlighting
- Diff view between revisions
- Print-friendly layout
- Export page/section as PDF
- Markdown syntax reference sidebar
- Role-based publishing (editors vs viewers)

---

## Route Structure

```
src/app/(platform)/africs/docs/
├── page.tsx                        # Docs home — category grid or recent pages
├── new/page.tsx                    # Create new doc page
├── upload/page.tsx                 # Upload .md file(s) or .zip
├── [slug]/
│   ├── page.tsx                    # Doc reader — rendered markdown
│   ├── edit/page.tsx               # Markdown editor
│   └── history/page.tsx            # Version history
├── layout.tsx                      # Docs layout with sidebar nav
```

---

## Components (`src/components/docs/`)

| Component | Purpose |
|-----------|---------|
| `docs-sidebar.tsx` | Tree navigation (categories → pages) |
| `doc-reader.tsx` | Markdown renderer with TOC |
| `doc-editor.tsx` | Split-view markdown editor with toolbar |
| `doc-upload-zone.tsx` | Upload .md / .zip files |
| `revision-history.tsx` | Version list with restore action |
| `revision-viewer.tsx` | Read-only view of a specific revision |
| `doc-page-card.tsx` | Card for docs home grid |
| `category-nav.tsx` | Category tabs/pills for filtering |
| `doc-breadcrumb.tsx` | Breadcrumb from category → parent → page |
| `doc-toc.tsx` | Auto-generated table of contents from headings |
| `publish-toggle.tsx` | Draft/Published toggle button |
| `changelog-dialog.tsx` | Dialog to enter changelog message on save |

---

## Markdown Rendering Stack

- `react-markdown` — core renderer
- `remark-gfm` — GitHub Flavored Markdown (tables, strikethrough, checkboxes)
- `rehype-highlight` or `rehype-prism-plus` — code syntax highlighting
- `rehype-slug` + `rehype-autolink-headings` — heading anchors for TOC
- `remark-frontmatter` + `remark-parse-frontmatter` — frontmatter parsing on upload

---

## Key Design Decisions

1. **Content in DB, not filesystem** — enables search, versioning, access control, and works on any hosting
2. **Full content in each revision** — simpler than diffs, enables instant restore, storage is cheap for text
3. **Restore creates new revision** — never destructive, full audit trail
4. **Frontmatter optional** — files without it still work, metadata derived from filename
5. **Categories are strings, not a separate model** — simpler, can promote to a model later if needed
6. **Tree structure via parentId** — supports unlimited nesting depth
