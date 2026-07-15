/*
  Warnings:

  - A unique constraint covering the columns `[etudiantId,epreuveId]` on the table `Note` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "epreuveId" INTEGER;

-- CreateTable
CREATE TABLE "Epreuve" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "TypeEvaluation" NOT NULL DEFAULT 'CONTROLE',
    "date" TIMESTAMP(3) NOT NULL,
    "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enseignementId" INTEGER NOT NULL,

    CONSTRAINT "Epreuve_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Note_etudiantId_epreuveId_key" ON "Note"("etudiantId", "epreuveId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_epreuveId_fkey" FOREIGN KEY ("epreuveId") REFERENCES "Epreuve"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Epreuve" ADD CONSTRAINT "Epreuve_enseignementId_fkey" FOREIGN KEY ("enseignementId") REFERENCES "Enseignement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
