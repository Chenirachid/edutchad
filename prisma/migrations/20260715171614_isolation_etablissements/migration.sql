-- AlterTable
ALTER TABLE "Groupe" ADD COLUMN     "etablissementId" INTEGER;

-- AddForeignKey
ALTER TABLE "Groupe" ADD CONSTRAINT "Groupe_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
