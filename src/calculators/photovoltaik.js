/* ============================================================================
 * Photovoltaique : exoneration § 3 Nr. 72 EStG et taux zero § 12 Abs. 3 UStG
 * ----------------------------------------------------------------------------
 * Depuis 2023 une petite installation est doublement privilegiee : ses revenus
 * echappent a l'impot sur le revenu, et son achat n'est pas greve de TVA.
 * L'interet du simulateur est de dire ou passe la limite — et ce qui arrive
 * juste au-dessus.
 * ========================================================================== */
import { PHOTOVOLTAIQUE, UMSATZSTEUER, ANNEE_DEFAUT } from './parameter.js';

export function analyserPhotovoltaique(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const p = PHOTOVOLTAIQUE;

  const puissance = Math.max(0, entree.puissanceKwp || 0);
  const unites = Math.max(1, Math.round(entree.unites || 1));
  const autresInstallations = Math.max(0, entree.autresInstallationsKwp || 0);

  const investissement = Math.max(0, entree.investissement || 0);
  const production = puissance * (entree.productionParKwp ?? p.productionParKwpDefaut);
  const partAutoconsommation = Math.min(1, Math.max(0, entree.partAutoconsommation ?? p.partAutoconsommationDefaut));
  const tarifInjection = Math.max(0, entree.tarifInjection ?? 0.08);
  const prixElectricite = Math.max(0, entree.prixElectricite ?? 0.35);

  /* --- Exoneration d'impot sur le revenu ---------------------------------- */
  const plafondObjet = p.limiteParUniteKwp * unites;
  const totalContribuable = puissance + autresInstallations;

  const respecteObjet = puissance <= plafondObjet;
  const respecteContribuable = totalContribuable <= p.limiteParContribuableKwp;
  const exonere = respecteObjet && respecteContribuable;

  /* --- Recettes annuelles -------------------------------------------------- */
  const kwhInjectes = production * (1 - partAutoconsommation);
  const kwhAutoconsommes = production * partAutoconsommation;
  const recettesInjection = kwhInjectes * tarifInjection;
  const economieElectricite = kwhAutoconsommes * prixElectricite;
  const beneficeAnnuel = recettesInjection + economieElectricite;

  /* Si l'exoneration ne s'applique pas, les revenus sont imposables au taux
     marginal de l'exploitant — fourni par l'appelant. */
  const tauxMarginal = Math.min(0.45, Math.max(0, entree.tauxMarginal ?? 0.3));
  const impotSiImposable = exonere ? 0 : (recettesInjection + economieElectricite) * tauxMarginal;

  /* --- TVA ------------------------------------------------------------------ */
  /* Le taux zero du § 12 Abs. 3 UStG s'applique a la livraison et a
     l'installation sur un batiment d'habitation : la TVA ne se recupere pas,
     elle n'est tout simplement pas facturee. */
  const tvaEconomisee = investissement * UMSATZSTEUER.regelsatz;

  const beneficeApresImpot = beneficeAnnuel - impotSiImposable;
  const amortissementAnnees = beneficeApresImpot > 0 ? investissement / beneficeApresImpot : null;

  /* --- Alertes ------------------------------------------------------------- */
  const alertes = [];

  if (exonere) {
    alertes.push({
      cle: 'exonere',
      niveau: 'positif',
      params: { limite: plafondObjet, montant: beneficeAnnuel },
    });
  }
  if (!respecteObjet) {
    alertes.push({ cle: 'depasseObjet', niveau: 'important', params: { limite: plafondObjet, puissance } });
  }
  if (!respecteContribuable) {
    alertes.push({
      cle: 'depasseContribuable',
      niveau: 'important',
      params: { limite: p.limiteParContribuableKwp, total: totalContribuable },
    });
  }
  alertes.push({ cle: 'tauxZero', niveau: 'positif', params: { montant: tvaEconomisee } });
  alertes.push({ cle: 'kleinunternehmer', niveau: 'info', params: {} });
  if (!exonere) {
    alertes.push({ cle: 'euerRequise', niveau: 'attention', params: {} });
  }
  alertes.push({ cle: 'gewerbeanmeldung', niveau: 'info', params: {} });

  return {
    annee,
    puissance,
    plafondObjet,
    totalContribuable,
    exonere,
    respecteObjet,
    respecteContribuable,
    production,
    kwhInjectes,
    kwhAutoconsommes,
    recettesInjection,
    economieElectricite,
    beneficeAnnuel,
    impotSiImposable,
    beneficeApresImpot,
    tvaEconomisee,
    amortissementAnnees,
    alertes,
  };
}
