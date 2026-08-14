/* ============================================================================
 * Simulateur expatriation — arrivee, depart et travail frontalier
 * ----------------------------------------------------------------------------
 * Repond aux questions que se posent les nouveaux arrivants et les frontaliers :
 *   - suis-je assujetti de maniere illimitee (§ 1 Abs. 1 EStG) ou limitee ?
 *   - mes revenus percus a l'etranger avant l'arrivee augmentent-ils mon
 *     imposition allemande ? (Progressionsvorbehalt, § 32b EStG)
 *   - puis-je beneficier du splitting alors que mon conjoint est reste dans
 *     mon pays d'origine ? (§ 1a EStG)
 *   - suis-je oblige de deposer une declaration ? (§ 46 EStG)
 *
 * Les conventions fiscales sont signalees sous forme d'alertes qualitatives :
 * leur application concrete depend toujours du cas d'espece.
 * ========================================================================== */
import { TARIF, INTERNATIONAL, ANNEE_DEFAUT } from './parameter.js';
import { estimerRevenuImposableSalarie } from './bruttoNetto.js';
import {
  einkommensteuer,
  progressionsvorbehalt,
  solidaritaetszuschlag,
  impotSelonBareme,
} from './estTarif.js';

export const SITUATIONS = ['arrivee', 'resident', 'grenzgaenger', 'depart'];
export const PAYS = ['FR', 'BE', 'LU', 'CH', 'AT', 'NL', 'EU_AUTRE', 'HORS_UE'];

/* Pays ouvrant droit au traitement du § 1a EStG (UE / EEE + Suisse par accord) */
function paysEligibleSplitting(pays) {
  return INTERNATIONAL.paysEEE.includes(pays) || INTERNATIONAL.paysAvecClauseSuisse.includes(pays);
}

/* Le revenu imposable est derive du meme moteur que le simulateur brut/net.
 * Une approximation locale donnerait un resultat different pour un salaire
 * identique — incoherence immediatement visible d'un outil a l'autre. */
function estimerZvE(brut, annee) {
  if (brut <= 0) return 0;
  return estimerRevenuImposableSalarie(brut, { annee });
}

export function analyserExpatriation(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const tarif = TARIF[annee] || TARIF[ANNEE_DEFAUT];
  const grundfreibetrag = tarif.grundfreibetrag;

  const situation = entree.situation || 'arrivee';
  const pays = entree.paysOrigine || 'FR';
  const revenuAllemandBrut = Math.max(0, entree.revenuAllemand || 0);
  const revenuEtranger = Math.max(0, entree.revenuEtranger || 0);
  const revenuConjoint = Math.max(0, entree.revenuConjoint || 0);
  const marie = entree.statut === 'marie';
  const conjointAlEtranger = marie && !!entree.conjointResteAlEtranger;
  const enfants = entree.enfants || 0;

  const moisArrivee = Math.min(12, Math.max(1, entree.moisArrivee || 1));
  const moisEnAllemagne = situation === 'arrivee'
    ? 13 - moisArrivee
    : situation === 'depart'
      ? moisArrivee
      : 12;

  /* --- 1. Nature de l'assujettissement ----------------------------------- */
  let typeAssujettissement;
  if (situation === 'grenzgaenger') {
    typeAssujettissement = 'beschraenkt';
  } else if (situation === 'resident') {
    typeAssujettissement = 'unbeschraenkt';
  } else {
    /* Arrivee ou depart en cours d'annee : assujettissement illimite sur une
     * partie de l'annee seulement (§ 2 Abs. 7 S. 3 EStG) */
    typeAssujettissement = moisEnAllemagne >= 12 ? 'unbeschraenkt' : 'wechsel';
  }

  /* --- 2. Base imposable et Progressionsvorbehalt ------------------------- */
  const zvE = estimerZvE(revenuAllemandBrut, annee);

  /* Les revenus etrangers de la periode non residente relevent du § 32b EStG
   * uniquement en cas d'assujettissement mixte. */
  const revenusSousProgression = typeAssujettissement === 'wechsel' ? revenuEtranger : 0;

  const progression = progressionsvorbehalt(zvE, revenusSousProgression, false, annee);

  /* --- 3. Splitting avec conjoint non resident (§ 1a EStG) ---------------- */
  const revenuMondial = revenuAllemandBrut + revenuEtranger + revenuConjoint;
  const partAllemande = revenuMondial > 0 ? revenuAllemandBrut / revenuMondial : 1;
  const revenusNonAllemands = revenuEtranger + revenuConjoint;

  /* Conditions du § 1 Abs. 3 EStG, transposees au couple (§ 1a Abs. 1 Nr. 2) :
   * au moins 90 % des revenus imposables en Allemagne, ou revenus etrangers
   * inferieurs au double de l'abattement de base. */
  const conditionRevenus = partAllemande >= INTERNATIONAL.seuilRevenusAllemands
    || revenusNonAllemands <= 2 * grundfreibetrag;

  let splittingPossible = null;
  if (marie) {
    if (!conjointAlEtranger) {
      splittingPossible = true;
    } else if (!paysEligibleSplitting(pays)) {
      splittingPossible = false;
    } else {
      splittingPossible = conditionRevenus;
    }
  }

  /* Gain chiffre du splitting : le conjoint reste a l'etranger apporte ses
   * revenus au Progressionsvorbehalt mais ouvre le bareme du splitting. */
  const impotSansSplitting = progression.impotAvec;
  let impotAvecSplitting = impotSansSplitting;
  if (splittingPossible) {
    const progressionCouple = progressionsvorbehalt(
      zvE,
      revenusSousProgression + (conjointAlEtranger ? revenuConjoint : 0),
      true,
      annee,
    );
    impotAvecSplitting = progressionCouple.impotAvec;
  }
  const gainSplitting = Math.max(0, impotSansSplitting - impotAvecSplitting);

  /* --- 4. Option pour l'assujettissement illimite (§ 1 Abs. 3 EStG) ------- */
  const optionParagraphe1Abs3 = typeAssujettissement === 'beschraenkt' && conditionRevenus;

  /* En assujettissement limite hors salaire, l'abattement de base est
   * neutralise (§ 50 Abs. 1 S. 3 EStG) : le revenu imposable est majore. */
  const impotAssujettissementLimite = typeAssujettissement === 'beschraenkt'
    ? einkommensteuer(zvE + grundfreibetrag, annee) - einkommensteuer(grundfreibetrag, annee)
    : null;

  /* --- 5. Charge fiscale retenue ------------------------------------------ */
  const impotRetenu = splittingPossible && gainSplitting > 0
    ? impotAvecSplitting
    : impotSansSplitting;
  const soli = solidaritaetszuschlag(impotRetenu, !!splittingPossible, annee);
  const chargeTotale = impotRetenu + soli;

  /* --- 6. Classe d'imposition recommandee -------------------------------- */
  let steuerklasseRecommandee;
  if (!marie) {
    steuerklasseRecommandee = enfants > 0 ? 'II' : 'I';
  } else if (!conjointAlEtranger) {
    steuerklasseRecommandee = revenuConjoint > 0 ? 'IV' : 'III';
  } else if (splittingPossible) {
    steuerklasseRecommandee = 'III';
  } else {
    steuerklasseRecommandee = 'I';
  }

  /* --- 7. Obligation de deposer une declaration (§ 46 EStG) --------------- */
  const obligationDeclaration = revenusSousProgression > INTERNATIONAL.seuilDeclarationProgression
    || typeAssujettissement === 'wechsel'
    || (marie && steuerklasseRecommandee === 'III');

  /* --- 8. Alertes ---------------------------------------------------------- */
  const alertes = [];

  if (typeAssujettissement === 'wechsel') {
    alertes.push({ cle: 'assujettissementMixte', niveau: 'info', params: { mois: moisEnAllemagne } });
  }
  if (progression.supplement > 0) {
    alertes.push({
      cle: 'progressionvorbehalt',
      niveau: 'attention',
      params: { montant: progression.supplement, taux: progression.tauxSpecial },
    });
  }
  if (situation === 'grenzgaenger' && pays === 'FR') {
    alertes.push({ cle: 'grenzgaengerFR', niveau: 'important', params: {} });
  }
  if (situation === 'grenzgaenger' && pays === 'CH') {
    alertes.push({ cle: 'grenzgaengerCH', niveau: 'important', params: {} });
  }
  if (situation === 'grenzgaenger' && !['FR', 'CH', 'AT'].includes(pays)) {
    alertes.push({ cle: 'grenzgaengerGeneral', niveau: 'info', params: {} });
  }
  if (marie && conjointAlEtranger && splittingPossible) {
    alertes.push({ cle: 'splittingPossible', niveau: 'positif', params: { montant: gainSplitting } });
  }
  if (marie && conjointAlEtranger && splittingPossible === false && paysEligibleSplitting(pays)) {
    alertes.push({ cle: 'splittingRefuseRevenus', niveau: 'attention', params: { part: partAllemande } });
  }
  if (marie && conjointAlEtranger && !paysEligibleSplitting(pays)) {
    alertes.push({ cle: 'splittingRefusePays', niveau: 'attention', params: {} });
  }
  if (optionParagraphe1Abs3) {
    alertes.push({ cle: 'optionIllimitee', niveau: 'positif', params: {} });
  }
  if (typeAssujettissement === 'beschraenkt' && !optionParagraphe1Abs3) {
    alertes.push({ cle: 'pasDeGrundfreibetrag', niveau: 'attention', params: { montant: grundfreibetrag } });
  }
  if (obligationDeclaration) {
    alertes.push({ cle: 'obligationDeclaration', niveau: 'important', params: {} });
  }
  if (enfants > 0) {
    alertes.push({ cle: 'kindergeldEU', niveau: 'info', params: { enfants } });
  }
  if (revenuEtranger > 0 && situation !== 'grenzgaenger') {
    alertes.push({ cle: 'doubleImposition', niveau: 'info', params: { pays } });
  }

  /* --- 9. Checklist administrative ---------------------------------------- */
  const checklist = [];
  if (situation === 'arrivee') {
    checklist.push('anmeldung', 'steuerId', 'lohnsteuerabzug', 'sozialversicherung');
  }
  if (situation === 'grenzgaenger') {
    checklist.push('ansaessigkeitsbescheinigung', 'a1Bescheinigung');
  }
  if (situation === 'depart') {
    checklist.push('abmeldung', 'wegzugsbesteuerung');
  }
  if (marie && conjointAlEtranger && paysEligibleSplitting(pays)) {
    checklist.push('bescheinigungEUEWR');
  }
  if (enfants > 0) checklist.push('kindergeldAntrag');
  checklist.push('elsterZugang', 'unterlagenHeimatland');

  return {
    annee,
    situation,
    pays,
    typeAssujettissement,
    moisEnAllemagne,
    zvE,
    revenuMondial,
    partAllemande,
    progression,
    impotAssujettissementLimite,
    splittingPossible,
    gainSplitting,
    impotSansSplitting,
    impotAvecSplitting,
    optionParagraphe1Abs3,
    obligationDeclaration,
    steuerklasseRecommandee,
    impotRetenu,
    soli,
    chargeTotale,
    tauxEffectif: zvE > 0 ? chargeTotale / zvE : 0,
    /* Economie mise en avant : splitting + effet d'une declaration deposee */
    economiePotentielle: gainSplitting,
    alertes,
    checklist,
  };
}

/* Comparaison pedagogique : ce que couterait la meme situation sans
 * optimisation (pas de splitting, pas de declaration deposee). */
export function comparerScenarios(entree) {
  const analyse = analyserExpatriation(entree);
  const sansOptimisation = impotSelonBareme(analyse.zvE, false, analyse.annee);
  return {
    analyse,
    sansOptimisation,
    avecOptimisation: analyse.impotRetenu,
    difference: sansOptimisation - analyse.impotRetenu,
  };
}
