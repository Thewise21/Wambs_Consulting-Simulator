/* ============================================================================
 * Allocations familiales et abattement pour enfants vivant a l'etranger
 * ----------------------------------------------------------------------------
 * Le § 63 Abs. 1 S. 6 EStG pose un principe de territorialite : un enfant
 * resident hors UE/EEE n'ouvre aucun droit aux allocations, sauf convention de
 * securite sociale. Trois regimes radicalement differents coexistent donc, et
 * la reponse bascule entierement selon le pays de residence de l'enfant.
 *
 * L'abattement fiscal pour enfant, lui, reste accessible — mais reduit selon
 * le groupe de pays.
 * ========================================================================== */
import {
  KINDERGELD_INTERNATIONAL, LAENDERGRUPPEN, FORFAITS, ANNEE_DEFAUT,
} from './parameter.js';
import { impotSelonBareme } from './estTarif.js';

export const REGIMES = ['ue', 'abkommen', 'drittstaat'];

export function regimePourPays(codePays) {
  if (KINDERGELD_INTERNATIONAL.zonesUE.includes(codePays)) return 'ue';
  if (KINDERGELD_INTERNATIONAL.abkommensstaaten.includes(codePays)) return 'abkommen';
  return 'drittstaat';
}

export function analyserKindergeldAusland(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const forfaits = FORFAITS[annee] || FORFAITS[ANNEE_DEFAUT];

  const enfants = Math.max(0, Math.round(entree.enfants || 0));
  const regime = REGIMES.includes(entree.regime) ? entree.regime : 'drittstaat';
  const groupe = LAENDERGRUPPEN[entree.laendergruppe] ? entree.laendergruppe : 4;
  const fraction = LAENDERGRUPPEN[groupe].fraction;

  /* Pour les Etats conventionnes, le droit suppose une activite soumise a
     cotisations en Allemagne (ou ALG / Krankengeld). */
  const activiteCotisante = entree.activiteCotisante !== false;
  /* Prestations deja percues dans le pays de residence de l'enfant (UE) */
  const prestationsEtranger = Math.max(0, entree.prestationsEtranger || 0);

  const revenuImposable = Math.max(0, entree.revenuImposable || 0);
  const splitting = !!entree.splitting;

  /* --- Droit aux allocations ----------------------------------------------- */
  let droitAllocations = false;
  if (regime === 'ue') droitAllocations = true;
  if (regime === 'abkommen') droitAllocations = activiteCotisante;

  const allocationPleine = forfaits.kindergeldMensuel * 12 * enfants;
  /* Dans l'UE, seule la difference avec la prestation etrangere est versee. */
  const allocationVersee = droitAllocations
    ? (regime === 'ue'
      ? Math.max(0, allocationPleine - prestationsEtranger)
      : allocationPleine)
    : 0;

  /* --- Abattement pour enfant ---------------------------------------------- */
  /* § 32 Abs. 6 S. 4 EStG : reduit selon le groupe de pays. */
  const abattementPlein = forfaits.kinderfreibetragTotal * enfants;
  const abattementReduit = abattementPlein * fraction;

  const impotSans = impotSelonBareme(revenuImposable, splitting, annee);
  const impotAvec = impotSelonBareme(Math.max(0, revenuImposable - abattementReduit), splitting, annee);
  const economieAbattement = impotSans - impotAvec;

  /* Comparaison automatique par l'administration : on garde le plus favorable.
     Si l'abattement rapporte plus, la difference est accordee en plus. */
  const abattementPlusFavorable = economieAbattement > allocationVersee;
  const avantageRetenu = Math.max(allocationVersee, economieAbattement);
  const supplementAbattement = Math.max(0, economieAbattement - allocationVersee);

  /* Perte par rapport a une famille vivant entierement en Allemagne */
  const referenceAllemagne = Math.max(
    forfaits.kindergeldMensuel * 12 * enfants,
    impotSans - impotSelonBareme(Math.max(0, revenuImposable - abattementPlein), splitting, annee),
  );
  const ecartAvecAllemagne = Math.max(0, referenceAllemagne - avantageRetenu);

  /* --- Alertes -------------------------------------------------------------- */
  const alertes = [];

  if (regime === 'ue') {
    alertes.push({ cle: 'regimeUE', niveau: 'positif', params: {} });
    if (prestationsEtranger > 0) {
      alertes.push({ cle: 'differenzzahlung', niveau: 'info', params: { montant: prestationsEtranger } });
    }
  }
  if (regime === 'abkommen' && droitAllocations) {
    alertes.push({ cle: 'regimeAbkommen', niveau: 'positif', params: {} });
    alertes.push({ cle: 'montantConventionnel', niveau: 'attention', params: {} });
  }
  if (regime === 'abkommen' && !droitAllocations) {
    alertes.push({ cle: 'abkommenSansActivite', niveau: 'important', params: {} });
  }
  if (regime === 'drittstaat') {
    alertes.push({ cle: 'regimeDrittstaat', niveau: 'important', params: {} });
    alertes.push({ cle: 'macedoine', niveau: 'info', params: {} });
  }
  if (fraction < 1) {
    alertes.push({
      cle: 'abattementReduit',
      niveau: 'attention',
      params: { groupe, part: fraction, montant: abattementPlein - abattementReduit },
    });
  }
  if (abattementPlusFavorable) {
    alertes.push({ cle: 'abattementPlusFavorable', niveau: 'positif', params: { montant: supplementAbattement } });
  }
  if (ecartAvecAllemagne > 0) {
    alertes.push({ cle: 'ecartAllemagne', niveau: 'info', params: { montant: ecartAvecAllemagne } });
  }
  alertes.push({ cle: 'titreSejour', niveau: 'attention', params: {} });
  alertes.push({ cle: 'unterhaltAlternative', niveau: 'positif', params: {} });

  return {
    annee,
    enfants,
    regime,
    groupe,
    fraction,
    droitAllocations,
    allocationPleine,
    allocationVersee,
    allocationMensuelle: allocationVersee / 12,
    abattementPlein,
    abattementReduit,
    economieAbattement,
    abattementPlusFavorable,
    supplementAbattement,
    avantageRetenu,
    referenceAllemagne,
    ecartAvecAllemagne,
    alertes,
  };
}
