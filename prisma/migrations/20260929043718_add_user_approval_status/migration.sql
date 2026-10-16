-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "statue" "UserStatus" NOT NULL DEFAULT 'PENDING';
