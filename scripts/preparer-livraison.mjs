/* ============================================================================
 * Prepare le paquet a televerser chez OVH — `npm run paquet`
 * ----------------------------------------------------------------------------
 * Ne publie rien. Construit le site, verifie qu'il est coherent avec la base
 * configuree, et copie le resultat dans un dossier de livraison horodate.
 * Le televersement FTP reste une action manuelle : voir docs/mise-en-ligne.md
 * ========================================================================== */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(racine, 'dist');
const livraison = join(racine, 'livraison');

console.log('\n=== Preparation du paquet de mise en ligne ===\n');

/* --- 1. Controles avant construction ------------------------------------- */
const controles = [
  ['Auto-controle des moteurs', 'node scripts/selbsttest.mjs'],
  ['Alignement des traductions', 'node scripts/i18n-check.mjs'],
  ['Analyse statique', 'npx eslint .'],
];

for (const [libelle, commande] of controles) {
  process.stdout.write(`  ${libelle.padEnd(32)}`);
  try {
    execSync(commande, { cwd: racine, stdio: 'pipe' });
    console.log('OK');
  } catch {
    console.log('ECHEC');
    console.error(`\n  Arret : « ${libelle} » ne passe pas. Rien n'a ete prepare.`);
    console.error(`  Relancez la commande pour voir le detail : ${commande}\n`);
    process.exit(1);
  }
}

/* --- 2. Construction ------------------------------------------------------ */
process.stdout.write('  Construction                    ');
execSync('npx vite build', { cwd: racine, stdio: 'pipe' });
console.log('OK');

/* --- 3. Coherence de la base ---------------------------------------------- */
/* Une base mal accordee au chemin d'hebergement donne une page blanche : les
 * ressources partent chercher un prefixe qui n'existe pas. C'est arrive. */
const config = readFileSync(join(racine, 'vite.config.js'), 'utf8');
const base = (config.match(/base:\s*'([^']+)'/) || [])[1] || '/';
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const prefixes = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
const relatifs = prefixes.filter((p) => p.startsWith('/'));
const coherent = relatifs.every((p) => p.startsWith(base));

console.log(`\n  Base configuree : ${base}`);
if (!coherent) {
  console.error('  INCOHERENCE : des ressources ne commencent pas par cette base.');
  console.error('  Le site afficherait une page blanche. Rien n\'a ete prepare.\n');
  process.exit(1);
}
console.log(`  Le site doit etre servi depuis ${base} — pas ailleurs.`);

/* --- 4. Copie dans le dossier de livraison -------------------------------- */
if (existsSync(livraison)) rmSync(livraison, { recursive: true, force: true });
mkdirSync(livraison, { recursive: true });
cpSync(dist, livraison, { recursive: true });

/* Un .htaccess minimal : le routage se fait par fragment d'URL, mais une
 * entree directe sur un sous-chemin doit retomber sur index.html. */
writeFileSync(join(livraison, '.htaccess'), [
  '<IfModule mod_rewrite.c>',
  '  RewriteEngine On',
  `  RewriteBase ${base}`,
  '  RewriteRule ^index\\.html$ - [L]',
  '  RewriteCond %{REQUEST_FILENAME} !-f',
  '  RewriteCond %{REQUEST_FILENAME} !-d',
  `  RewriteRule . ${base}index.html [L]`,
  '</IfModule>',
  '',
].join('\n'));

const fichiers = execSync('git rev-parse --short HEAD', { cwd: racine }).toString().trim();
writeFileSync(join(livraison, 'VERSION.txt'),
  `Commit : ${fichiers}\nBase   : ${base}\nPrepare: ${new Date().toISOString()}\n`);

console.log(`\n  Paquet pret dans : livraison/`);
console.log('  Televersez son contenu dans le dossier /simulator de l\'hebergement OVH,');
console.log('  fichier .htaccess compris (FileZilla : afficher les fichiers caches).\n');
console.log('  Rien n\'a ete publie par ce script.\n');
