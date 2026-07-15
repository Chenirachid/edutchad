/*
  Warnings:

  - A unique constraint covering the columns `[nom,etablissementId]` on the table `Classe` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nom,etablissementId]` on the table `Matiere` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[etablissementId]` on the table `ParametrePlateforme` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Classe_nom_key";

-- DropIndex
DROP INDEX "Matiere_nom_key";

-- AlterTable
ALTER TABLE "Classe" ADD COLUMN     "etablissementId" INTEGER;

-- AlterTable
ALTER TABLE "Matiere" ADD COLUMN     "etablissementId" INTEGER;

-- AlterTable
CREATE SEQUENCE parametreplateforme_id_seq;
ALTER TABLE "ParametrePlateforme" ADD COLUMN     "etablissementId" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('parametreplateforme_id_seq'),
ALTER COLUMN "nomEtablissement" SET DEFAULT 'EduCheni';
ALTER SEQUENCE parametreplateforme_id_seq OWNED BY "ParametrePlateforme"."id";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "etablissementId" INTEGER;

-- CreateTable
CREATE TABLE "Etablissement" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Etablissement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Etablissement_code_key" ON "Etablissement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Classe_nom_etablissementId_key" ON "Classe"("nom", "etablissementId");

-- CreateIndex
CREATE UNIQUE INDEX "Matiere_nom_etablissementId_key" ON "Matiere"("nom", "etablissementId");

-- CreateIndex
CREATE UNIQUE INDEX "ParametrePlateforme_etablissementId_key" ON "ParametrePlateforme"("etablissementId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matiere" ADD CONSTRAINT "Matiere_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParametrePlateforme" ADD CONSTRAINT "ParametrePlateforme_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
