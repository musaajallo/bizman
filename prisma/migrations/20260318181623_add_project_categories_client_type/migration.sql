/*
  Warnings:

  - You are about to drop the column `category` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "clientType" TEXT NOT NULL DEFAULT 'organization',
ADD COLUMN     "orgAddress" TEXT,
ADD COLUMN     "orgContactEmail" TEXT,
ADD COLUMN     "orgContactName" TEXT,
ADD COLUMN     "orgContactPhone" TEXT,
ADD COLUMN     "orgName" TEXT;

-- CreateTable
CREATE TABLE "ProjectCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectCategory_tenantId_order_idx" ON "ProjectCategory"("tenantId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCategory_tenantId_name_key" ON "ProjectCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Project_categoryId_idx" ON "Project"("categoryId");

-- AddForeignKey
ALTER TABLE "ProjectCategory" ADD CONSTRAINT "ProjectCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProjectCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
