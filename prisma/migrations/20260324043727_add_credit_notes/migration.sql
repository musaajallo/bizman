-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "creditNoteForId" TEXT;

-- AlterTable
ALTER TABLE "InvoicePayment" ADD COLUMN     "creditNoteId" TEXT;

-- AlterTable
ALTER TABLE "InvoiceSettings" ADD COLUMN     "creditNoteNextNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "creditNotePrefix" TEXT NOT NULL DEFAULT 'CN';

-- CreateIndex
CREATE INDEX "Invoice_creditNoteForId_idx" ON "Invoice"("creditNoteForId");

-- CreateIndex
CREATE INDEX "InvoicePayment_creditNoteId_idx" ON "InvoicePayment"("creditNoteId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_creditNoteForId_fkey" FOREIGN KEY ("creditNoteForId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
