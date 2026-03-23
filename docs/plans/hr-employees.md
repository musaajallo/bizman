# HR Employee Module — Implementation Plan

---

## Overview

A comprehensive employee management system covering the full employee lifecycle: onboarding, profile management, compensation, benefits, uniform sizing, documents, and printable business card / staff ID card output.

---

## 1. Schema Changes (`prisma/schema.prisma`)

### New Models

```prisma
model Employee {
  id                  String    @id @default(cuid())
  tenantId            String

  // Auto-generated or manual employee ID (e.g., EMP-0001)
  employeeNumber      String

  // Personal
  firstName           String
  lastName            String
  middleName          String?
  dateOfBirth         DateTime?
  gender              String?           // male | female | other | prefer_not_to_say
  nationality         String?
  nationalIdNumber    String?
  photoUrl            String?   @db.Text  // base64 data URL or file path

  // Contact
  personalEmail       String?
  personalPhone       String?
  homeAddress         String?   @db.Text

  // Emergency Contact
  emergencyContactName         String?
  emergencyContactPhone        String?
  emergencyContactRelationship String?

  // Employment
  jobTitle            String?
  department          String?
  unit                String?
  employmentType      String    @default("full_time")   // full_time | part_time | contract | intern
  startDate           DateTime
  endDate             DateTime?
  probationEndDate    DateTime?
  status              String    @default("active")      // active | on_leave | suspended | terminated

  // Reporting
  managerId           String?

  // Compensation
  basicSalary         Decimal?  @db.Decimal(12, 2)
  currency            String?   @default("USD")
  payFrequency        String?   @default("monthly")     // monthly | biweekly | weekly
  bankName            String?
  bankAccountName     String?
  bankAccountNumber   String?

  // Benefits
  hasMedicalAid       Boolean   @default(false)
  medicalAidProvider  String?
  medicalAidPlan      String?
  hasPension          Boolean   @default(false)
  pensionContribution Decimal?  @db.Decimal(5, 2)       // percentage e.g. 5.00
  housingAllowance    Decimal?  @db.Decimal(12, 2)
  transportAllowance  Decimal?  @db.Decimal(12, 2)
  otherAllowance      Decimal?  @db.Decimal(12, 2)
  otherAllowanceLabel String?

  // Sizes (uniform / kit ordering)
  shirtSize           String?   // XS | S | M | L | XL | XXL | XXXL
  trouserSize         String?   // waist-length e.g. "32-32"
  shoeSize            String?   // EU or UK size e.g. "43"
  jacketSize          String?   // XS | S | M | L | XL | XXL

  // Internal notes
  notes               String?   @db.Text

  // Optional link to a platform User account
  userId              String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  manager             Employee? @relation("EmployeeManager", fields: [managerId], references: [id], onDelete: SetNull)
  directReports       Employee[] @relation("EmployeeManager")
  user                User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  documents           EmployeeDocument[]

  @@unique([tenantId, employeeNumber])
  @@index([tenantId, status])
  @@index([tenantId, department])
  @@index([managerId])
}

model EmployeeDocument {
  id          String   @id @default(cuid())
  employeeId  String
  name        String              // e.g., "Employment Contract", "National ID"
  fileUrl     String   @db.Text  // base64 data URL or path
  fileSize    Int?
  mimeType    String?
  uploadedAt  DateTime @default(now())

  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
}
```

### Changes to Existing Models

**`User` model** — add relation:
```prisma
employees Employee[]
```

**`Tenant` model** — add relation:
```prisma
employees Employee[]
```

### Allowed Values Reference (application-level, not Prisma enums — matches existing pattern)

| Field | Values |
|---|---|
| `gender` | `male`, `female`, `other`, `prefer_not_to_say` |
| `employmentType` | `full_time`, `part_time`, `contract`, `intern` |
| `status` | `active`, `on_leave`, `suspended`, `terminated` |
| `payFrequency` | `monthly`, `biweekly`, `weekly` |
| `shirtSize` / `jacketSize` | `XS`, `S`, `M`, `L`, `XL`, `XXL`, `XXXL` |

---

## 2. Server Actions (`src/lib/actions/employees.ts`)

Pattern: `"use server"`, auth check via `auth()`, tenant resolution via `getOwnerBusiness()`, FormData inputs for mutations, `revalidatePath` on writes.

| Function | Signature | Description |
|---|---|---|
| `generateEmployeeNumber` | `(tenantId: string): Promise<string>` (private) | Finds the highest existing `EMP-XXXX` number for the tenant and returns the next one. Format: `EMP-0001`. |
| `getEmployees` | `(tenantId: string, filters?: { status?: string; department?: string; employmentType?: string; search?: string })` | Returns all employees matching filters. Includes `id`, `employeeNumber`, `firstName`, `lastName`, `jobTitle`, `department`, `status`, `employmentType`, `photoUrl`, `startDate`. Ordered by `lastName, firstName`. |
| `getEmployee` | `(id: string)` | Returns full employee record with `manager` (name + title), `directReports` count, and `documents[]`. |
| `getEmployeesForSelect` | `(tenantId: string)` | Lightweight list for manager dropdown: `id`, `firstName`, `lastName`, `jobTitle`, `employeeNumber`. Excludes terminated employees. |
| `createEmployee` | `(formData: FormData): Promise<{ id: string }>` | Auth check → get owner business → auto-generate `employeeNumber` if blank → `prisma.employee.create` → `revalidatePath("/africs/hr/employees")` → return `{ id }`. |
| `updateEmployee` | `(id: string, formData: FormData): Promise<void>` | Auth check → `prisma.employee.update` → `revalidatePath`. |
| `deleteEmployee` | `(id: string): Promise<void>` | Auth check → `prisma.employee.delete` → `revalidatePath`. |
| `updateEmployeeStatus` | `(id: string, status: string): Promise<void>` | Quick status-only update. Used from list row action dropdown. |
| `addEmployeeDocument` | `(formData: FormData): Promise<void>` | Creates `EmployeeDocument` record. `fileUrl` is a base64 data URL from client-side `FileReader`. |
| `deleteEmployeeDocument` | `(id: string): Promise<void>` | Deletes `EmployeeDocument` record. |
| `getEmployeeStats` | `(tenantId: string)` | Returns: `{ total, active, onLeave, suspended, terminated, byDepartment: Record<string, number>, byType: Record<string, number>, recentHires: Employee[] }`. |

---

## 3. Component Breakdown

All components in `src/components/employees/`.

| File | Responsibility |
|---|---|
| `employee-status-badge.tsx` | Badge mapping status → colour. `active`=green, `on_leave`=amber, `suspended`=orange, `terminated`=red/zinc. Follows `invoice-status-badge.tsx` pattern exactly. |
| `employee-avatar.tsx` | Photo or initials fallback. Props: `photoUrl`, `firstName`, `lastName`, `size`. Uses tenant `primaryColor` as initials background. |
| `employee-list-table.tsx` | Client component. Table columns: avatar+name, employee number, job title, department, employment type, status badge, actions. Search input, filter dropdowns (status, department, type). Row is clickable — navigates to `[id]` page. |
| `employee-quick-actions.tsx` | Dropdown menu in list row: View, Edit, Change Status submenu, Delete. |
| `employee-form.tsx` | Full create/edit form. Sections rendered as a vertical step-through or tabbed layout: **Personal Info**, **Contact & Emergency**, **Employment**, **Reporting & Compensation**, **Benefits**, **Sizes**, **Notes**. React Hook Form + Zod. Accepts: `tenantId`, `managers[]`, optional `employee` (edit mode pre-fill). Has a photo upload area at the top using `FileReader` → base64. On submit calls `createEmployee` or `updateEmployee` server action. |
| `employee-profile-sections.tsx` | Read-only display of all sections in the detail page. Grouped cards with label-value pairs. |
| `employee-detail-tabs.tsx` | Client component. Tabs: **Profile**, **Business Card**, **Staff ID Card**, **Documents**. Wraps `EmployeeProfileSections`, `EmployeeBusinessCard`, `EmployeeStaffIdCard`, `EmployeeDocumentList`. |
| `employee-business-card.tsx` | Styled HTML business card preview (see design notes below). Has a "Download PDF" button linking to `/api/employees/[id]/business-card/pdf`. Has a "Print" button. |
| `employee-staff-id-card.tsx` | Styled HTML staff ID card preview (see design notes below). Has a "Download PDF" button linking to `/api/employees/[id]/staff-id/pdf`. |
| `employee-business-card-pdf.tsx` | `@react-pdf/renderer` version of the business card. Used by the PDF API route. |
| `employee-staff-id-pdf.tsx` | `@react-pdf/renderer` version of the staff ID card. Used by the PDF API route. |
| `employee-document-list.tsx` | Lists `EmployeeDocument` records. Each row: icon, name, upload date, download link, delete button. Upload button opens a file input, reads as base64, calls `addEmployeeDocument`. |

---

## 4. Page Breakdown

### App Pages

| Route | File | Description |
|---|---|---|
| `/africs/hr/employees` | `src/app/(platform)/africs/hr/employees/page.tsx` | Server component. Fetches `getOwnerBusiness()` + `getEmployees(owner.id)` + `getEmployeeStats(owner.id)`. Renders `TopBar` ("Employees", "Add Employee" button), a stats bar (total/active/on leave), then `<EmployeeListTable employees={employees} />`. |
| `/africs/hr/employees/new` | `src/app/(platform)/africs/hr/employees/new/page.tsx` | Server component. Fetches owner business + `getEmployeesForSelect(owner.id)`. Renders `TopBar` + `<EmployeeForm tenantId={...} managers={...} />`. |
| `/africs/hr/employees/[id]` | `src/app/(platform)/africs/hr/employees/[id]/page.tsx` | Server component. Fetches `getEmployee(id)` — 404 if not found. Renders `TopBar` with back button + Edit button + status change dropdown + delete. Then `<EmployeeDetailTabs employee={employee} tenant={owner} />`. |
| `/africs/hr/employees/[id]/edit` | `src/app/(platform)/africs/hr/employees/[id]/edit/page.tsx` | Server component. Fetches employee + managers list. Renders `TopBar` + `<EmployeeForm ... employee={employee} />` (edit mode). |

### API Routes

| Route | File | Description |
|---|---|---|
| `/api/employees/[id]/business-card/pdf` | `src/app/api/employees/[id]/business-card/pdf/route.ts` | GET. Fetches employee + tenant. `renderToBuffer(<EmployeeBusinessCardPdf ... />)`. Returns PDF with `Content-Disposition: attachment; filename="business-card-[number].pdf"`. |
| `/api/employees/[id]/staff-id/pdf` | `src/app/api/employees/[id]/staff-id/pdf/route.ts` | GET. Fetches employee + tenant. `renderToBuffer(<EmployeeStaffIdPdf ... />)`. Returns PDF. |

---

## 5. Step-by-Step Implementation Order

1. **Schema + migration**
   - Add `Employee` and `EmployeeDocument` models
   - Add relations to `User` and `Tenant`
   - Run `npx prisma migrate dev --name add-employee-module`
   - Run `npx prisma generate`

2. **Server actions** — create `src/lib/actions/employees.ts` with all functions

3. **Foundation components**
   - `employee-status-badge.tsx`
   - `employee-avatar.tsx`
   - `employee-quick-actions.tsx`

4. **Employee list page**
   - `employee-list-table.tsx`
   - Replace `src/app/(platform)/africs/hr/employees/page.tsx` with full server component

5. **Employee form (create + edit)**
   - `employee-form.tsx` — all 7 sections, photo upload, full Zod schema
   - `src/app/(platform)/africs/hr/employees/new/page.tsx`
   - `src/app/(platform)/africs/hr/employees/[id]/edit/page.tsx`

6. **Employee detail page**
   - `employee-profile-sections.tsx`
   - `employee-document-list.tsx`
   - `employee-detail-tabs.tsx`
   - `src/app/(platform)/africs/hr/employees/[id]/page.tsx`

7. **Business card + staff ID card (HTML previews)**
   - `employee-business-card.tsx`
   - `employee-staff-id-card.tsx`

8. **PDF generation**
   - `employee-business-card-pdf.tsx`
   - `employee-staff-id-pdf.tsx`
   - `src/app/api/employees/[id]/business-card/pdf/route.ts`
   - `src/app/api/employees/[id]/staff-id/pdf/route.ts`

9. **Polish + TODO update**
   - Update `docs/TODO.md` with HR Employee module status
   - Verify all flows: create → list → detail → edit → PDF download

---

## 6. Design Notes

### Business Card

**Proportions**: Landscape — 3.5" × 2" (standard business card). In HTML preview: `w-[3.5in] h-[2in]` or equivalent fixed pixel size for screen (`w-[420px] h-[240px]`).

**Layout**:
```
┌─────────────────────────────────────────────┐  ← 3px primaryColor top bar
│  ┌──────┐  Full Name                        │
│  │ PHOTO│  Job Title                        │
│  │      │  Department          Company Name │
│  └──────┘  ─────────────────────────────── │  ← divider in primaryColor
│             ✉ email@company.com             │
│             📞 +1 234 567 8900              │
└─────────────────────────────────────────────┘
```

- **Left (30%)**: Photo in rounded rectangle (or initials avatar with `primaryColor` background)
- **Right (70%)**: Name in `font-display` (Fraunces) 18px bold; title in DM Sans 11px muted; department in DM Sans 10px muted; thin `primaryColor` divider; email + phone with icons 9px
- **Bottom-right**: Company name in small caps 8px muted
- **Background**: Always `#FFFFFF` for print fidelity regardless of theme
- **Text**: `#111827` (near-black) for name; `#6B7280` for supporting text
- **Print CSS**: `@media print` removes shadows, ensures white background

### Staff ID Card

**Proportions**: Portrait — CR-80 card (2.125" × 3.375"). In HTML preview: `w-[255px] h-[405px]`.

**Layout**:
```
┌─────────────────────────┐
│   [COMPANY LOGO/NAME]   │  ← primaryColor band, white text, ~20% height
│   ┌────────────────┐    │
│   │                │    │  ← large photo, circular clip, white border
│   │     PHOTO      │    │  overlapping the color band and white body
│   │                │    │
│   └────────────────┘    │
│                         │
│    EMPLOYEE FULL NAME   │  ← font-display, bold, centered
│    Job Title            │  ← muted, centered
│    Department           │  ← muted small, centered
│                         │
│  EMP-0 0 0 1            │  ← font-mono, wide letter-spacing (barcode feel)
│                         │
├─────────────────────────┤
│ Valid: Jan 2024 – Dec 2026│  ← primaryColor tint footer, white text, small
└─────────────────────────┘
```

- **Top band**: Solid `primaryColor`. Company logo (`tenant.logoUrl`) at 36px height, or company name in white `font-display` if no logo. Padding 12px.
- **Photo**: 90px × 90px circular clip, 3px white border, centered, positioned so it overlaps the color band (negative margin or absolute positioning)
- **Employee number**: `font-mono` (JetBrains Mono), 13px, `letter-spacing: 0.25em`, `primaryColor` text, centered — the wide monospace spacing evokes a barcode reader without needing a barcode library
- **Footer**: `primaryColor` at 15% opacity as background, white text 8px, validity date range
- **Background**: White card body
- **Print considerations**: No box-shadow on the PDF version. Crisp rectangle, no border-radius in PDF (card printers need square edges). HTML preview can have `rounded-2xl`.

---

## File Summary

| File | Status |
|---|---|
| `prisma/schema.prisma` | Modify — add Employee, EmployeeDocument models |
| `src/lib/actions/employees.ts` | New |
| `src/components/employees/employee-status-badge.tsx` | New |
| `src/components/employees/employee-avatar.tsx` | New |
| `src/components/employees/employee-quick-actions.tsx` | New |
| `src/components/employees/employee-list-table.tsx` | New |
| `src/components/employees/employee-form.tsx` | New |
| `src/components/employees/employee-profile-sections.tsx` | New |
| `src/components/employees/employee-document-list.tsx` | New |
| `src/components/employees/employee-detail-tabs.tsx` | New |
| `src/components/employees/employee-business-card.tsx` | New |
| `src/components/employees/employee-staff-id-card.tsx` | New |
| `src/components/employees/employee-business-card-pdf.tsx` | New |
| `src/components/employees/employee-staff-id-pdf.tsx` | New |
| `src/app/(platform)/africs/hr/employees/page.tsx` | Replace |
| `src/app/(platform)/africs/hr/employees/new/page.tsx` | New |
| `src/app/(platform)/africs/hr/employees/[id]/page.tsx` | New |
| `src/app/(platform)/africs/hr/employees/[id]/edit/page.tsx` | New |
| `src/app/api/employees/[id]/business-card/pdf/route.ts` | New |
| `src/app/api/employees/[id]/staff-id/pdf/route.ts` | New |
| `docs/TODO.md` | Update |
