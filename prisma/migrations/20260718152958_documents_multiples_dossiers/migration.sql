/*
  Warnings:

  - You are about to drop the column `diplomeData` on the `DossierProfesseur` table. All the data in the column will be lost.
  - You are about to drop the column `diplomeNom` on the `DossierProfesseur` table. All the data in the column will be lost.
  - You are about to drop the column `diplomeType` on the `DossierProfesseur` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CategorieDocumentProf" AS ENUM ('DIPLOME', 'ATTESTATION', 'AUTRE');

-- AlterTable
ALTER TABLE "DossierProfesseur" DROP COLUMN "diplomeData",
DROP COLUMN "diplomeNom",
DROP COLUMN "diplomeType";

-- CreateTable
CREATE TABLE "DocumentProfesseur" (
    "id" SERIAL NOT NULL,
    "categorie" "CategorieDocumentProf" NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dossierId" INTEGER NOT NULL,

    CONSTRAINT "DocumentProfesseur_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocumentProfesseur" ADD CONSTRAINT "DocumentProfesseur_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierProfesseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
