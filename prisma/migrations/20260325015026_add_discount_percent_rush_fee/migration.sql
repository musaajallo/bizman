-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "discountPercent" DECIMAL(5,2),
ADD COLUMN     "rushFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rushFeePercent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "InvoiceSettings" ADD COLUMN     "defaultDiscountPercent" DECIMAL(5,2),
ADD COLUMN     "defaultRushFeePercent" DECIMAL(5,2);
