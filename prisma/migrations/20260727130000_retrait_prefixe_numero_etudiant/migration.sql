UPDATE "User" SET "numeroEtudiant" = REPLACE("numeroEtudiant", 'ETU-', '') WHERE "numeroEtudiant" LIKE 'ETU-%';
