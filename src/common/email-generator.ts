import { Role } from '@prisma/client';

/**
 * Normalise une chaîne pour en faire une partie d'adresse email :
 * enlève les accents, met en minuscule, ne garde que les lettres.
 */
export function normalizeEmailPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/**
 * Domaine email selon le rôle de l'utilisateur.
 */
export function domainForRole(role: Role): string {
  switch (role) {
    case Role.ETUDIANT:
      return 'eleves.educheni.com';
    case Role.PROFESSEUR:
      return 'profs.educheni.com';
    case Role.ADMIN:
      return 'admin.educheni.com';
    case Role.PARENT:
      return 'parents.educheni.com';
    default:
      return 'educheni.com';
  }
}

/**
 * Construit l'adresse email de base (sans vérifier l'unicité) :
 * prenom.nom@domaine-du-role
 */
export function buildBaseEmail(prenom: string, nom: string, role: Role): string {
  const base = `${normalizeEmailPart(prenom)}.${normalizeEmailPart(nom)}`;
  return `${base}@${domainForRole(role)}`;
}

/**
 * Formate un numéro étudiant lisible à partir de l'id technique interne :
 * ETU-00007
 */
export function formatNumeroEtudiant(id: number): string {
  return `ETU-${String(id).padStart(5, '0')}`;
}
