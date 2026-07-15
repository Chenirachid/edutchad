-- AlterTable
ALTER TABLE "CahierTexte" ADD COLUMN     "pieceJointeData" TEXT,
ADD COLUMN     "pieceJointeNom" TEXT,
ADD COLUMN     "pieceJointeType" TEXT;

-- CreateTable
CREATE TABLE "Actualite" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteurId" INTEGER NOT NULL,
    "etablissementId" INTEGER,

    CONSTRAINT "Actualite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Actualite" ADD CONSTRAINT "Actualite_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actualite" ADD CONSTRAINT "Actualite_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
