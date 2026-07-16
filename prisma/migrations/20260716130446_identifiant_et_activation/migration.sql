/*
  Warnings:

  - A unique constraint covering the columns `[identifiant]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "codeActivation" TEXT,
ADD COLUMN     "identifiant" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_identifiant_key" ON "User"("identifiant");
