-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'APPROUVEE', 'REJETEE');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CHEF_PROJET';

-- CreateTable
CREATE TABLE "DemandeSuppressionAdmin" (
    "id" SERIAL NOT NULL,
    "statut" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traiteLe" TIMESTAMP(3),
    "cibleId" INTEGER NOT NULL,
    "demandeurId" INTEGER NOT NULL,
    "traiteParId" INTEGER,

    CONSTRAINT "DemandeSuppressionAdmin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DemandeSuppressionAdmin" ADD CONSTRAINT "DemandeSuppressionAdmin_cibleId_fkey" FOREIGN KEY ("cibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeSuppressionAdmin" ADD CONSTRAINT "DemandeSuppressionAdmin_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeSuppressionAdmin" ADD CONSTRAINT "DemandeSuppressionAdmin_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
