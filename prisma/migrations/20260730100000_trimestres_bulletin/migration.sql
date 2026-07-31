ALTER TABLE "Note" ADD COLUMN "trimestre" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Epreuve" ADD COLUMN "trimestre" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "BulletinMatiere" (
    "id" SERIAL NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "elementsProgramme" TEXT,
    "appreciationTravail" TEXT,
    "appreciationAvis" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etudiantId" INTEGER NOT NULL,
    "enseignementId" INTEGER NOT NULL,

    CONSTRAINT "BulletinMatiere_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BulletinMatiere_etudiantId_enseignementId_trimestre_key" ON "BulletinMatiere"("etudiantId", "enseignementId", "trimestre");

ALTER TABLE "BulletinMatiere" ADD CONSTRAINT "BulletinMatiere_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BulletinMatiere" ADD CONSTRAINT "BulletinMatiere_enseignementId_fkey" FOREIGN KEY ("enseignementId") REFERENCES "Enseignement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
