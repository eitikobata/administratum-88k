-- CreateEnum
CREATE TYPE "PetitionState" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PetitionImpact" AS ENUM ('LOW', 'HIGH');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "petitioners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "petitioners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approvers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petitions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "impact" "PetitionImpact" NOT NULL,
    "state" "PetitionState" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 1,
    "deadlineAt" TIMESTAMP(3),
    "petitionerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "comment" TEXT,
    "petitionId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state_history" (
    "id" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "fromState" "PetitionState",
    "toState" "PetitionState" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "state_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "petitioners_email_key" ON "petitioners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "approvers_email_key" ON "approvers"("email");

-- CreateIndex
CREATE INDEX "petitions_state_idx" ON "petitions"("state");

-- CreateIndex
CREATE INDEX "petitions_deadlineAt_idx" ON "petitions"("deadlineAt");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_petitionId_approverId_key" ON "approvals"("petitionId", "approverId");

-- CreateIndex
CREATE INDEX "state_history_petitionId_idx" ON "state_history"("petitionId");

-- AddForeignKey
ALTER TABLE "petitions" ADD CONSTRAINT "petitions_petitionerId_fkey" FOREIGN KEY ("petitionerId") REFERENCES "petitioners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "petitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "approvers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "state_history" ADD CONSTRAINT "state_history_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "petitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
