CREATE TYPE "StatutDeclarationAbsence" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REFUSEE');

CREATE TABLE "DeclarationAbsenceParent" (
    "id" SERIAL NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "raison" TEXT NOT NULL,
    "commentaire" TEXT,
    "justificatifNom" TEXT,
    "justificatifType" TEXT,
    "justificatifData" TEXT,
    "statut" "StatutDeclarationAbsence" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etudiantId" INTEGER NOT NULL,
    "declarantId" INTEGER NOT NULL,

    CONSTRAINT "DeclarationAbsenceParent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DeclarationAbsenceParent" ADD CONSTRAINT "DeclarationAbsenceParent_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeclarationAbsenceParent" ADD CONSTRAINT "DeclarationAbsenceParent_declarantId_fkey" FOREIGN KEY ("declarantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
