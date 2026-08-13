/* ============================================================================
 * Tarif de l'impot sur le revenu allemand — § 32a EStG
 * + Solidaritatszuschlag (§ 3 SolZG) + Kirchensteuer + Progressionsvorbehalt
 * Toutes les constantes proviennent de calculators/parameter.js
 * ========================================================================== */
import { TARIF, SOLI, KIRCHENSTEUER_TAUX, ANNEE_DEFAUT } from './parameter.js';

function parametresTarif(annee) {
  return TARIF[annee] || TARIF[ANNEE_DEFAUT];
}

/* Impot du bareme de base (Grundtabelle).
 * § 32a Abs. 1 S. 2 : le revenu imposable est arrondi a l'euro inferieur,
 * le montant d'impot obtenu egalement. */
export function einkommensteuer(zvE, annee = ANNEE_DEFAUT) {
  const p = parametresTarif(annee);
  const x = Math.floor(Math.max(0, zvE));

  /* Zone 1 — Grundfreibetrag */
  if (x <= p.grundfreibetrag) return 0;

  /* Zone 2 — premiere zone de progression */
  if (x <= p.zone2Fin) {
    const y = (x - p.grundfreibetrag) / 10000;
    return Math.floor((p.a2 * y + p.b2) * y);
  }

  /* Zone 3 — seconde zone de progression */
  if (x <= p.zone3Fin) {
    const z = (x - p.zone2Fin) / 10000;
    return Math.floor((p.a3 * z + p.b3) * z + p.c3);
  }

  /* Zone 4 — taux proportionnel de 42 % */
  if (x <= p.zone4Fin) return Math.floor(0.42 * x - p.c4);

  /* Zone 5 — taux proportionnel de 45 % (Reichensteuer) */
  return Math.floor(0.45 * x - p.c5);
}

/* Bareme du splitting (Zusammenveranlagung) — § 32a Abs. 5 EStG */
export function einkommensteuerSplitting(zvE, annee = ANNEE_DEFAUT) {
  return 2 * einkommensteuer(zvE / 2, annee);
}

/* Choix du bareme selon le type d'imposition */
export function impotSelonBareme(zvE, splitting, annee = ANNEE_DEFAUT) {
  return splitting ? einkommensteuerSplitting(zvE, annee) : einkommensteuer(zvE, annee);
}

/* Solidaritatszuschlag avec franchise et zone d'allegement (§ 4 SolZG) */
export function solidaritaetszuschlag(impot, splitting = false, annee = ANNEE_DEFAUT) {
  const p = SOLI[annee] || SOLI[ANNEE_DEFAUT];
  const franchise = splitting ? p.franchiseSplitting : p.franchise;
  if (impot <= franchise) return 0;
  return Math.min(p.taux * impot, p.tauxZoneAllegement * (impot - franchise));
}

/* Kirchensteuer — assise sur l'impot corrige des abattements pour enfants */
export function kirchensteuer(impotCorrige, bundesland) {
  const taux = KIRCHENSTEUER_TAUX[bundesland] ?? KIRCHENSTEUER_TAUX.DEFAUT;
  return Math.max(0, impotCorrige) * taux;
}

/* Taux moyen d'imposition */
export function tauxMoyen(zvE, splitting = false, annee = ANNEE_DEFAUT) {
  if (zvE <= 0) return 0;
  return impotSelonBareme(zvE, splitting, annee) / zvE;
}

/* Taux marginal — derive numeriquement sur 100 EUR */
export function tauxMarginal(zvE, splitting = false, annee = ANNEE_DEFAUT) {
  const pas = 100;
  const bas = impotSelonBareme(zvE, splitting, annee);
  const haut = impotSelonBareme(zvE + pas, splitting, annee);
  return (haut - bas) / pas;
}

/* ---------------------------------------------------------------------------
 * Progressionsvorbehalt — § 32b EStG
 * Les revenus exoneres (revenus etrangers avant l'arrivee, Elterngeld,
 * ALG I, Kurzarbeitergeld...) ne sont pas imposes mais relevent le taux
 * applicable au revenu imposable en Allemagne.
 * ------------------------------------------------------------------------- */
export function progressionsvorbehalt(zvE, revenusExoneres, splitting = false, annee = ANNEE_DEFAUT) {
  const impotSans = impotSelonBareme(zvE, splitting, annee);

  if (!revenusExoneres || revenusExoneres <= 0 || zvE <= 0) {
    return {
      impotSans,
      impotAvec: impotSans,
      supplement: 0,
      tauxSpecial: zvE > 0 ? impotSans / zvE : 0,
      tauxNormal: zvE > 0 ? impotSans / zvE : 0,
    };
  }

  const base = zvE + revenusExoneres;
  const tauxSpecial = impotSelonBareme(base, splitting, annee) / base;
  const impotAvec = Math.floor(tauxSpecial * zvE);

  return {
    impotSans,
    impotAvec,
    supplement: impotAvec - impotSans,
    tauxSpecial,
    tauxNormal: impotSans / zvE,
  };
}
