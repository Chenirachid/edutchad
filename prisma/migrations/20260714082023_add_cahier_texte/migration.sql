-- CreateTable
CREATE TABLE "CahierTexte" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "contenu" TEXT NOT NULL,
    "devoirs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enseignementId" INTEGER NOT NULL,

    CONSTRAINT "CahierTexte_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CahierTexte" ADD CONSTRAINT "CahierTexte_enseignementId_fkey" FOREIGN KEY ("enseignementId") REFERENCES "Enseignement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
