/**
 * Script à lancer UNE SEULE FOIS après la migration "identifiant_et_activation".
 * Attribue un nom d'utilisateur (identifiant) à tous les comptes qui n'en ont pas encore.
 * Le mot de passe existant de chaque compte n'est PAS modifié.
 *
 * Utilisation :
 *   cd ~/UniSys/backend
 *   node backfill-identifiants.js
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function normalize(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

async function main() {
  const users = await prisma.user.findMany({ where: { identifiant: null } });
  console.log(`${users.length} compte(s) sans identifiant trouvé(s).`);

  for (const user of users) {
    const base = `${normalize(user.prenom)}.${normalize(user.nom)}`;
    let identifiant = base;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { identifiant } })) {
      counter++;
      identifiant = `${base}${counter}`;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { identifiant },
    });

    console.log(`✔ ${user.prenom} ${user.nom} (${user.role}) → identifiant : ${identifiant}`);
  }

  console.log('Terminé. Connecte-toi avec cet identifiant + ton mot de passe habituel.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
