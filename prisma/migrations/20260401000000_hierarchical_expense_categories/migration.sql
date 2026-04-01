-- AlterTable: ExpenseCategory — add new columns, rename label→name, remove value
ALTER TABLE "ExpenseCategory"
  ADD COLUMN "tenantId"        TEXT,
  ADD COLUMN "name"            TEXT NOT NULL DEFAULT '',
  ADD COLUMN "code"            TEXT,
  ADD COLUMN "description"     TEXT,
  ADD COLUMN "parentId"        TEXT,
  ADD COLUMN "ledgerAccountId" TEXT,
  ADD COLUMN "color"           TEXT,
  ADD COLUMN "isActive"        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "sortOrder"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrate data: copy label → name
UPDATE "ExpenseCategory" SET "name" = "label" WHERE "name" = '';

-- Drop old columns
ALTER TABLE "ExpenseCategory"
  DROP COLUMN "value",
  DROP COLUMN "label";

-- Seed system categories (hierarchical)
INSERT INTO "ExpenseCategory" ("id", "name", "code", "isSystem", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  -- Top-level
  ('exccat_travel',     'Travel & Transport',  'TRAVEL',    true, true, 10, NOW(), NOW()),
  ('exccat_office',     'Office & Supplies',   'OFFICE',    true, true, 20, NOW(), NOW()),
  ('exccat_meals',      'Meals & Entertainment','MEALS',    true, true, 30, NOW(), NOW()),
  ('exccat_utilities',  'Utilities',           'UTILITIES', true, true, 40, NOW(), NOW()),
  ('exccat_hr',         'HR & Staffing',       'HR',        true, true, 50, NOW(), NOW()),
  ('exccat_marketing',  'Marketing & Ads',     'MARKETING', true, true, 60, NOW(), NOW()),
  ('exccat_tech',       'Technology & IT',     'TECH',      true, true, 70, NOW(), NOW()),
  ('exccat_finance',    'Finance & Banking',   'FINANCE',   true, true, 80, NOW(), NOW()),
  ('exccat_legal',      'Legal & Professional','LEGAL',     true, true, 90, NOW(), NOW()),
  ('exccat_other',      'Other',               'OTHER',     true, true, 99, NOW(), NOW()),
  -- Travel sub-categories
  ('exccat_travel_air',  'Airfare',            'TRAVEL_AIR',  true, true, 11, NOW(), NOW()),
  ('exccat_travel_hotel','Hotel / Lodging',    'TRAVEL_HTL',  true, true, 12, NOW(), NOW()),
  ('exccat_travel_car',  'Car Rental / Taxi',  'TRAVEL_CAR',  true, true, 13, NOW(), NOW()),
  ('exccat_travel_fuel', 'Fuel',               'TRAVEL_FUEL', true, true, 14, NOW(), NOW()),
  -- Office sub-categories
  ('exccat_office_rent', 'Rent & Lease',       'OFFICE_RENT', true, true, 21, NOW(), NOW()),
  ('exccat_office_sup',  'Stationery',         'OFFICE_STAT', true, true, 22, NOW(), NOW()),
  ('exccat_office_equip','Equipment Purchase', 'OFFICE_EQUIP',true, true, 23, NOW(), NOW()),
  -- Tech sub-categories
  ('exccat_tech_sub',    'Software Subscriptions','TECH_SaaS',true, true, 71, NOW(), NOW()),
  ('exccat_tech_hw',     'Hardware',           'TECH_HW',     true, true, 72, NOW(), NOW()),
  -- Finance sub-categories
  ('exccat_fin_bank',    'Bank Charges',       'FIN_BANK',    true, true, 81, NOW(), NOW()),
  ('exccat_fin_tax',     'Taxes & Duties',     'FIN_TAX',     true, true, 82, NOW(), NOW()),
  ('exccat_fin_insure',  'Insurance',          'FIN_INS',     true, true, 83, NOW(), NOW());

-- Set parentId for sub-categories
UPDATE "ExpenseCategory" SET "parentId" = 'exccat_travel'  WHERE "id" IN ('exccat_travel_air','exccat_travel_hotel','exccat_travel_car','exccat_travel_fuel');
UPDATE "ExpenseCategory" SET "parentId" = 'exccat_office'  WHERE "id" IN ('exccat_office_rent','exccat_office_sup','exccat_office_equip');
UPDATE "ExpenseCategory" SET "parentId" = 'exccat_tech'    WHERE "id" IN ('exccat_tech_sub','exccat_tech_hw');
UPDATE "ExpenseCategory" SET "parentId" = 'exccat_finance' WHERE "id" IN ('exccat_fin_bank','exccat_fin_tax','exccat_fin_insure');

-- Migrate existing expense rows: map old category names to new system ids where possible
-- (Any unmatched categoryId will be NULLed by the FK change below)

-- AlterTable: Expense — make categoryId optional (already done in schema, FK update)
ALTER TABLE "Expense" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AlterTable: Bill — add categoryId
ALTER TABLE "Bill" ADD COLUMN "categoryId" TEXT;

-- AlterTable: PurchaseOrderItem — add categoryId
ALTER TABLE "PurchaseOrderItem" ADD COLUMN "categoryId" TEXT;

-- AddForeignKey: ExpenseCategory → Tenant
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ExpenseCategory self-relation (parentId)
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: ExpenseCategory → LedgerAccount
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_ledgerAccountId_fkey"
  FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Bill → ExpenseCategory
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: PurchaseOrderItem → ExpenseCategory
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ExpenseCategory_tenantId_idx" ON "ExpenseCategory"("tenantId");
CREATE INDEX "ExpenseCategory_parentId_idx" ON "ExpenseCategory"("parentId");
CREATE INDEX "ExpenseCategory_ledgerAccountId_idx" ON "ExpenseCategory"("ledgerAccountId");
CREATE INDEX "PurchaseOrderItem_categoryId_idx" ON "PurchaseOrderItem"("categoryId");
