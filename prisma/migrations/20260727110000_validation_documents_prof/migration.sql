CREATE TYPE "StatutValidationDocument" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REFUSE');
ALTER TABLE "DocumentProfesseur" ADD COLUMN "statut" "StatutValidationDocument" NOT NULL DEFAULT 'EN_ATTENTE';
