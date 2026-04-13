-- CreateTable
CREATE TABLE "UserAiPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "riskLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "preferredNotes" TEXT[],
    "avoidedNotes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAiPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAiPreference_userId_key" ON "UserAiPreference"("userId");

-- AddForeignKey
ALTER TABLE "UserAiPreference" ADD CONSTRAINT "UserAiPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
