/* ============================================================================
 * Soutien financier aux proches restes au pays (§ 33a Abs. 1 EStG)
 * ----------------------------------------------------------------------------
 * Presque chaque foyer de la diaspora envoie de l'argent a sa famille, et
 * presque personne ne sait que c'est deductible. Trois regles decident du
 * montant reellement obtenu :
 *
 *   1. le plafond est reduit selon le groupe de pays du beneficiaire ;
 *   2. les revenus propres du beneficiaire s'imputent au-dela de 624 EUR ;
 *   3. hors conjoint, la deduction est plafonnee par l'Opfergrenze, une part
 *      du revenu net du payeur.
 *
 * Et depuis 2025 une condition de forme fait echouer la majorite des dossiers :
 * seuls les virements bancaires sont admis, plus aucune remise en especes.
 * ========================================================================== */
import { UNTERHALT, LAENDERGRUPPEN, ANNEE_DEFAUT } from './parameter.js';
import { tauxMarginal } from './estTarif.js';

/* Opfergrenze : part maximale du revenu net que l'on peut consacrer au soutien
 * de proches autres que le conjoint. Ne s'applique pas aux couples maries. */
export function calculerOpfergrenze({ revenuNet, conjoint, enfants }) {
  const o = UNTERHALT.opfergrenze;
  const tranches = Math.floor(Math.max(0, revenuNet) / o.tailleTranche);
  const brut = Math.min(o.maximum, tranches * o.pointParTranche);
  const reduction = Math.min(
    o.reductionMaximale,
    (conjoint ? o.reductionConjoint : 0) + Math.max(0, enfants) * o.reductionEnfant,
  );
  const part = Math.max(0, brut - reduction);
  return { part, montant: Math.max(0, revenuNet) * part };
}

export function analyserUnterhalt(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const p = UNTERHALT[annee] || UNTERHALT[ANNEE_DEFAUT];

  const groupe = LAENDERGRUPPEN[entree.laendergruppe] ? entree.laendergruppe : 4;
  const fraction = LAENDERGRUPPEN[groupe].fraction;

  const montantVerse = Math.max(0, entree.montantVerse || 0);
  const nombrePersonnes = Math.max(1, Math.round(entree.nombrePersonnes || 1));
  const revenusPersonne = Math.max(0, entree.revenusPersonne || 0);
  const moisSoutien = Math.min(12, Math.max(1, Math.round(entree.moisSoutien || 12)));
  const parVirement = entree.parVirement !== false;
  const conjointBeneficiaire = !!entree.conjointBeneficiaire;
  const beneficiaireApteAuTravail = !!entree.beneficiaireApteAuTravail;

  /* Situation du payeur, pour l'Opfergrenze et le taux marginal */
  const revenuNetPayeur = Math.max(0, entree.revenuNetPayeur || 0);
  const revenuImposablePayeur = Math.max(0, entree.revenuImposablePayeur || revenuNetPayeur);
  const splitting = !!entree.splitting;
  const conjointPayeur = !!entree.conjointPayeur;
  const enfantsPayeur = Math.max(0, Math.round(entree.enfantsPayeur || 0));

  /* --- Plafond par personne soutenue -------------------------------------- */
  const plafondPlein = p.hoechstbetrag * fraction;
  /* § 33a Abs. 3 : reduction d'un douzieme par mois non couvert */
  const plafondProrata = plafondPlein * (moisSoutien / 12);

  /* Revenus propres du beneficiaire, imputes au-dela de la franchise */
  const imputation = Math.max(0, revenusPersonne - p.anrechnungsfreierBetrag);
  const plafondApresImputation = Math.max(0, plafondProrata - imputation);

  /* --- Montant retenu ------------------------------------------------------ */
  const verseParPersonne = montantVerse / nombrePersonnes;
  let deductibleParPersonne = Math.min(verseParPersonne, plafondApresImputation);
  let deductibleTotal = deductibleParPersonne * nombrePersonnes;

  /* Opfergrenze — hors conjoint uniquement */
  const opfergrenze = calculerOpfergrenze({
    revenuNet: revenuNetPayeur,
    conjoint: conjointPayeur,
    enfants: enfantsPayeur,
  });
  const opfergrenzeApplicable = !conjointBeneficiaire && revenuNetPayeur > 0;
  const limiteParOpfergrenze = opfergrenzeApplicable && deductibleTotal > opfergrenze.montant;
  if (limiteParOpfergrenze) {
    deductibleTotal = opfergrenze.montant;
    deductibleParPersonne = deductibleTotal / nombrePersonnes;
  }

  /* Condition de forme : sans virement, plus rien n'est deductible */
  const formeInvalide = !parVirement && annee >= UNTERHALT.virementObligatoireDepuis;
  if (formeInvalide) {
    deductibleTotal = 0;
    deductibleParPersonne = 0;
  }

  /* Obligation de travailler du beneficiaire : si la personne est en age et en
     capacite de travailler, l'administration refuse en principe la deduction. */
  const refuseErwerbsobliegenheit = beneficiaireApteAuTravail && !conjointBeneficiaire;
  if (refuseErwerbsobliegenheit) {
    deductibleTotal = 0;
    deductibleParPersonne = 0;
  }

  /* --- Economie d'impot ---------------------------------------------------- */
  const taux = entree.tauxMarginal !== undefined
    ? Math.max(0, Math.min(0.45, entree.tauxMarginal))
    : tauxMarginal(revenuImposablePayeur, splitting, annee);
  const economie = deductibleTotal * taux;

  const partReconnue = montantVerse > 0 ? deductibleTotal / montantVerse : 0;

  /* --- Alertes -------------------------------------------------------------- */
  const alertes = [];

  if (formeInvalide) {
    alertes.push({ cle: 'especesRefusees', niveau: 'important', params: { annee: UNTERHALT.virementObligatoireDepuis } });
  } else {
    alertes.push({ cle: 'virementObligatoire', niveau: 'attention', params: {} });
  }
  if (refuseErwerbsobliegenheit) {
    alertes.push({ cle: 'erwerbsobliegenheit', niveau: 'important', params: {} });
  }
  if (fraction < 1) {
    alertes.push({
      cle: 'laendergruppe',
      niveau: 'attention',
      params: { groupe, part: fraction, plafond: plafondPlein },
    });
  }
  if (limiteParOpfergrenze) {
    alertes.push({
      cle: 'opfergrenze',
      niveau: 'attention',
      params: { montant: opfergrenze.montant, part: opfergrenze.part },
    });
  }
  if (imputation > 0) {
    alertes.push({
      cle: 'revenusBeneficiaire',
      niveau: 'info',
      params: { montant: imputation, seuil: p.anrechnungsfreierBetrag },
    });
  }
  if (moisSoutien < 12) {
    alertes.push({ cle: 'zwoelftelung', niveau: 'info', params: { nombre: moisSoutien } });
  }
  if (montantVerse > deductibleTotal && deductibleTotal > 0) {
    alertes.push({
      cle: 'plafonne',
      niveau: 'info',
      params: { montant: montantVerse - deductibleTotal },
    });
  }
  alertes.push({ cle: 'justificatifs', niveau: 'attention', params: {} });
  alertes.push({ cle: 'vermoegen', niveau: 'info', params: { limite: p.vermoegensgrenze } });
  alertes.push({ cle: 'groupeAVerifier', niveau: 'info', params: {} });

  return {
    annee,
    groupe,
    fraction,
    montantVerse,
    nombrePersonnes,
    plafondPlein,
    plafondProrata,
    imputation,
    plafondApresImputation,
    deductibleParPersonne,
    deductibleTotal,
    opfergrenze,
    opfergrenzeApplicable,
    limiteParOpfergrenze,
    formeInvalide,
    refuseErwerbsobliegenheit,
    tauxMarginal: taux,
    economie,
    partReconnue,
    alertes,
  };
}
