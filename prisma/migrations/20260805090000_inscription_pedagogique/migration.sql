ALTER TABLE "InscriptionAdministrative" ADD COLUMN "emailContact" TEXT;
ALTER TABLE "InscriptionAdministrative" ADD COLUMN "telephoneContact" TEXT;
ALTER TABLE "InscriptionAdministrative" ADD COLUMN "statutPedagogique" "StatutInscriptionAdmin" NOT NULL DEFAULT 'EN_ATTENTE';
ALTER TABLE "InscriptionAdministrative" ADD COLUMN "dateValidationPedagogique" TIMESTAMP(3);
