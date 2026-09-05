-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'PROCESSED', 'REJECTED');

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "amount" INTEGER NOT NULL,
    "programId" TEXT,
    "message" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donation_reference_key" ON "Donation"("reference");

-- CreateIndex
CREATE INDEX "Donation_status_createdAt_idx" ON "Donation"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContactMessage_isRead_createdAt_idx" ON "ContactMessage"("isRead", "createdAt" DESC);
