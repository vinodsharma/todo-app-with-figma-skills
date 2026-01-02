-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "recurrenceEnd" TIMESTAMP(3),
ADD COLUMN     "recurrenceRule" TEXT;
