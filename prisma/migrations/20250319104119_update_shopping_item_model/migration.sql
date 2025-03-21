/*
  Warnings:

  - You are about to drop the column `purchasedBy` on the `ShoppingItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShoppingItem" DROP COLUMN "purchasedBy",
ADD COLUMN     "purchasedById" TEXT;

-- CreateIndex
CREATE INDEX "ShoppingItem_purchasedById_idx" ON "ShoppingItem"("purchasedById");

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
