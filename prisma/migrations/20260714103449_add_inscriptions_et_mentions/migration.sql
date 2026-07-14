-- CreateEnum
CREATE TYPE "StatutInscriptionAdmin" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "Mention" AS ENUM ('EN_ATTENTE', 'ADMIS', 'AJOURNE');

-- CreateTable
CREATE TABLE "InscriptionAdministrative" (
    "id" SERIAL NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "statut" "StatutInscriptionAdmin" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateValidation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etudiantId" INTEGER NOT NULL,

    CONSTRAINT "InscriptionAdministrative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentionBulletin" (
    "id" SERIAL NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "mention" "Mention" NOT NULL DEFAULT 'EN_ATTENTE',
    "appreciation" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etudiantId" INTEGER NOT NULL,

    CONSTRAINT "MentionBulletin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InscriptionAdministrative_etudiantId_anneeScolaire_key" ON "InscriptionAdministrative"("etudiantId", "anneeScolaire");

-- CreateIndex
CREATE UNIQUE INDEX "MentionBulletin_etudiantId_anneeScolaire_key" ON "MentionBulletin"("etudiantId", "anneeScolaire");

-- AddForeignKey
ALTER TABLE "InscriptionAdministrative" ADD CONSTRAINT "InscriptionAdministrative_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentionBulletin" ADD CONSTRAINT "MentionBulletin_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
