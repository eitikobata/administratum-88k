-- DropForeignKey
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_petitionId_fkey";

-- DropForeignKey
ALTER TABLE "state_history" DROP CONSTRAINT "state_history_petitionId_fkey";

-- AlterTable
ALTER TABLE "petitions" ADD COLUMN     "simulated" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "petitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "state_history" ADD CONSTRAINT "state_history_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "petitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
