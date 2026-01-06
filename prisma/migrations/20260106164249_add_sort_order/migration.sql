-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Category_userId_sortOrder_idx" ON "Category"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "Todo_userId_categoryId_sortOrder_idx" ON "Todo"("userId", "categoryId", "sortOrder");
