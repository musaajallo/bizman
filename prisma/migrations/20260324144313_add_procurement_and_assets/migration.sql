-- CreateTable
CREATE TABLE "ProcurementSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requisitionPrefix" TEXT NOT NULL DEFAULT 'REQ',
    "nextRequisitionNumber" INTEGER NOT NULL DEFAULT 1,
    "poPrefix" TEXT NOT NULL DEFAULT 'PO',
    "nextPoNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProcurementSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requisitionNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requestedById" TEXT NOT NULL,
    "department" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "requiredByDate" TIMESTAMP(3),
    "notes" TEXT,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisitionItem" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" TEXT,
    "estimatedUnitPrice" DECIMAL(12,2),
    "estimatedTotal" DECIMAL(12,2),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseRequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "requisitionId" TEXT,
    "poNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GMD',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2),
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "billId" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "quantityReceived" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "poItemId" TEXT NOT NULL,
    "quantityReceived" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetPrefix" TEXT NOT NULL DEFAULT 'AST',
    "nextAssetNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AssetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'equipment',
    "status" TEXT NOT NULL DEFAULT 'active',
    "serialNumber" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "location" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'GMD',
    "warrantyExpiry" TIMESTAMP(3),
    "condition" TEXT NOT NULL DEFAULT 'good',
    "currentValue" DECIMAL(12,2),
    "depreciationMethod" TEXT,
    "usefulLifeMonths" INTEGER,
    "salvageValue" DECIMAL(12,2),
    "notes" TEXT,
    "purchaseOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAssignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "employeeId" TEXT,
    "location" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedDate" TIMESTAMP(3),
    "notes" TEXT,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMaintenance" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maintenanceDate" TIMESTAMP(3) NOT NULL,
    "nextMaintenanceDate" TIMESTAMP(3),
    "cost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'GMD',
    "performedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementSettings_tenantId_key" ON "ProcurementSettings"("tenantId");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_tenantId_status_idx" ON "PurchaseRequisition"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_tenantId_requestedById_idx" ON "PurchaseRequisition"("tenantId", "requestedById");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_tenantId_requisitionNumber_key" ON "PurchaseRequisition"("tenantId", "requisitionNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_requisitionId_idx" ON "PurchaseRequisitionItem"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_billId_key" ON "PurchaseOrder"("billId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_tenantId_status_idx" ON "PurchaseOrder"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_tenantId_vendorId_idx" ON "PurchaseOrder"("tenantId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_tenantId_poNumber_key" ON "PurchaseOrder"("tenantId", "poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_tenantId_idx" ON "GoodsReceipt"("tenantId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchaseOrderId_idx" ON "GoodsReceipt"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_goodsReceiptId_idx" ON "GoodsReceiptItem"("goodsReceiptId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetSettings_tenantId_key" ON "AssetSettings"("tenantId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_status_idx" ON "Asset"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Asset_tenantId_category_idx" ON "Asset"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_tenantId_assetNumber_key" ON "Asset"("tenantId", "assetNumber");

-- CreateIndex
CREATE INDEX "AssetAssignment_assetId_idx" ON "AssetAssignment"("assetId");

-- CreateIndex
CREATE INDEX "AssetAssignment_employeeId_idx" ON "AssetAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "AssetMaintenance_assetId_idx" ON "AssetMaintenance"("assetId");

-- AddForeignKey
ALTER TABLE "ProcurementSettings" ADD CONSTRAINT "ProcurementSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetSettings" ADD CONSTRAINT "AssetSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
