-- CreateTable
CREATE TABLE "CreneauRendezVous" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dureeMinutes" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "professeurId" INTEGER NOT NULL,

    CONSTRAINT "CreneauRendezVous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationRdv" (
    "id" SERIAL NOT NULL,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creneauId" INTEGER NOT NULL,
    "parentId" INTEGER NOT NULL,
    "etudiantId" INTEGER NOT NULL,

    CONSTRAINT "ReservationRdv_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservationRdv_creneauId_key" ON "ReservationRdv"("creneauId");

-- AddForeignKey
ALTER TABLE "CreneauRendezVous" ADD CONSTRAINT "CreneauRendezVous_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRdv" ADD CONSTRAINT "ReservationRdv_creneauId_fkey" FOREIGN KEY ("creneauId") REFERENCES "CreneauRendezVous"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRdv" ADD CONSTRAINT "ReservationRdv_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRdv" ADD CONSTRAINT "ReservationRdv_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
