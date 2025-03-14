-- CreateEnum
CREATE TYPE "ExpenseSplitType" AS ENUM ('EQUAL', 'CUSTOM', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "splitType" "ExpenseSplitType" NOT NULL DEFAULT 'EQUAL';

-- CreateTable
CREATE TABLE "ExpenseParticipant" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSettlement" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT,
    "colocationId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseParticipant_expenseId_idx" ON "ExpenseParticipant"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseParticipant_userId_idx" ON "ExpenseParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseParticipant_expenseId_userId_key" ON "ExpenseParticipant"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "ExpenseSettlement_expenseId_idx" ON "ExpenseSettlement"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseSettlement_colocationId_idx" ON "ExpenseSettlement"("colocationId");

-- CreateIndex
CREATE INDEX "ExpenseSettlement_fromUserId_idx" ON "ExpenseSettlement"("fromUserId");

-- CreateIndex
CREATE INDEX "ExpenseSettlement_toUserId_idx" ON "ExpenseSettlement"("toUserId");

-- AddForeignKey
ALTER TABLE "ExpenseParticipant" ADD CONSTRAINT "ExpenseParticipant_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseParticipant" ADD CONSTRAINT "ExpenseParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_colocationId_fkey" FOREIGN KEY ("colocationId") REFERENCES "Colocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSettlement" ADD CONSTRAINT "ExpenseSettlement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
