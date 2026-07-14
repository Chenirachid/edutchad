-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tentativesEchouees" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verrouJusqua" TIMESTAMP(3);
