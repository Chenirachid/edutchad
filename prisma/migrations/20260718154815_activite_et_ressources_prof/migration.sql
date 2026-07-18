-- AlterTable
ALTER TABLE "User" ADD COLUMN     "derniereActivite" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RessourceProf" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "professeurId" INTEGER NOT NULL,

    CONSTRAINT "RessourceProf_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RessourceProf" ADD CONSTRAINT "RessourceProf_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
