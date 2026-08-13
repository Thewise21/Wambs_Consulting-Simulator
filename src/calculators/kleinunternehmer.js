/* ============================================================================
 * Kleinunternehmerregelung (§ 19 UStG) contre regime normal
 * ----------------------------------------------------------------------------
 * Le raisonnement tient en deux effets opposes :
 *
 *   1. Vers les particuliers, le Kleinunternehmer gagne : a prix affiche egal,
 *      il conserve la TVA que son concurrent doit reverser.
 *   2. Vers les professionnels, il perd : le client recupere la TVA de toute
 *      facon, mais lui ne recupere pas celle de ses achats.
 *
 * L'arbitrage depend donc de la part de clientele particuliere et du volume
 * d'achats grevés de TVA. C'est exactement ce que ce module chiffre.
 * ========================================================================== */
import { KLEINUNTERNEHMER, UMSATZSTEUER, ANNEE_DEFAUT } from './parameter.js';

export function analyserKleinunternehmer(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const p = KLEINUNTERNEHMER[annee] || KLEINUNTERNEHMER[ANNEE_DEFAUT];

  const umsatz = Math.max(0, entree.umsatz || 0);
  const vorjahresumsatz = Math.max(0, entree.vorjahresumsatz || 0);
  const partParticuliers = Math.min(1, Math.max(0, entree.partParticuliers ?? 0.5));
  const partProfessionnels = 1 - partParticuliers;
  const achats = Math.max(0, entree.achats || 0);
  const investissement = Math.max(0, entree.investissement || 0);
  const satz = entree.satzReduit ? UMSATZSTEUER.ermaessigterSatz : UMSATZSTEUER.regelsatz;
  const premiereAnnee = !!entree.premiereAnnee;

  /* --- Eligibilite -------------------------------------------------------- */
  /* La premiere annee, seul le plafond de l'annee en cours compte. */
  const respecteVorjahr = premiereAnnee || vorjahresumsatz <= p.grenzeVorjahr;
  const respecteLaufend = umsatz <= p.grenzeLaufendesJahr;
  const eligible = respecteVorjahr && respecteLaufend;

  /* --- Recettes ------------------------------------------------------------ */
  /* Kleinunternehmer : il encaisse le prix, sans TVA a reverser. */
  const recettesKU = umsatz;

  /* Regime normal : vers les professionnels le prix hors taxe est maintenu et
     la TVA s'ajoute ; vers les particuliers, le prix affiche reste le meme et
     la TVA est prelevee dessus. */
  const recettesRegime = umsatz * partProfessionnels
    + (umsatz * partParticuliers) / (1 + satz);
  const tvaCollecteeSurParticuliers = umsatz * partParticuliers - (umsatz * partParticuliers) / (1 + satz);

  /* --- Depenses ------------------------------------------------------------ */
  /* Sans droit a deduction, la TVA d'amont est un cout definitif. */
  const depensesTotales = achats + investissement;
  const depensesKU = depensesTotales * (1 + satz);
  const depensesRegime = depensesTotales;
  const vorsteuerPerdue = depensesTotales * satz;

  /* --- Resultats ----------------------------------------------------------- */
  const resultatKU = recettesKU - depensesKU;
  const resultatRegime = recettesRegime - depensesRegime;
  const difference = resultatRegime - resultatKU;

  /* Part de clientele particuliere a laquelle les deux regimes s'equivalent.
     Au-dela, la franchise devient plus avantageuse. */
  const gainParPartParticuliers = umsatz - umsatz / (1 + satz);
  const seuilBascule = gainParPartParticuliers > 0
    ? Math.min(1, Math.max(0, vorsteuerPerdue / gainParPartParticuliers))
    : null;

  /* --- Alertes -------------------------------------------------------------- */
  const alertes = [];

  if (!respecteVorjahr) {
    alertes.push({
      cle: 'grenzeVorjahrDepassee',
      niveau: 'important',
      params: { limite: p.grenzeVorjahr, montant: vorjahresumsatz },
    });
  }
  if (!respecteLaufend) {
    alertes.push({
      cle: 'grenzeLaufendDepassee',
      niveau: 'important',
      params: { limite: p.grenzeLaufendesJahr },
    });
  }
  if (eligible && umsatz > p.grenzeVorjahr) {
    /* Cas frequent et mal compris : on reste franchise cette annee, mais on
       bascule obligatoirement l'annee suivante. */
    alertes.push({
      cle: 'basculeAnneeProchaine',
      niveau: 'attention',
      params: { limite: p.grenzeVorjahr, montant: umsatz },
    });
  }
  if (investissement > 0) {
    alertes.push({
      cle: 'investissement',
      niveau: 'info',
      params: { montant: investissement * satz },
    });
  }
  if (eligible && difference > 0) {
    alertes.push({ cle: 'renonciationInteressante', niveau: 'positif', params: { montant: difference } });
  }
  if (eligible && difference <= 0) {
    alertes.push({ cle: 'franchiseInteressante', niveau: 'positif', params: { montant: -difference } });
  }
  alertes.push({ cle: 'bindung', niveau: 'attention', params: { annees: p.bindungJahre } });
  if (partProfessionnels > 0.5) {
    alertes.push({ cle: 'clienteleProfessionnelle', niveau: 'info', params: {} });
  }
  alertes.push({ cle: 'chargeAdministrative', niveau: 'info', params: {} });

  return {
    annee,
    eligible,
    respecteVorjahr,
    respecteLaufend,
    limites: { vorjahr: p.grenzeVorjahr, laufend: p.grenzeLaufendesJahr, bindung: p.bindungJahre },
    satz,
    kleinunternehmer: { recettes: recettesKU, depenses: depensesKU, resultat: resultatKU },
    regimeNormal: {
      recettes: recettesRegime,
      depenses: depensesRegime,
      resultat: resultatRegime,
      tvaReversee: tvaCollecteeSurParticuliers,
      vorsteuerRecuperee: vorsteuerPerdue,
    },
    difference,
    recommandation: difference > 0 ? 'regelbesteuerung' : 'kleinunternehmer',
    seuilBascule,
    vorsteuerPerdue,
    alertes,
  };
}
