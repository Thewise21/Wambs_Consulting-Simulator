/* ============================================================================
 * Controle d'alignement des traductions — `npm run i18n`
 * ----------------------------------------------------------------------------
 * Verifie que les trois langues restent strictement paralleles :
 *   1. meme arborescence de cles (aucune cle manquante ni orpheline)
 *   2. memes jetons {variable} dans chaque texte
 *   3. memes longueurs de tableaux (mois, libelles d'etapes)
 *   4. aucune valeur vide
 *   5. aucun texte visible code en dur dans les composants
 * ========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const dossierI18n = join(racine, 'src', 'i18n');
const LANGUES = ['de', 'fr', 'en'];
const REFERENCE = 'de';

let problemes = 0;
const signaler = (message) => { problemes += 1; console.log(`  ${message}`); };

function lire(fichier) {
  return JSON.parse(readFileSync(join(dossierI18n, fichier), 'utf8'));
}

/* Aplatit un objet en chemins pointes ; les tableaux deviennent cle[n] */
function aplatir(valeur, prefixe = '', sortie = {}) {
  if (Array.isArray(valeur)) {
    sortie[`${prefixe}[]`] = valeur.length;
    valeur.forEach((v, i) => aplatir(v, `${prefixe}[${i}]`, sortie));
  } else if (valeur && typeof valeur === 'object') {
    Object.entries(valeur).forEach(([cle, v]) => {
      aplatir(v, prefixe ? `${prefixe}.${cle}` : cle, sortie);
    });
  } else {
    sortie[prefixe] = valeur;
  }
  return sortie;
}

function jetons(texte) {
  if (typeof texte !== 'string') return [];
  return [...texte.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

/* --- 1 a 4 : comparaison des fichiers de traduction ---------------------- */
function comparerJeu(nom, motif) {
  console.log(`\n${nom}`);

  const plats = {};
  for (const langue of LANGUES) {
    plats[langue] = aplatir(lire(motif(langue)));
  }

  const clesRef = Object.keys(plats[REFERENCE]);

  for (const langue of LANGUES) {
    if (langue === REFERENCE) continue;

    const manquantes = clesRef.filter((c) => !(c in plats[langue]));
    const orphelines = Object.keys(plats[langue]).filter((c) => !(c in plats[REFERENCE]));

    manquantes.forEach((c) => signaler(`[${langue}] cle manquante : ${c}`));
    orphelines.forEach((c) => signaler(`[${langue}] cle absente de la reference ${REFERENCE} : ${c}`));

    /* Jetons {variable} et longueurs de tableaux */
    for (const cle of clesRef) {
      if (!(cle in plats[langue])) continue;
      const ref = plats[REFERENCE][cle];
      const trad = plats[langue][cle];

      if (cle.endsWith('[]')) {
        if (ref !== trad) signaler(`[${langue}] longueur de tableau differente en ${cle} : ${trad} au lieu de ${ref}`);
        continue;
      }

      const jRef = jetons(ref).join(',');
      const jTrad = jetons(trad).join(',');
      if (jRef !== jTrad) {
        signaler(`[${langue}] jetons differents en ${cle} : {${jTrad}} au lieu de {${jRef}}`);
      }
    }
  }

  /* Valeurs vides, toutes langues confondues */
  for (const langue of LANGUES) {
    Object.entries(plats[langue]).forEach(([cle, valeur]) => {
      if (typeof valeur === 'string' && valeur.trim() === '') {
        signaler(`[${langue}] valeur vide : ${cle}`);
      }
    });
  }

  const total = clesRef.filter((c) => !c.endsWith('[]')).length;
  console.log(`  ${total} cles comparees sur ${LANGUES.length} langues`);
}

comparerJeu('Simulateur historique (de|fr|en.json)', (l) => `${l}.json`);
comparerJeu('Hub et nouveaux simulateurs (tools.*.json)', (l) => `tools.${l}.json`);

/* --- 5 : textes visibles codes en dur dans les composants ---------------- */
console.log('\nTextes codes en dur dans les composants');

function fichiersJsx(dossier, liste = []) {
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) fichiersJsx(chemin, liste);
    else if (entree.name.endsWith('.jsx')) liste.push(chemin);
  }
  return liste;
}

/* Texte entre deux balises. Les accolades sont autorisees dans la capture puis
 * retirees : sans cela on ratait « So setzt sich ... ({n} Positionen) ». */
const TEXTE_JSX = />([^<>]*?)</g;

/* Prepare le source : sans ce nettoyage, le regex traverse les balises SVG
 * auto-fermantes et capture du code et des commentaires. */
function nettoyer(source) {
  /* Les zones supprimees sont remplacees par leurs seuls sauts de ligne :
     les numeros de ligne rapportes restent ceux du fichier d'origine. */
  const blanchir = (bloc) => bloc.replace(/[^\n]/g, ' ');
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blanchir)        // commentaires de bloc
    .replace(/^\s*\/\/.*$/gm, blanchir)            // commentaires de ligne
    .replace(/<svg[\s\S]*?<\/svg>/g, blanchir)     // icones : jamais de prose
    .replace(/<(path|circle|rect|line|polyline|polygon)\b[^>]*\/>/g, blanchir);
}

/* Retire les expressions {…}, y compris imbriquees */
function sansExpressions(texte) {
  let precedent;
  let courant = texte;
  do {
    precedent = courant;
    courant = courant.replace(/\{[^{}]*\}/g, '');
  } while (courant !== precedent);
  return courant;
}
/* Attributs dont le contenu est lu par un lecteur d'ecran ou affiche */
const ATTRIBUTS_VISIBLES = /\b(aria-label|alt|title|placeholder)="([^"]{4,})"/g;

/* Le nom de marque et la ponctuation decorative ne se traduisent pas */
const TOLERE = /^(&[a-z]+;|WAMB(&apos;|')?S( Consulting)?|Toggle theme|[\s·•—↻/|,.:;()-]+)$/i;
/* Un fragment qui contient ces marqueurs est du code JSX, pas de la prose */
const CODE = /(&&|\|\||=>|===|!==|[<>=]=|\breturn\b|\bconst\b|[();]|:\s*\()/;

const fichiersIgnores = /(-original|\.test)\.jsx$/;
let horsI18n = 0;

function estProse(texte) {
  if (!texte || TOLERE.test(texte) || CODE.test(texte)) return false;
  /* Une accolade orpheline apres nettoyage signale une expression coupee par
     un operateur < ou > : c'est du code, pas du texte affiche. */
  if (/[{}]/.test(texte)) return false;
  /* Au moins deux mots, ou un mot d'au moins cinq lettres */
  const mots = texte.match(/[A-Za-zÀ-ÿ]{2,}/g) || [];
  if (mots.length === 0) return false;
  return mots.length >= 2 || mots[0].length >= 5;
}

for (const fichier of fichiersJsx(join(racine, 'src'))) {
  if (fichiersIgnores.test(fichier)) continue;
  const brut = readFileSync(fichier, 'utf8');
  const contenu = nettoyer(brut);
  const chemin = fichier.replace(racine, '.');
  const ligneDe = (index) => contenu.slice(0, index).split('\n').length;

  for (const correspondance of contenu.matchAll(TEXTE_JSX)) {
    /* On retire les expressions {…} : seul le texte litteral nous interesse */
    const texte = sansExpressions(correspondance[1]).trim();
    if (!estProse(texte)) continue;
    signaler(`${chemin}:${ligneDe(correspondance.index)} texte non traduit : « ${texte} »`);
    horsI18n += 1;
  }

  for (const correspondance of contenu.matchAll(ATTRIBUTS_VISIBLES)) {
    const texte = correspondance[2].trim();
    if (!estProse(texte)) continue;
    signaler(`${chemin}:${ligneDe(correspondance.index)} attribut ${correspondance[1]} non traduit : « ${texte} »`);
    horsI18n += 1;
  }
}
if (horsI18n === 0) console.log('  aucun texte visible hors des fichiers de traduction');

/* --- 6 : aucun Steuerberater nomme --------------------------------------- */
/* Regle de conformite : le site n'identifie aucun Steuerberater. Les missions
 * reservees sont attribuees a « einen unabhaengigen Steuerberater ». Ce
 * controle empeche qu'un nom soit reintroduit par inadvertance. */
console.log('\nRegle : aucun Steuerberater nomme');

/* Sensible a la casse : c'est la majuscule qui distingue un nom propre du
 * qualificatif. Avec le drapeau /i, « conseiller fiscal independant » etait
 * pris pour « conseiller fiscal Dupont ». */
const NOM_STEUERBERATER = [
  /\bStB\.?\s+[A-ZÄÖÜ]/,                             // « StB Winfried … »
  /\bSteuerberater(?:in)?\s+[A-ZÄÖÜ][a-zäöüß]{2,}/,  // « Steuerberater Müller »
  /\bconseiller fiscal\s+[A-ZÉÈ][a-zéèêà]{2,}/,
  /\btax adviser\s+[A-Z][a-z]{2,}/,
];

function fichiersSource(dossier, liste = []) {
  for (const entree of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) fichiersSource(chemin, liste);
    else if (/\.(jsx?|json)$/.test(entree.name)) liste.push(chemin);
  }
  return liste;
}

let nomsTrouves = 0;
for (const fichier of fichiersSource(join(racine, 'src'))) {
  if (fichiersIgnores.test(fichier)) continue;
  const contenu = readFileSync(fichier, 'utf8');
  contenu.split('\n').forEach((ligne, index) => {
    if (NOM_STEUERBERATER.some((motif) => motif.test(ligne))) {
      signaler(`${fichier.replace(racine, '.')}:${index + 1} Steuerberater nomme : « ${ligne.trim().slice(0, 110)} »`);
      nomsTrouves += 1;
    }
  });
}
if (nomsTrouves === 0) console.log('  aucun Steuerberater identifie dans le site');

/* --- Bilan ---------------------------------------------------------------- */
console.log(`\n=== ${problemes === 0 ? 'Traductions alignees' : `${problemes} ecart(s) detecte(s)`} ===\n`);
process.exit(problemes === 0 ? 0 : 1);
