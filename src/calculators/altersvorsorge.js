/* ============================================================================
 * Deficit de retraite et comparaison des enveloppes de prevoyance
 * ----------------------------------------------------------------------------
 * Deux chiffres interessent le prospect : combien il lui manquera, et ce que
 * l'Etat lui rembourse s'il epargne. Rurup joue par la deduction fiscale,
 * Riester par les primes ; la comparaison n'a de sens qu'apres impot.
 * ========================================================================== */
import { PREVOYANCE, ANNEE_DEFAUT } from './parameter.js';
import { impotSelonBareme, tauxMarginal } from './estTarif.js';

export function analyserAltersvorsorge(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const p = PREVOYANCE[annee] || PREVOYANCE[ANNEE_DEFAUT];

  const brutAnnuel = Math.max(0, entree.brutAnnuel || 0);
  const age = Math.min(70, Math.max(16, entree.age || 40));
  const ageRetraite = Math.min(75, Math.max(age + 1, entree.ageRetraite || 67));
  const anneesRestantes = ageRetraite - age;
  const splitting = !!entree.splitting;
  const enfants = Math.max(0, Math.round(entree.enfants || 0));
  const epargneAnnuelle = Math.max(0, entree.epargneAnnuelle || 0);

  /* --- Pension legale estimee ---------------------------------------------- */
  /* Approximation volontairement transparente : le niveau de pension rapporte
     au dernier salaire brut. Le releve de carriere reste la seule source
     fiable — c'est dit a l'utilisateur. */
  const renteBruteAnnuelle = brutAnnuel * p.niveauRenteBrut;
  const renteBruteMensuelle = renteBruteAnnuelle / 12;

  /* Part imposable de la pension selon l'annee de depart */
  const anneeDepart = annee + anneesRestantes;
  const partImposable = Math.min(
    1,
    p.partImposableRente + p.partImposableProgressionAnnuelle * (anneeDepart - annee),
  );
  const renteImposable = renteBruteAnnuelle * partImposable;
  const impotSurRente = impotSelonBareme(renteImposable, splitting, annee);
  const renteNetteAnnuelle = renteBruteAnnuelle - impotSurRente;

  /* --- Deficit -------------------------------------------------------------- */
  const besoinPart = Math.min(1, Math.max(0, entree.besoinPart ?? 0.8));
  const besoinAnnuel = brutAnnuel * besoinPart;
  const deficitAnnuel = Math.max(0, besoinAnnuel - renteNetteAnnuelle);
  const deficitMensuel = deficitAnnuel / 12;

  /* --- Rurup : deduction integrale, plafonnee ------------------------------ */
  const plafondRuerup = splitting ? p.ruerupPlafondCouple : p.ruerupPlafond;
  const versementRuerup = Math.min(epargneAnnuelle, plafondRuerup);
  const tauxMarginalActuel = tauxMarginal(
    Math.max(0, brutAnnuel - 1230 - 36), splitting, annee,
  );
  const economieRuerup = versementRuerup * tauxMarginalActuel;
  const effortNetRuerup = versementRuerup - economieRuerup;

  /* --- Riester : primes, avec plafond de deduction -------------------------- */
  const zulageEnfants = enfants * p.riesterZulageEnfant;
  const zulages = p.riesterZulageBase + zulageEnfants;
  /* Versement propre minimal pour toucher la prime entiere */
  const versementMinimal = Math.max(60, brutAnnuel * p.riesterPartMinimale - zulages);
  const versementRiester = Math.min(
    Math.max(epargneAnnuelle, 0),
    p.riesterPlafondSonderausgaben,
  );
  /* L'administration compare l'avantage fiscal aux primes et retient le plus
     favorable (Guenstigerpruefung, § 10a EStG). */
  const avantageFiscalRiester = versementRiester * tauxMarginalActuel;
  const avantageRiester = Math.max(zulages, avantageFiscalRiester);
  const effortNetRiester = Math.max(0, versementRiester - avantageRiester);

  /* --- Capital constitue ---------------------------------------------------- */
  const rendement = Math.max(0, entree.rendement ?? 0.03);
  const capitaliser = (versement) => {
    if (versement <= 0 || anneesRestantes <= 0) return 0;
    if (rendement === 0) return versement * anneesRestantes;
    return versement * ((Math.pow(1 + rendement, anneesRestantes) - 1) / rendement);
  };
  const capitalRuerup = capitaliser(versementRuerup);
  const capitalRiester = capitaliser(versementRiester);

  const alertes = [];

  if (deficitAnnuel > 0) {
    alertes.push({ cle: 'deficit', niveau: 'important', params: { montant: deficitMensuel } });
  } else {
    alertes.push({ cle: 'pasDeDeficit', niveau: 'positif', params: {} });
  }
  alertes.push({ cle: 'estimationRente', niveau: 'attention', params: { part: p.niveauRenteBrut } });
  alertes.push({ cle: 'impositionRente', niveau: 'attention', params: { part: partImposable, annee: anneeDepart } });
  if (versementRuerup > 0) {
    alertes.push({ cle: 'ruerup', niveau: 'positif', params: { montant: economieRuerup, plafond: plafondRuerup } });
  }
  if (epargneAnnuelle > plafondRuerup) {
    alertes.push({ cle: 'plafondRuerupAtteint', niveau: 'info', params: { plafond: plafondRuerup } });
  }
  if (enfants > 0) {
    alertes.push({ cle: 'riesterEnfants', niveau: 'positif', params: { montant: zulageEnfants, enfants } });
  }
  alertes.push({ cle: 'ruerupIrrevocable', niveau: 'attention', params: {} });

  return {
    annee,
    anneesRestantes,
    anneeDepart,
    renteBruteAnnuelle,
    renteBruteMensuelle,
    partImposable,
    impotSurRente,
    renteNetteAnnuelle,
    renteNetteMensuelle: renteNetteAnnuelle / 12,
    besoinAnnuel,
    deficitAnnuel,
    deficitMensuel,
    tauxMarginalActuel,
    ruerup: {
      versement: versementRuerup,
      plafond: plafondRuerup,
      economie: economieRuerup,
      effortNet: effortNetRuerup,
      capital: capitalRuerup,
    },
    riester: {
      versement: versementRiester,
      zulages,
      versementMinimal,
      avantage: avantageRiester,
      effortNet: effortNetRiester,
      capital: capitalRiester,
    },
    alertes,
  };
}
