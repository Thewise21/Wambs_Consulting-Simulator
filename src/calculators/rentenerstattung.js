/* ============================================================================
 * Retour au pays : se faire rembourser ses cotisations ou conserver ses droits
 * (§ 210 SGB VI)
 * ----------------------------------------------------------------------------
 * Decision irreversible et mal comprise. Le remboursement ne porte que sur la
 * part salariale — la part patronale est perdue — et il efface definitivement
 * tous les droits acquis. Conserver suppose d'avoir atteint cinq ans de
 * cotisation ; la pension est alors versee a l'etranger, a vie.
 *
 * Le simulateur chiffre les deux voies et donne le point d'equilibre : au bout
 * de combien d'annees de pension le fait d'avoir attendu devient payant.
 * ========================================================================== */
import { RENTE, ANNEE_DEFAUT } from './parameter.js';

export function analyserRentenerstattung(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const p = RENTE[annee] || RENTE[ANNEE_DEFAUT];

  const moisCotises = Math.max(0, Math.round(entree.moisCotises || 0));
  const salaireMoyenAnnuel = Math.max(0, entree.salaireMoyenAnnuel || 0);
  const age = Math.min(70, Math.max(16, entree.age || 35));
  const moisDepuisDepart = Math.max(0, Math.round(entree.moisDepuisDepart || 0));
  /* Les ressortissants de l'UE et les personnes ayant droit a la cotisation
     volontaire ne peuvent pas demander le remboursement. */
  const ressortissantUE = !!entree.ressortissantUE;

  /* --- Droits acquis -------------------------------------------------------- */
  const wartezeitAtteinte = moisCotises >= RENTE.wartezeitMoisRetraite;
  const anneesCotisees = moisCotises / 12;

  /* Points de retraite : un point par annee au revenu moyen */
  const pointsParAn = p.durchschnittsentgelt > 0
    ? salaireMoyenAnnuel / p.durchschnittsentgelt
    : 0;
  const points = pointsParAn * anneesCotisees;
  const pensionMensuelle = wartezeitAtteinte ? points * p.rentenwert : 0;
  const pensionAnnuelle = pensionMensuelle * 12;

  /* --- Remboursement § 210 -------------------------------------------------- */
  /* Seule la part salariale est restituee, soit la moitie du taux global. */
  const cotisationsTotales = salaireMoyenAnnuel * anneesCotisees * p.tauxRV;
  const remboursement = cotisationsTotales / 2;
  const partPerdue = cotisationsTotales - remboursement;

  const delaiRespecte = moisDepuisDepart >= RENTE.delaiErstattungMois;
  const moisRestants = Math.max(0, RENTE.delaiErstattungMois - moisDepuisDepart);
  /* Le remboursement est en principe ferme a qui peut encore cotiser
     volontairement — c'est le cas des ressortissants de l'UE. */
  const remboursementPossible = !ressortissantUE && delaiRespecte;

  /* --- Comparaison ---------------------------------------------------------- */
  const anneesJusquaRetraite = Math.max(0, RENTE.ageRetraiteReference - age);
  const anneesPourEgaler = pensionAnnuelle > 0 ? remboursement / pensionAnnuelle : null;
  /* Esperance de perception approchee : 18 ans de pension apres 67 ans */
  const anneesPerceptionReference = 18;
  const pensionCumulee = pensionAnnuelle * anneesPerceptionReference;
  const avantagePension = pensionCumulee - remboursement;

  let recommandation;
  if (!remboursementPossible) recommandation = 'conserver';
  else if (!wartezeitAtteinte) recommandation = 'rembourser';
  else recommandation = avantagePension > 0 ? 'conserver' : 'rembourser';

  /* --- Alertes -------------------------------------------------------------- */
  const alertes = [];

  if (ressortissantUE) {
    alertes.push({ cle: 'ressortissantUE', niveau: 'important', params: {} });
  }
  if (!delaiRespecte && !ressortissantUE) {
    alertes.push({ cle: 'delaiNonEcoule', niveau: 'attention', params: { nombre: moisRestants } });
  }
  if (wartezeitAtteinte) {
    alertes.push({
      cle: 'wartezeitAtteinte',
      niveau: 'positif',
      params: { montant: pensionMensuelle, nombre: RENTE.wartezeitMoisRetraite / 12 },
    });
  } else {
    alertes.push({
      cle: 'wartezeitManquante',
      niveau: 'attention',
      params: { nombre: Math.ceil((RENTE.wartezeitMoisRetraite - moisCotises)) },
    });
  }
  alertes.push({ cle: 'partPatronalePerdue', niveau: 'important', params: { montant: partPerdue } });
  alertes.push({ cle: 'irreversible', niveau: 'important', params: {} });
  if (wartezeitAtteinte && anneesPourEgaler !== null) {
    alertes.push({
      cle: 'pointEquilibre',
      niveau: 'info',
      params: { nombre: Math.round(anneesPourEgaler * 10) / 10 },
    });
  }
  alertes.push({ cle: 'versementEtranger', niveau: 'positif', params: {} });
  alertes.push({ cle: 'accordBilateral', niveau: 'info', params: {} });

  return {
    annee,
    moisCotises,
    anneesCotisees,
    wartezeitAtteinte,
    points,
    pensionMensuelle,
    pensionAnnuelle,
    cotisationsTotales,
    remboursement,
    partPerdue,
    delaiRespecte,
    moisRestants,
    remboursementPossible,
    anneesJusquaRetraite,
    anneesPourEgaler,
    anneesPerceptionReference,
    pensionCumulee,
    avantagePension,
    recommandation,
    alertes,
  };
}
