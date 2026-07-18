/*
  Warnings:

  - Added the required column `dateNaissance` to the `InscriptionAdministrative` table without a default value. This is not possible if the table is not empty.
  - Added the required column `justificatifData` to the `InscriptionAdministrative` table without a default value. This is not possible if the table is not empty.
  - Added the required column `justificatifNom` to the `InscriptionAdministrative` table without a default value. This is not possible if the table is not empty.
  - Added the required column `justificatifType` to the `InscriptionAdministrative` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeJustificatif` to the `InscriptionAdministrative` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vientDAutreEtablissement` to the `InscriptionAdministrative` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypeJustificatifIdentite" AS ENUM ('ACTE_NAISSANCE', 'PIECE_IDENTITE', 'PASSEPORT');

-- AlterTable
ALTER TABLE "InscriptionAdministrative" ADD COLUMN     "dateNaissance" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "justificatifData" TEXT NOT NULL,
ADD COLUMN     "justificatifNom" TEXT NOT NULL,
ADD COLUMN     "justificatifTransfertData" TEXT,
ADD COLUMN     "justificatifTransfertNom" TEXT,
ADD COLUMN     "justificatifTransfertType" TEXT,
ADD COLUMN     "justificatifType" TEXT NOT NULL,
ADD COLUMN     "typeJustificatif" "TypeJustificatifIdentite" NOT NULL,
ADD COLUMN     "vientDAutreEtablissement" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "DossierProfesseur" (
    "id" SERIAL NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "justification" TEXT NOT NULL,
    "diplomeNom" TEXT NOT NULL,
    "diplomeType" TEXT NOT NULL,
    "diplomeData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "professeurId" INTEGER NOT NULL,

    CONSTRAINT "DossierProfesseur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DossierProfesseur_professeurId_key" ON "DossierProfesseur"("professeurId");

-- AddForeignKey
ALTER TABLE "DossierProfesseur" ADD CONSTRAINT "DossierProfesseur_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
