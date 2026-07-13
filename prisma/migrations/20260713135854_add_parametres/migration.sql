-- CreateTable
CREATE TABLE "ParametrePlateforme" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nomEtablissement" TEXT NOT NULL DEFAULT 'EduTchad',
    "anneeScolaire" TEXT NOT NULL DEFAULT '2025-2026',
    "bareme" INTEGER NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametrePlateforme_pkey" PRIMARY KEY ("id")
);
