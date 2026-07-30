CREATE TABLE "AppelFait" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enseignementId" INTEGER NOT NULL,

    CONSTRAINT "AppelFait_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppelFait_enseignementId_date_key" ON "AppelFait"("enseignementId", "date");

ALTER TABLE "AppelFait" ADD CONSTRAINT "AppelFait_enseignementId_fkey" FOREIGN KEY ("enseignementId") REFERENCES "Enseignement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
