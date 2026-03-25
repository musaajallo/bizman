# Procurement & Tenders — Implementation Plan

> **Module:** Accounting (sub-section)
> **Status:** Not Started
> **Scope:** Three distinct but related modules covering all sides of formal purchasing and bidding.

---

## Overview

There are three separate processes that all fall loosely under "procurement". They are different in direction, data model, and workflow:

| Module | Who does it | Direction | Outcome |
|---|---|---|---|
| **Internal Procurement** | Staff / managers | Buy from suppliers | Bill recorded, goods received |
| **Tender Management** | Company (as buyer) | Invite suppliers to compete | PO or Project created |
| **Bid Management** | Company (as seller/applicant) | Respond to external tenders | Project created if won |

They share some concepts (vendors, documents, approvals) but must be modelled separately.

---

## Module 1 — Internal Procurement

### Purpose
Handle the internal approval chain for purchasing goods or services from a vendor, from initial staff request through to payment.

### Flow
```
Staff raises Requisition
  → Manager approves (or rejects)
  → PO issued to Vendor
  → Goods/services received (partial or full)
  → Bill created in Accounting
  → Bill paid
```

### Prisma Models

```prisma
model Vendor {
  id              String   @id @default(cuid())
  tenantId        String
  name            String
  contactName     String?
  contactEmail    String?
  contactPhone    String?
  address         String?
  category        String?          // "IT", "Office Supplies", "Services", etc.
  paymentTerms    String?          // "Net 30", "COD", etc.
  taxId           String?
  bankDetails     String?  @db.Text
  notes           String?  @db.Text
  isActive        Boolean  @default(true)
  rating          Int?             // 1–5 star rating after transactions
  createdAt       DateTime @default(now())

  requisitions    PurchaseRequisition[]
  purchaseOrders  PurchaseOrder[]

  @@index([tenantId])
}

model PurchaseRequisition {
  id              String   @id @default(cuid())
  tenantId        String
  requisitionNumber String  @unique
  title           String
  description     String?  @db.Text
  status          String   @default("draft")
  // draft → submitted → approved → rejected → po_raised → cancelled
  priority        String   @default("normal")  // low / normal / high / urgent
  requestedById   String
  requestedBy     User     @relation(...)
  approvedById    String?
  approvedBy      User?    @relation(...)
  vendorId        String?
  vendor          Vendor?  @relation(...)
  estimatedTotal  Decimal? @db.Decimal(12, 2)
  currency        String   @default("USD")
  neededBy        DateTime?
  notes           String?  @db.Text
  rejectionReason String?
  submittedAt     DateTime?
  approvedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  items           PurchaseRequisitionItem[]
  purchaseOrder   PurchaseOrder?
}

model PurchaseRequisitionItem {
  id              String   @id @default(cuid())
  requisitionId   String
  description     String
  quantity        Decimal  @db.Decimal(10, 2)
  unit            String?
  estimatedPrice  Decimal? @db.Decimal(12, 2)
  amount          Decimal? @db.Decimal(12, 2)
  order           Int      @default(0)

  requisition     PurchaseRequisition @relation(...)
}

model PurchaseOrder {
  id              String   @id @default(cuid())
  tenantId        String
  poNumber        String   @unique
  requisitionId   String?  @unique
  requisition     PurchaseRequisition? @relation(...)
  vendorId        String
  vendor          Vendor   @relation(...)
  status          String   @default("draft")
  // draft → issued → partially_received → received → billed → cancelled
  title           String
  currency        String   @default("USD")
  subtotal        Decimal  @db.Decimal(12, 2) @default(0)
  taxAmount       Decimal  @db.Decimal(12, 2) @default(0)
  total           Decimal  @db.Decimal(12, 2) @default(0)
  expectedDelivery DateTime?
  deliveryAddress String?
  notes           String?  @db.Text
  terms           String?  @db.Text
  issuedAt        DateTime?
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  items           PurchaseOrderItem[]
  receipts        PurchaseReceipt[]
}

model PurchaseOrderItem {
  id              String   @id @default(cuid())
  orderId         String
  description     String
  quantity        Decimal  @db.Decimal(10, 2)
  unitPrice       Decimal  @db.Decimal(12, 2)
  amount          Decimal  @db.Decimal(12, 2)
  unit            String?
  quantityReceived Decimal @db.Decimal(10, 2) @default(0)
  order           Int      @default(0)

  purchaseOrder   PurchaseOrder @relation(...)
}

model PurchaseReceipt {
  id              String   @id @default(cuid())
  orderId         String
  receivedById    String
  receivedAt      DateTime @default(now())
  notes           String?

  purchaseOrder   PurchaseOrder @relation(...)
  // Items received per line (partial receipts supported)
}
```

### Pages
- `/africs/accounting/procurement` — list of requisitions and POs (tabbed)
- `/africs/accounting/procurement/requisitions/new` — new requisition form
- `/africs/accounting/procurement/requisitions/[id]` — detail + approval action
- `/africs/accounting/procurement/orders` — PO list
- `/africs/accounting/procurement/orders/[id]` — PO detail + receive goods
- `/africs/accounting/procurement/vendors` — vendor list
- `/africs/accounting/procurement/vendors/[id]` — vendor detail + history

### UI Decisions
- Requisition form: line items with description, qty, estimated price
- Approval UI: inline approve/reject with optional comment
- PO detail: shows line items, received quantities as a progress indicator
- Vendor page: tabs for details, orders history, performance rating

---

## Module 2 — Tender Management (Issuing Tenders)

### Purpose
When the company needs to make a large or complex purchase, it issues a formal tender (RFP) to invite multiple suppliers to bid competitively, then evaluates and awards.

### Flow
```
Company creates Tender (scope, requirements, deadline)
  → Published (visible to invited/public suppliers)
  → Supplier bids recorded
  → Evaluation (scoring matrix per bid)
  → Winner selected → Tender awarded
  → PO created OR Project created
  → Tender closed
```

### Prisma Models

```prisma
model Tender {
  id              String   @id @default(cuid())
  tenantId        String
  tenderNumber    String   @unique
  title           String
  description     String?  @db.Text
  category        String?           // "IT", "Construction", "Consulting", etc.
  status          String   @default("draft")
  // draft → published → evaluation → awarded → closed / cancelled
  budgetEstimate  Decimal? @db.Decimal(14, 2)
  currency        String   @default("USD")
  submissionDeadline DateTime
  openingDate     DateTime?
  awardedToId     String?          // Vendor who won
  awardedTo       Vendor?  @relation(...)
  notes           String?  @db.Text
  publishedAt     DateTime?
  awardedAt       DateTime?
  closedAt        DateTime?
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  documents       TenderDocument[]
  bids            TenderBid[]
  evaluations     TenderEvaluation[]
  // Resulting PO or Project linked by reference
}

model TenderDocument {
  id          String   @id @default(cuid())
  tenderId    String
  name        String
  fileUrl     String
  fileSize    Int?
  uploadedAt  DateTime @default(now())

  tender      Tender   @relation(...)
}

model TenderBid {
  id              String   @id @default(cuid())
  tenderId        String
  vendorId        String?
  vendor          Vendor?  @relation(...)
  vendorName      String           // Snapshot (vendor may not be in system)
  vendorEmail     String?
  totalAmount     Decimal  @db.Decimal(14, 2)
  currency        String
  deliveryDays    Int?
  validUntil      DateTime?
  notes           String?  @db.Text
  status          String   @default("received")  // received → shortlisted → awarded / rejected
  receivedAt      DateTime @default(now())

  documents       TenderBidDocument[]
  evaluations     TenderEvaluation[]
  tender          Tender   @relation(...)
}

model TenderBidDocument {
  id        String   @id @default(cuid())
  bidId     String
  name      String
  fileUrl   String

  bid       TenderBid @relation(...)
}

model TenderEvaluation {
  id          String   @id @default(cuid())
  tenderId    String
  bidId       String
  evaluatorId String
  criterion   String           // "Price", "Quality", "Delivery", "Compliance", etc.
  weight      Decimal  @db.Decimal(5, 2)   // % weighting
  score       Decimal  @db.Decimal(5, 2)   // 0–100
  notes       String?

  tender      Tender    @relation(...)
  bid         TenderBid @relation(...)
}
```

### Pages
- `/africs/accounting/tenders` — active and historical tenders list
- `/africs/accounting/tenders/new` — create tender form
- `/africs/accounting/tenders/[id]` — tender detail (bids, evaluation, award)
- `/africs/accounting/tenders/[id]/bids/new` — record a supplier bid
- `/africs/accounting/tenders/[id]/evaluate` — scoring matrix view

### UI Decisions
- Tender detail: tabs for Overview, Bids, Evaluation, Documents
- Evaluation tab: table of bids × criteria with weighted scores auto-calculated
- Award action: prompts to create PO or Project from awarded bid

---

## Module 3 — Bid Management (Applying to Tenders)

### Purpose
The company identifies opportunities where it can bid for work — government contracts, client RFPs, etc. — and tracks the full pipeline from opportunity through to win/loss. A won bid automatically creates a Project.

### Flow
```
Opportunity identified (external tender spotted)
  → Qualifying (is it worth pursuing?)
  → Preparing (writing proposal, gathering docs)
  → Submitted
  → Shortlisted (invited to present/negotiate)
  → Won → Project created
  → Lost / Withdrawn → post-mortem notes
```

### Prisma Models

```prisma
model BidOpportunity {
  id              String   @id @default(cuid())
  tenantId        String
  reference       String?          // External tender reference number
  title           String
  issuingOrg      String           // Who issued the tender
  sector          String?          // "Government", "NGO", "Private", etc.
  description     String?  @db.Text
  estimatedValue  Decimal? @db.Decimal(14, 2)
  currency        String   @default("USD")
  status          String   @default("identified")
  // identified → qualifying → preparing → submitted → shortlisted → won → lost → withdrawn
  source          String?          // "Website", "Direct invitation", "Agent", etc.
  submissionDeadline DateTime?
  presentationDate   DateTime?
  resultDate         DateTime?
  assignedToId    String?
  assignedTo      User?    @relation(...)
  winLossReason   String?  @db.Text
  reviewNotes     String?  @db.Text
  projectId       String?  @unique  // Set when won → Project created
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  documents       BidDocument[]
  activities      BidActivity[]
}

model BidDocument {
  id              String   @id @default(cuid())
  opportunityId   String
  name            String
  type            String?          // "Proposal", "Financial", "Certificate", "Letter", etc.
  fileUrl         String
  fileSize        Int?
  uploadedAt      DateTime @default(now())

  opportunity     BidOpportunity @relation(...)
}

model BidActivity {
  id              String   @id @default(cuid())
  opportunityId   String
  actorId         String
  action          String           // "status_changed", "document_added", "note_added"
  detail          String?
  createdAt       DateTime @default(now())

  opportunity     BidOpportunity @relation(...)
}
```

### Pages
- `/africs/accounting/bids` — bid pipeline (kanban by stage + list view)
- `/africs/accounting/bids/new` — log new opportunity
- `/africs/accounting/bids/[id]` — opportunity detail (documents, activity, status actions)

### UI Decisions
- Pipeline view: Kanban columns by status (like the recruitment board)
- List view: sortable by deadline, value, status
- Detail page: sidebar with key details; main area has documents tab + activity feed
- "Mark as Won" action: modal to confirm then creates a Project (pre-filled with issuing org as client, bid value as budget)
- Dashboard card on Accounting dashboard: bids in progress, win rate, total pipeline value

---

## Implementation Order

1. **Internal Procurement** first — most commonly needed, directly extends what's already stubbed
2. **Tender Management** second — needed when procurement involves competitive bidding; outputs a PO
3. **Bid Management** third — closest to sales/CRM; links to Projects on win

## Shared Infrastructure

- **Vendor register** is shared between Procurement and Tender Management (bids from known vendors link to vendor records)
- **Documents**: use the existing `Document` model pattern (file URL, name, type) rather than a separate storage system
- **Activity logs**: follow the same pattern as `InvoiceActivity` — action + actor + detail string
- **Approval rules**: start simple (single approver), design to support multi-tier thresholds later
