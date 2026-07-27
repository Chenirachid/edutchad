CREATE TABLE "RessourceBibliotheque" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "matiere" TEXT,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "reserveProf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ajouteParId" INTEGER NOT NULL,
    "etablissementId" INTEGER,

    CONSTRAINT "RessourceBibliotheque_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RessourceBibliotheque" ADD CONSTRAINT "RessourceBibliotheque_ajouteParId_fkey" FOREIGN KEY ("ajouteParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RessourceBibliotheque" ADD CONSTRAINT "RessourceBibliotheque_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
