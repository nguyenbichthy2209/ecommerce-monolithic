/*
  Warnings:

  - You are about to drop the column `score` on the `MemberShip` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MemberShip" DROP COLUMN "score";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;
