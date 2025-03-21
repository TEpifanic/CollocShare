/*
  Warnings:

  - Added the required column `userId` to the `ShoppingItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ShoppingItem" ADD COLUMN     "category" TEXT,
ADD COLUMN     "needVerification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "purchasedAt" TIMESTAMP(3),
ADD COLUMN     "purchasedBy" TEXT,
ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 1;

-- CreateIndex
CREATE INDEX "ShoppingItem_userId_idx" ON "ShoppingItem"("userId");

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
