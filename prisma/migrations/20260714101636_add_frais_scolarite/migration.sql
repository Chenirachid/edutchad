-- CreateTable
CREATE TABLE "FraisScolarite" (
    "id" SERIAL NOT NULL,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etudiantId" INTEGER NOT NULL,

    CONSTRAINT "FraisScolarite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Versement" (
    "id" SERIAL NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "moyen" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fraisId" INTEGER NOT NULL,

    CONSTRAINT "Versement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FraisScolarite_etudiantId_key" ON "FraisScolarite"("etudiantId");

-- AddForeignKey
ALTER TABLE "FraisScolarite" ADD CONSTRAINT "FraisScolarite_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Versement" ADD CONSTRAINT "Versement_fraisId_fkey" FOREIGN KEY ("fraisId") REFERENCES "FraisScolarite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
