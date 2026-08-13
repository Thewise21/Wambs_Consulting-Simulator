/* ============================================================================
 * Calculateur Brut / Net (Brutto-Netto-Rechner)
 * ----------------------------------------------------------------------------
 * Reproduit la logique du § 39b EStG (calcul de l'impot sur les salaires)
 * et les cotisations sociales de l'annee choisie.
 *
 * Limites assumees et signalees a l'utilisateur :
 *   - les classes V et VI utilisent la formule du § 39b Abs. 2 S. 7 EStG avec
 *     le plancher legal de 14 % ; les seuils fins de la zone d'ecretement ne
 *     sont pas reproduits ;
 *   - les avantages en nature, la Lohnsteuer-Ermassigung et les revenus
 *     exceptionnels (§ 34 EStG) ne sont pas modelises.
 * ========================================================================== */
import { SV, FORFAITS, ANNEE_DEFAUT } from './parameter.js';
import {
  einkommensteuer,
  einkommensteuerSplitting,
  solidaritaetszuschlag,
  kirchensteuer,
} from './estTarif.js';

export const STEUERKLASSEN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/* --- Impot sur le salaire selon la classe d'imposition -------------------- */
function lohnsteuerTarif(zvE, klasse, annee) {
  const base = Math.max(0, Math.floor(zvE));

  if (klasse === 'III') return einkommensteuerSplitting(base, annee);

  if (klasse === 'V' || klasse === 'VI') {
    /* § 39b Abs. 2 S. 7 EStG : deux fois l'ecart entre l'impot sur 1,25 fois
     * et l'impot sur 0,75 fois le revenu imposable annuel. Le § 39b Abs. 2
     * S. 8 impose un plancher de 14 % — determinant aux faibles revenus,
     * puisque l'abattement de base est deja consomme par la classe III. */
    const haut = einkommensteuer(1.25 * base, annee);
    const bas = einkommensteuer(0.75 * base, annee);
    return Math.max(2 * (haut - bas), 0.14 * base);
  }

  /* Classes I, II et IV — bareme de base */
  return einkommensteuer(base, annee);
}

/* --- Taux salarie de l'assurance dependance (Pflegeversicherung) ---------- */
function tauxPflegeSalarie(sv, { sansEnfant, enfantsMoins25, sachsen }) {
  let taux = sv.tauxPV / 2;
  if (sachsen) taux += sv.supplementSachsenAn;

  if (sansEnfant) {
    taux += sv.supplementSansEnfant;
  } else if (enfantsMoins25 >= 2) {
    /* Reduction de 0,25 pt par enfant a partir du 2e, plafonnee a 4 enfants */
    taux -= sv.reductionParEnfant * Math.min(enfantsMoins25 - 1, 4);
  }
  return Math.max(0, taux);
}

function tauxPflegeEmployeur(sv, sachsen) {
  return sachsen ? sv.tauxPV / 2 - sv.supplementSachsenAn : sv.tauxPV / 2;
}

/* --- Vorsorgepauschale — § 39b Abs. 2 S. 5 Nr. 3 EStG --------------------- */
function vorsorgepauschale({ brutto, klasse, sv, forfaits, assiettesKV, assiettesRV, params }) {
  const { kvType, zusatzbeitrag, primeAnnuellePrivee, zuschussAnnuelEmployeur, rvPflichtig } = params;

  /* Volet retraite — 100 % de la part salariale depuis 2023 */
  const voletRetraite = rvPflichtig ? assiettesRV * (sv.tauxRV / 2) : 0;

  /* Volet maladie / dependance */
  let voletSante;
  if (kvType === 'privat') {
    voletSante = Math.max(0, primeAnnuellePrivee - zuschussAnnuelEmployeur);
  } else {
    /* Taux reduit de 7 % (§ 39b) + moitie de la cotisation supplementaire */
    const partKV = assiettesKV * (0.07 + zusatzbeitrag / 2);
    const partPV = assiettesKV * tauxPflegeSalarie(sv, params);
    voletSante = partKV + partPV;
  }

  /* Mindestvorsorgepauschale : 12 % du salaire, plafonnee */
  const plafond = klasse === 'III'
    ? forfaits.minVorsorgepauschaleKlasseIII
    : forfaits.minVorsorgepauschale;
  const minimum = Math.min(forfaits.partMinVorsorgepauschale * brutto, plafond);

  return voletRetraite + Math.max(voletSante, minimum);
}

/* ---------------------------------------------------------------------------
 * Calcul principal
 *
 * entree = {
 *   bruttoAnnuel, klasse, bundesland, kirchenmitglied,
 *   kinderfreibetraege,        // nombre inscrit sur la fiche de paie (0 / 0,5 / 1 ...)
 *   enfantsMoins25, sansEnfant,
 *   kvType: 'gesetzlich' | 'privat',
 *   zusatzbeitrag,             // en decimal, ex. 0,029
 *   primeMensuellePrivee, rvPflichtig, annee
 * }
 * ------------------------------------------------------------------------- */
export function calculerBruttoNetto(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const sv = SV[annee] || SV[ANNEE_DEFAUT];
  const forfaits = FORFAITS[annee] || FORFAITS[ANNEE_DEFAUT];

  const brutto = Math.max(0, entree.bruttoAnnuel || 0);
  const klasse = entree.klasse || 'I';
  const sachsen = entree.bundesland === 'SN';
  const kvType = entree.kvType || 'gesetzlich';
  const zusatzbeitrag = entree.zusatzbeitrag ?? sv.zusatzbeitragMoyen;
  const rvPflichtig = entree.rvPflichtig !== false;

  /* Assiettes plafonnees */
  const assiettesRV = Math.min(brutto, sv.bbgRentenversicherungAn);
  const assiettesKV = Math.min(brutto, sv.bbgKrankenversicherungAn);

  const paramsPV = {
    sansEnfant: !!entree.sansEnfant,
    enfantsMoins25: entree.enfantsMoins25 || 0,
    sachsen,
  };

  /* --- Cotisations sociales, part salariale ------------------------------- */
  const cotisationRV = rvPflichtig ? assiettesRV * (sv.tauxRV / 2) : 0;
  const cotisationAV = rvPflichtig ? assiettesRV * (sv.tauxAV / 2) : 0;

  let cotisationKV = 0;
  let cotisationPV = 0;
  let primeAnnuellePrivee = 0;
  let zuschussAnnuelEmployeur = 0;

  if (kvType === 'privat') {
    primeAnnuellePrivee = Math.max(0, (entree.primeMensuellePrivee || 0) * 12);
    /* Participation employeur : moitie de la prime, plafonnee a la part
     * patronale maximale du regime legal (§ 257 SGB V) */
    const plafondZuschuss = assiettesKVmax(sv) * (sv.tauxKV / 2 + zusatzbeitrag / 2)
      + assiettesKVmax(sv) * tauxPflegeEmployeur(sv, sachsen);
    zuschussAnnuelEmployeur = Math.min(primeAnnuellePrivee / 2, plafondZuschuss);
    cotisationKV = primeAnnuellePrivee - zuschussAnnuelEmployeur;
    cotisationPV = 0; /* deja compris dans la prime privee */
  } else {
    cotisationKV = assiettesKV * (sv.tauxKV / 2 + zusatzbeitrag / 2);
    cotisationPV = assiettesKV * tauxPflegeSalarie(sv, paramsPV);
  }

  const totalSocial = cotisationRV + cotisationAV + cotisationKV + cotisationPV;

  /* --- Revenu imposable au sens du § 39b EStG ----------------------------- */
  const pauschaleVorsorge = vorsorgepauschale({
    brutto,
    klasse,
    sv,
    forfaits,
    assiettesKV,
    assiettesRV,
    params: {
      ...paramsPV,
      kvType,
      zusatzbeitrag,
      primeAnnuellePrivee,
      zuschussAnnuelEmployeur,
      rvPflichtig,
    },
  });

  const abattementSalarie = klasse === 'VI' ? 0 : forfaits.arbeitnehmerPauschbetrag;
  const abattementSonder = klasse === 'VI' ? 0 : forfaits.sonderausgabenPauschbetrag;
  const abattementParentIsole = klasse === 'II'
    ? forfaits.entlastungsbetragAlleinerziehende
      + forfaits.entlastungsbetragProEnfantSuppl * Math.max(0, (entree.enfantsMoins25 || 1) - 1)
    : 0;

  const zvE = Math.max(
    0,
    brutto - abattementSalarie - abattementSonder - pauschaleVorsorge - abattementParentIsole,
  );

  const lohnsteuer = lohnsteuerTarif(zvE, klasse, annee);

  /* --- Assiette du Soli et de la Kirchensteuer (§ 51a EStG) --------------- */
  /* Les abattements pour enfants sont pris en compte meme lorsque le salarie
   * percoit le Kindergeld : c'est la regle de la « fiktive Steuer ». */
  const abattementEnfants = (entree.kinderfreibetraege || 0) * forfaits.kinderfreibetragTotal;
  const zvEApresEnfants = Math.max(0, zvE - abattementEnfants);
  const lohnsteuerFictive = lohnsteuerTarif(zvEApresEnfants, klasse, annee);

  const soli = solidaritaetszuschlag(lohnsteuerFictive, klasse === 'III', annee);
  const kist = entree.kirchenmitglied
    ? kirchensteuer(lohnsteuerFictive, entree.bundesland)
    : 0;

  const totalImpots = lohnsteuer + soli + kist;
  const netAnnuel = brutto - totalSocial - totalImpots;

  /* --- Cout total employeur ---------------------------------------------- */
  const employeurRV = rvPflichtig ? assiettesRV * (sv.tauxRV / 2) : 0;
  const employeurAV = rvPflichtig ? assiettesRV * (sv.tauxAV / 2) : 0;
  const employeurKV = kvType === 'privat'
    ? zuschussAnnuelEmployeur
    : assiettesKV * (sv.tauxKV / 2 + zusatzbeitrag / 2) + assiettesKV * tauxPflegeEmployeur(sv, sachsen);
  const totalEmployeur = brutto + employeurRV + employeurAV + employeurKV;

  return {
    annee,
    brutto,
    netAnnuel,
    netMensuel: netAnnuel / 12,
    bruttoMensuel: brutto / 12,
    zvE,
    tauxNet: brutto > 0 ? netAnnuel / brutto : 0,
    tauxImposition: brutto > 0 ? totalImpots / brutto : 0,
    tauxSocial: brutto > 0 ? totalSocial / brutto : 0,
    totalImpots,
    totalSocial,
    coutEmployeur: totalEmployeur,
    coutEmployeurMensuel: totalEmployeur / 12,
    postes: {
      lohnsteuer,
      soli,
      kirchensteuer: kist,
      rentenversicherung: cotisationRV,
      arbeitslosenversicherung: cotisationAV,
      krankenversicherung: cotisationKV,
      pflegeversicherung: cotisationPV,
    },
    detailsTechniques: {
      vorsorgepauschale: pauschaleVorsorge,
      abattementSalarie,
      abattementSonder,
      abattementParentIsole,
      abattementEnfants,
      assietteRVPlafonnee: assiettesRV >= sv.bbgRentenversicherungAn,
      assietteKVPlafonnee: assiettesKV >= sv.bbgKrankenversicherungAn,
      auDessusJAEG: brutto > sv.jahresarbeitsentgeltgrenze,
    },
  };
}

function assiettesKVmax(sv) {
  return sv.bbgKrankenversicherungAn;
}

/* Revenu imposable d'un salarie a partir de son brut.
 * Expose pour que les autres simulateurs ne reimplementent pas leur propre
 * approximation : deux moteurs qui repondent differemment a la meme question
 * decredibilisent l'ensemble du site. */
export function estimerRevenuImposableSalarie(bruttoAnnuel, options = {}) {
  const r = calculerBruttoNetto({
    bruttoAnnuel,
    klasse: options.klasse || 'I',
    bundesland: options.bundesland || 'BE',
    kirchenmitglied: false,
    kvType: options.kvType || 'gesetzlich',
    rvPflichtig: options.rvPflichtig !== false,
    sansEnfant: true,
    annee: options.annee || ANNEE_DEFAUT,
  });
  return r.zvE;
}

/* --- Comparaison des combinaisons de classes pour un couple --------------- */
/* Utilise par le simulateur pour montrer l'interet d'un changement de classe */
export function comparerClassesCouple(bruttoA, bruttoB, commun) {
  const variantes = [
    { cle: 'IV_IV', klasseA: 'IV', klasseB: 'IV' },
    { cle: 'III_V', klasseA: 'III', klasseB: 'V' },
    { cle: 'V_III', klasseA: 'V', klasseB: 'III' },
  ];

  return variantes.map(({ cle, klasseA, klasseB }) => {
    const a = calculerBruttoNetto({ ...commun, bruttoAnnuel: bruttoA, klasse: klasseA });
    const b = calculerBruttoNetto({ ...commun, bruttoAnnuel: bruttoB, klasse: klasseB });
    return {
      cle,
      klasseA,
      klasseB,
      netAnnuel: a.netAnnuel + b.netAnnuel,
      netMensuel: (a.netAnnuel + b.netAnnuel) / 12,
      netA: a.netMensuel,
      netB: b.netMensuel,
    };
  }).sort((x, y) => y.netAnnuel - x.netAnnuel);
}
