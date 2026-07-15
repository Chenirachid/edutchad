-- CreateTable
CREATE TABLE "Sondage" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "cloture" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteurId" INTEGER NOT NULL,
    "etablissementId" INTEGER,

    CONSTRAINT "Sondage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionSondage" (
    "id" SERIAL NOT NULL,
    "texte" TEXT NOT NULL,
    "sondageId" INTEGER NOT NULL,

    CONSTRAINT "OptionSondage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteSondage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "optionId" INTEGER NOT NULL,
    "sondageId" INTEGER NOT NULL,
    "votantId" INTEGER NOT NULL,

    CONSTRAINT "VoteSondage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoteSondage_sondageId_votantId_key" ON "VoteSondage"("sondageId", "votantId");

-- AddForeignKey
ALTER TABLE "Sondage" ADD CONSTRAINT "Sondage_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sondage" ADD CONSTRAINT "Sondage_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionSondage" ADD CONSTRAINT "OptionSondage_sondageId_fkey" FOREIGN KEY ("sondageId") REFERENCES "Sondage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSondage" ADD CONSTRAINT "VoteSondage_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "OptionSondage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSondage" ADD CONSTRAINT "VoteSondage_sondageId_fkey" FOREIGN KEY ("sondageId") REFERENCES "Sondage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSondage" ADD CONSTRAINT "VoteSondage_votantId_fkey" FOREIGN KEY ("votantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
