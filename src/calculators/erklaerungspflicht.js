/* ============================================================================
 * Suis-je oblige de declarer, et pour quand ?
 * ----------------------------------------------------------------------------
 * Deux questions que tout le monde se pose et que personne ne trouve reunies :
 * l'obligation (§ 46 EStG) et le delai (§ 149 AO). Le delai depend de la
 * presence d'un conseil — argument commercial direct, et vrai avantage pour le
 * contribuable : sept mois de plus.
 * ========================================================================== */
import { DECLARATION, ANNEE_DEFAUT } from './parameter.js';

/* Motifs d'obligation, § 46 Abs. 2 EStG. Chaque cle correspond a une case
 * cochee par l'utilisateur ; l'ordre determine l'affichage. */
export const MOTIFS = [
  'revenusAnnexes',        // Nr. 1 — revenus non salaries ou soumis au taux effectif
  'plusieursEmployeurs',   // Nr. 2 — classe VI
  'classeVouFacteur',      // Nr. 3 — combinaison III/V ou IV avec facteur
  'freibetrag',            // Nr. 4 — abattement inscrit sur la fiche de paie
  'abfindung',             // Nr. 5 — revenus exceptionnels imposes au cinquieme
  'ehegattenWechsel',      // Nr. 6 — divorce ou deces avec remariage
  'independant',           // activite independante ou commerciale
  'capitauxEtrangers',     // revenus de capitaux non soumis a la retenue
  'demandeFinanzamt',      // le centre des impots l'a reclamee
];

/* Motifs pour lesquels declarer est facultatif mais generalement rentable */
export const MOTIFS_VOLONTAIRES = [
  'fraisEleves', 'emploiPartiel', 'changementEmploi', 'mariageRecent', 'dons',
];

function derniereDateDuMois(anneeCible, moisIndex, jour) {
  /* Le 28 fevrier existe toujours ; aucune correction bissextile necessaire
     puisque la loi vise le dernier jour de fevrier. */
  const dernierJourFevrier = moisIndex === 1
    ? (new Date(Date.UTC(anneeCible, 2, 0)).getUTCDate())
    : jour;
  return new Date(Date.UTC(anneeCible, moisIndex, moisIndex === 1 ? dernierJourFevrier : jour));
}

/* Repousse au premier jour ouvre si l'echeance tombe un samedi ou un dimanche
 * (§ 108 Abs. 3 AO). */
function reporterSurJourOuvre(date) {
  const jour = date.getUTCDay();
  if (jour === 6) return new Date(date.getTime() + 2 * 86400000);
  if (jour === 0) return new Date(date.getTime() + 86400000);
  return date;
}

export function analyserErklaerungspflicht(entree) {
  const anneeFiscale = entree.anneeFiscale || (entree.annee || ANNEE_DEFAUT) - 1;
  const motifsChoisis = (entree.motifs || []).filter((m) => MOTIFS.includes(m));
  const volontairesChoisis = (entree.volontaires || []).filter((m) => MOTIFS_VOLONTAIRES.includes(m));
  const avecConseil = !!entree.avecConseil;
  const revenusAnnexesMontant = Math.max(0, entree.revenusAnnexesMontant || 0);

  /* Le seuil de 410 EUR ne joue que pour le motif correspondant */
  const motifsRetenus = motifsChoisis.filter((m) => (
    m !== 'revenusAnnexes' || revenusAnnexesMontant > DECLARATION.seuilRevenusAnnexes
  ));
  const obligatoire = motifsRetenus.length > 0;

  /* --- Delais § 149 AO ------------------------------------------------------ */
  const sansConseil = reporterSurJourOuvre(new Date(Date.UTC(
    anneeFiscale + 1,
    DECLARATION.delaiSansConseil.moisApresAnnee - 1,
    DECLARATION.delaiSansConseil.jour,
  )));
  const avecConseilDate = reporterSurJourOuvre(derniereDateDuMois(
    anneeFiscale + DECLARATION.delaiAvecConseil.anneesApres,
    DECLARATION.delaiAvecConseil.mois - 1,
    DECLARATION.delaiAvecConseil.jour,
  ));

  const echeance = avecConseil ? avecConseilDate : sansConseil;
  const joursSupplementaires = Math.round((avecConseilDate - sansConseil) / 86400000);

  /* Le declarant volontaire dispose de quatre ans (§ 169 AO) */
  const echeanceVolontaire = new Date(Date.UTC(anneeFiscale + 4, 11, 31));

  const alertes = [];

  if (obligatoire) {
    alertes.push({ cle: 'obligatoire', niveau: 'important', params: { nombre: motifsRetenus.length } });
    alertes.push({ cle: 'retard', niveau: 'attention', params: { part: DECLARATION.majorationParMoisPart, minimum: DECLARATION.majorationParMoisMinimum } });
  } else if (volontairesChoisis.length > 0) {
    alertes.push({ cle: 'volontaireRentable', niveau: 'positif', params: { nombre: volontairesChoisis.length } });
  } else {
    alertes.push({ cle: 'aucuneObligation', niveau: 'info', params: {} });
  }

  if (!obligatoire) {
    alertes.push({ cle: 'quatreAns', niveau: 'positif', params: {} });
  }
  if (!avecConseil && obligatoire) {
    alertes.push({ cle: 'gainDelai', niveau: 'positif', params: { jours: joursSupplementaires } });
  }
  if (motifsChoisis.includes('revenusAnnexes') && revenusAnnexesMontant <= DECLARATION.seuilRevenusAnnexes) {
    alertes.push({ cle: 'sousSeuil', niveau: 'info', params: { seuil: DECLARATION.seuilRevenusAnnexes } });
  }
  if (motifsChoisis.includes('abfindung')) {
    alertes.push({ cle: 'abfindung', niveau: 'important', params: {} });
  }

  return {
    anneeFiscale,
    obligatoire,
    motifsRetenus,
    volontairesChoisis,
    avecConseil,
    echeance,
    echeanceSansConseil: sansConseil,
    echeanceAvecConseil: avecConseilDate,
    echeanceVolontaire,
    joursSupplementaires,
    seuilRevenusAnnexes: DECLARATION.seuilRevenusAnnexes,
    alertes,
  };
}
