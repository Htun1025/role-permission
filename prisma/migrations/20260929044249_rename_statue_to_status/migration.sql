/*
  Warnings:

  - You are about to drop the column `statue` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "statue",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDING';
