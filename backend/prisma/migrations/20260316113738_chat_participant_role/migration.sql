/*
  Warnings:

  - Changed the type of `role` on the `ConversationParticipant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ConversationParticipantRole" AS ENUM ('CUSTOMER', 'ADMIN', 'STAFF', 'AI');

-- AlterTable
ALTER TABLE "ConversationParticipant" ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "ConversationParticipantRole" NOT NULL;
