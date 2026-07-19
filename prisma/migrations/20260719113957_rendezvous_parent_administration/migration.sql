/*
  Warnings:

  - You are about to drop the column `professeurId` on the `CreneauRendezVous` table. All the data in the column will be lost.
  - Added the required column `organisateurId` to the `CreneauRendezVous` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CreneauRendezVous" DROP CONSTRAINT "CreneauRendezVous_professeurId_fkey";

-- AlterTable
ALTER TABLE "CreneauRendezVous" DROP COLUMN "professeurId",
ADD COLUMN     "organisateurId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "CreneauRendezVous" ADD CONSTRAINT "CreneauRendezVous_organisateurId_fkey" FOREIGN KEY ("organisateurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
