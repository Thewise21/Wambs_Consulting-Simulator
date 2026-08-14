/* ============================================================================
 * Indemnite de depart et regle du cinquieme (§ 34 Abs. 1 EStG)
 * ----------------------------------------------------------------------------
 * L'indemnite est imposee comme si elle etait percue sur cinq ans : on calcule
 * l'impot sur un cinquieme, on prend l'ecart avec l'impot sans indemnite, et
 * on le multiplie par cinq.
 *
 * Point souvent ignore : depuis 2025 l'employeur n'applique plus cette regle
 * au prelevement mensuel. L'indemnite est d'abord surimposee sur la fiche de
 * paie, et l'avantage n'est recupere qu'a la declaration annuelle.
 * ========================================================================== */
import { ABFINDUNG, ANNEE_DEFAUT } from './parameter.js';
import { impotSelonBareme, solidaritaetszuschlag } from './estTarif.js';

export function analyserAbfindung(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const splitting = !!entree.splitting;

  const indemnite = Math.max(0, entree.indemnite || 0);
  const revenuRestant = Math.max(0, entree.revenuRestant || 0);
  const versementAnneeSuivante = !!entree.versementAnneeSuivante;
  const revenuAnneeSuivante = Math.max(0, entree.revenuAnneeSuivante || 0);

  /* Base de reference : le revenu de l'annee sans l'indemnite */
  const base = versementAnneeSuivante ? revenuAnneeSuivante : revenuRestant;

  const impotBase = impotSelonBareme(base, splitting, annee);

  /* Imposition ordinaire : tout est ajoute au revenu de l'annee */
  const impotOrdinaire = impotSelonBareme(base + indemnite, splitting, annee);
  const chargeOrdinaire = impotOrdinaire - impotBase;

  /* Regle du cinquieme : cinq fois l'ecart sur un cinquieme de l'indemnite */
  const impotUnCinquieme = impotSelonBareme(base + indemnite / ABFINDUNG.diviseur, splitting, annee);
  const chargeCinquieme = (impotUnCinquieme - impotBase) * ABFINDUNG.diviseur;

  /* La regle ne peut jamais desavantager : l'administration retient le plus
     favorable des deux (§ 34 Abs. 1 EStG). */
  const chargeRetenue = Math.min(chargeOrdinaire, chargeCinquieme);
  const economie = chargeOrdinaire - chargeRetenue;

  const soliOrdinaire = solidaritaetszuschlag(impotBase + chargeOrdinaire, splitting, annee)
    - solidaritaetszuschlag(impotBase, splitting, annee);
  const soliRetenu = solidaritaetszuschlag(impotBase + chargeRetenue, splitting, annee)
    - solidaritaetszuschlag(impotBase, splitting, annee);

  const chargeTotale = chargeRetenue + soliRetenu;
  const netIndemnite = indemnite - chargeTotale;
  const tauxEffectif = indemnite > 0 ? chargeTotale / indemnite : 0;

  /* Decalage au 1er janvier : la meme indemnite dans une annee sans salaire
     supporte un taux nettement plus faible. */
  const impotBaseDecale = impotSelonBareme(revenuAnneeSuivante, splitting, annee);
  const impotCinquiemeDecale = impotSelonBareme(
    revenuAnneeSuivante + indemnite / ABFINDUNG.diviseur, splitting, annee,
  );
  const chargeDecalee = Math.min(
    impotSelonBareme(revenuAnneeSuivante + indemnite, splitting, annee) - impotBaseDecale,
    (impotCinquiemeDecale - impotBaseDecale) * ABFINDUNG.diviseur,
  );
  const gainDecalage = chargeRetenue - chargeDecalee;

  const alertes = [];

  if (economie > 0) {
    alertes.push({ cle: 'cinquiemeApplique', niveau: 'positif', params: { montant: economie } });
  } else {
    alertes.push({ cle: 'cinquiemeSansEffet', niveau: 'attention', params: {} });
  }
  alertes.push({ cle: 'plusDePrelevement', niveau: 'important', params: { annee: ABFINDUNG.appliqueeAuPrelevementDepuis } });
  alertes.push({ cle: 'declarationObligatoire', niveau: 'important', params: {} });
  if (!versementAnneeSuivante && gainDecalage > 0) {
    alertes.push({ cle: 'decalage', niveau: 'positif', params: { montant: gainDecalage } });
  }
  alertes.push({ cle: 'zusammenballung', niveau: 'attention', params: {} });
  alertes.push({ cle: 'sozialversicherung', niveau: 'info', params: {} });

  return {
    annee,
    indemnite,
    base,
    chargeOrdinaire,
    chargeCinquieme,
    chargeRetenue,
    economie,
    soliOrdinaire,
    soliRetenu,
    chargeTotale,
    netIndemnite,
    tauxEffectif,
    chargeDecalee,
    gainDecalage,
    alertes,
  };
}
