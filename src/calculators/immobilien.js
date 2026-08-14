/* ============================================================================
 * Immobilier locatif : rendement apres impot, amortissement, plus-value
 * ----------------------------------------------------------------------------
 * Trois questions en une :
 *   - que reste-t-il chaque annee, une fois l'impot paye ?
 *   - quelle part du prix s'amortit reellement (le terrain, jamais) ?
 *   - a partir de quand la revente echappe-t-elle a l'impot (§ 23 EStG) ?
 * ========================================================================== */
import {
  AMORTISSEMENT_IMMOBILIER, SPECULATION_IMMOBILIERE, GRUNDERWERBSTEUER,
  FRAIS_ACQUISITION, ANNEE_DEFAUT,
} from './parameter.js';
import { impotSelonBareme, tauxMarginal } from './estTarif.js';

export const TYPES_AMORTISSEMENT = [
  'habitationDepuis2023', 'habitationDepuis1925', 'habitationAvant1925', 'degressif',
];

export function fraisAcquisition({ prix, bundesland, courtier }) {
  const tauxMutation = GRUNDERWERBSTEUER[bundesland] ?? GRUNDERWERBSTEUER.BE;
  const mutation = prix * tauxMutation;
  const notaire = prix * FRAIS_ACQUISITION.notaire;
  const registre = prix * FRAIS_ACQUISITION.registreFoncier;
  const commission = courtier ? prix * FRAIS_ACQUISITION.commissionCourtierMax : 0;
  const total = mutation + notaire + registre + commission;
  return {
    tauxMutation, mutation, notaire, registre, commission, total,
    part: prix > 0 ? total / prix : 0,
    coutTotal: prix + total,
  };
}

/* Frais annexes d'acquisition, vus sous l'angle du financement : ce sont eux
 * qui doivent etre apportes en fonds propres, car aucune banque ne les prete. */
export function analyserKaufnebenkosten(entree) {
  const prix = Math.max(0, entree.prix || 0);
  const bundesland = entree.bundesland || 'BE';
  const frais = fraisAcquisition({ prix, bundesland, courtier: !!entree.courtier });
  const apport = Math.max(0, entree.apport || 0);

  const apportRequisMinimum = frais.total;
  const empruntNecessaire = Math.max(0, frais.coutTotal - apport);
  const partFinancee = frais.coutTotal > 0 ? empruntNecessaire / frais.coutTotal : 0;
  const apportSuffisant = apport >= apportRequisMinimum;

  /* Comparaison avec le Land le moins cher, a titre indicatif */
  const meilleurTaux = Math.min(...Object.values(GRUNDERWERBSTEUER));
  const economieAilleurs = (frais.tauxMutation - meilleurTaux) * prix;

  const alertes = [];
  if (!apportSuffisant) {
    alertes.push({ cle: 'apportInsuffisant', niveau: 'important', params: { montant: apportRequisMinimum } });
  } else {
    alertes.push({ cle: 'apportSuffisant', niveau: 'positif', params: {} });
  }
  if (economieAilleurs > 0) {
    alertes.push({ cle: 'ecartLand', niveau: 'info', params: { montant: economieAilleurs, taux: meilleurTaux } });
  }
  if (entree.courtier) {
    alertes.push({ cle: 'courtier', niveau: 'attention', params: { montant: frais.commission } });
  }
  alertes.push({ cle: 'mobilier', niveau: 'positif', params: {} });
  alertes.push({ cle: 'delaiPaiement', niveau: 'info', params: {} });

  return {
    prix,
    frais,
    apport,
    apportRequisMinimum,
    apportSuffisant,
    empruntNecessaire,
    partFinancee,
    economieAilleurs,
    alertes,
  };
}

export function analyserImmobilier(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const prix = Math.max(0, entree.prix || 0);
  const partTerrain = Math.min(0.9, Math.max(0, entree.partTerrain ?? 0.2));
  const loyerAnnuel = Math.max(0, entree.loyerAnnuel || 0);
  const chargesAnnuelles = Math.max(0, entree.chargesAnnuelles || 0);
  const interetsAnnuels = Math.max(0, entree.interetsAnnuels || 0);
  const remboursementCapital = Math.max(0, entree.remboursementCapital || 0);
  const autresRevenus = Math.max(0, entree.autresRevenus || 0);
  const splitting = !!entree.splitting;

  const frais = fraisAcquisition({
    prix,
    bundesland: entree.bundesland || 'BE',
    courtier: !!entree.courtier,
  });

  /* Seule la construction s'amortit. Les frais d'acquisition suivent la meme
     repartition entre terrain et bati que le prix. */
  const baseAmortissable = (prix + frais.total) * (1 - partTerrain);
  const tauxAmortissement = AMORTISSEMENT_IMMOBILIER[entree.typeAmortissement || 'habitationDepuis1925']
    ?? AMORTISSEMENT_IMMOBILIER.habitationDepuis1925;
  const amortissementAnnuel = baseAmortissable * tauxAmortissement;

  /* Resultat fiscal des revenus fonciers : un deficit reduit l'impot global */
  const resultatFiscal = loyerAnnuel - chargesAnnuelles - interetsAnnuels - amortissementAnnuel;

  const impotSans = impotSelonBareme(autresRevenus, splitting, annee);
  const impotAvec = impotSelonBareme(Math.max(0, autresRevenus + resultatFiscal), splitting, annee);
  const effetImpot = impotAvec - impotSans; /* negatif si deficit */
  const tauxMarginalApplicable = tauxMarginal(autresRevenus, splitting, annee);

  /* Tresorerie reelle : l'amortissement ne sort pas de la poche, le
     remboursement du capital si. */
  const fluxAvantImpot = loyerAnnuel - chargesAnnuelles - interetsAnnuels - remboursementCapital;
  const fluxApresImpot = fluxAvantImpot - effetImpot;

  const rendementBrut = frais.coutTotal > 0 ? loyerAnnuel / frais.coutTotal : 0;
  const rendementNet = frais.coutTotal > 0
    ? (loyerAnnuel - chargesAnnuelles) / frais.coutTotal
    : 0;
  const rendementApresImpot = frais.coutTotal > 0
    ? (loyerAnnuel - chargesAnnuelles - effetImpot) / frais.coutTotal
    : 0;

  const alertes = [];

  if (frais.part > 0) {
    alertes.push({ cle: 'fraisAcquisition', niveau: 'attention', params: { part: frais.part, montant: frais.total } });
  }
  if (resultatFiscal < 0) {
    alertes.push({ cle: 'deficit', niveau: 'positif', params: { montant: -effetImpot, taux: tauxMarginalApplicable } });
  } else if (resultatFiscal > 0) {
    alertes.push({ cle: 'benefice', niveau: 'info', params: { montant: effetImpot } });
  }
  alertes.push({ cle: 'terrain', niveau: 'attention', params: { part: partTerrain } });
  alertes.push({
    cle: 'speculation',
    niveau: 'info',
    params: { ans: SPECULATION_IMMOBILIERE.delaiAns, ansUsage: SPECULATION_IMMOBILIERE.delaiUsagePropreAns },
  });
  if (entree.typeAmortissement === 'degressif') {
    alertes.push({ cle: 'degressif', niveau: 'positif', params: { taux: AMORTISSEMENT_IMMOBILIER.degressif } });
  }
  if (remboursementCapital > 0) {
    alertes.push({ cle: 'tilgung', niveau: 'attention', params: { montant: remboursementCapital } });
  }

  return {
    annee,
    frais,
    baseAmortissable,
    tauxAmortissement,
    amortissementAnnuel,
    resultatFiscal,
    effetImpot,
    tauxMarginalApplicable,
    fluxAvantImpot,
    fluxApresImpot,
    fluxMensuelApresImpot: fluxApresImpot / 12,
    rendementBrut,
    rendementNet,
    rendementApresImpot,
    delaiSpeculation: SPECULATION_IMMOBILIERE.delaiAns,
    alertes,
  };
}
