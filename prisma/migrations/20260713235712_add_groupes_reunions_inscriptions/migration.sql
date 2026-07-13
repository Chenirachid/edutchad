-- CreateEnum
CREATE TYPE "TypeAbsence" AS ENUM ('ABSENCE', 'RETARD');

-- CreateEnum
CREATE TYPE "TypeObservation" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRE');

-- CreateEnum
CREATE TYPE "TypePunition" AS ENUM ('AVERTISSEMENT', 'RETENUE', 'EXCLUSION_TEMPORAIRE', 'EXCLUSION_DEFINITIVE');

-- CreateEnum
CREATE TYPE "TypeGroupe" AS ENUM ('CLASSE', 'PROFS', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatutInvitation" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- AlterTable
ALTER TABLE "Absence" ADD COLUMN     "dureeMinutes" INTEGER,
ADD COLUMN     "type" "TypeAbsence" NOT NULL DEFAULT 'ABSENCE';

-- CreateTable
CREATE TABLE "InscriptionMatiere" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etudiantId" INTEGER NOT NULL,
    "matiereId" INTEGER NOT NULL,

    CONSTRAINT "InscriptionMatiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "type" "TypeObservation" NOT NULL DEFAULT 'NEUTRE',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etudiantId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,
    "enseignementId" INTEGER,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Punition" (
    "id" SERIAL NOT NULL,
    "type" "TypePunition" NOT NULL,
    "motif" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dureeHeures" INTEGER,
    "etudiantId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,

    CONSTRAINT "Punition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Groupe" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeGroupe" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classeId" INTEGER,

    CONSTRAINT "Groupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageGroupe" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupeId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,

    CONSTRAINT "MessageGroupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reunion" (
    "id" SERIAL NOT NULL,
    "sujet" TEXT NOT NULL,
    "lieu" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organisateurId" INTEGER NOT NULL,

    CONSTRAINT "Reunion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationReunion" (
    "id" SERIAL NOT NULL,
    "reponse" "StatutInvitation" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reunionId" INTEGER NOT NULL,
    "inviteId" INTEGER NOT NULL,

    CONSTRAINT "InvitationReunion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InscriptionMatiere_etudiantId_matiereId_key" ON "InscriptionMatiere"("etudiantId", "matiereId");

-- CreateIndex
CREATE UNIQUE INDEX "Groupe_classeId_key" ON "Groupe"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationReunion_reunionId_inviteId_key" ON "InvitationReunion"("reunionId", "inviteId");

-- AddForeignKey
ALTER TABLE "InscriptionMatiere" ADD CONSTRAINT "InscriptionMatiere_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscriptionMatiere" ADD CONSTRAINT "InscriptionMatiere_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_enseignementId_fkey" FOREIGN KEY ("enseignementId") REFERENCES "Enseignement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Punition" ADD CONSTRAINT "Punition_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Punition" ADD CONSTRAINT "Punition_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Groupe" ADD CONSTRAINT "Groupe_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageGroupe" ADD CONSTRAINT "MessageGroupe_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "Groupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageGroupe" ADD CONSTRAINT "MessageGroupe_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reunion" ADD CONSTRAINT "Reunion_organisateurId_fkey" FOREIGN KEY ("organisateurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationReunion" ADD CONSTRAINT "InvitationReunion_reunionId_fkey" FOREIGN KEY ("reunionId") REFERENCES "Reunion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationReunion" ADD CONSTRAINT "InvitationReunion_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
