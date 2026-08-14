/* ============================================================================
 * Calculateur d'honoraires selon la StBVV
 * (Steuerberatervergutungsverordnung — bareme legal des experts-comptables
 *  et conseillers fiscaux allemands)
 * ----------------------------------------------------------------------------
 * Chaque prestation cite sa base legale, sa table de reference et son cadre
 * d'honoraires en dixiemes. Le resultat est une fourchette : honoraire
 * minimal, honoraire moyen (Mittelgebuhr) et honoraire maximal.
 *
 * Le devis reste indicatif : la determination de l'honoraire concret releve du
 * § 11 StBVV (appreciation d'ensemble : importance, difficulte, risque).
 * ========================================================================== */
import {
  TABELLE_A, TABELLE_A_EXTRAPOLATION,
  TABELLE_B, TABELLE_B_EXTRAPOLATION,
  TABELLE_C, TABELLE_C_EXTRAPOLATION,
  STBVV_DIVERS,
} from './parameter.js';

const TABLES = {
  A: { valeurs: TABELLE_A, extrapolation: TABELLE_A_EXTRAPOLATION },
  B: { valeurs: TABELLE_B, extrapolation: TABELLE_B_EXTRAPOLATION },
  C: { valeurs: TABELLE_C, extrapolation: TABELLE_C_EXTRAPOLATION },
};

/* Honoraire plein (10/10) pour une valeur d'objet donnee */
export function gebuehrPleine(gegenstandswert, nomTable) {
  const table = TABLES[nomTable];
  if (!table) return 0;

  const gw = Math.max(0, gegenstandswert || 0);
  const { valeurs, extrapolation } = table;

  /* En dessous ou dans la table : premiere tranche dont la borne est atteinte */
  for (const [borne, montant] of valeurs) {
    if (gw <= borne) return montant;
  }

  /* Au-dela de la derniere ligne : tranches entamees successives */
  const [derniereBorne, dernierMontant] = valeurs[valeurs.length - 1];
  let montant = dernierMontant;
  let position = derniereBorne;

  for (const palier of extrapolation) {
    if (position >= gw) break;
    const plafond = Math.min(gw, palier.jusqua);
    if (plafond <= position) continue;
    montant += Math.ceil((plafond - position) / palier.pas) * palier.montant;
    position = plafond;
  }
  return montant;
}

/* --- Catalogue des prestations ------------------------------------------- *
 * min / max : cadre legal exprime en fraction d'une gebuehr pleine
 * frequence : nombre de fois par an
 * ------------------------------------------------------------------------- */
export const PRESTATIONS = {
  einkommensteuer: {
    paragraphe: '§ 24 Abs. 1 Nr. 1 StBVV',
    table: 'A',
    min: 1 / 10,
    max: 6 / 10,
    frequence: () => 1,
    gegenstandswert: (e) => Math.max(e.sommeEinkuenfte || 0, 8000),
    baseLibelle: 'sommeEinkuenfte',
  },
  anlageV: {
    paragraphe: '§ 27 Abs. 1 StBVV',
    table: 'A',
    min: 1 / 20,
    max: 12 / 20,
    frequence: () => 1,
    gegenstandswert: (e) => Math.max(e.mieteinnahmen || 0, e.werbungskosten || 0, 8000),
    baseLibelle: 'mieteinnahmen',
  },
  euer: {
    paragraphe: '§ 25 Abs. 1 StBVV',
    table: 'B',
    min: 5 / 10,
    max: 30 / 10,
    frequence: () => 1,
    gegenstandswert: (e) => Math.max(e.jahresumsatz || 0, e.betriebsausgaben || 0, 17500),
    baseLibelle: 'jahresumsatz',
  },
  jahresabschluss: {
    paragraphe: '§ 35 Abs. 1 Nr. 1a StBVV',
    table: 'B',
    min: 10 / 10,
    max: 40 / 10,
    frequence: () => 1,
    /* § 35 Abs. 2 : moyenne entre le total du bilan corrige et la production
     * annuelle de l'entreprise. Contrairement au § 25, ce paragraphe ne fixe
     * AUCUNE valeur minimale : appliquer les 17.500 EUR de l'EUER ici
     * surfacturait les petites structures. */
    gegenstandswert: (e) => ((e.bilanzsumme || 0) + (e.jahresumsatz || 0)) / 2,
    baseLibelle: 'bilanzsumme',
  },
  buchfuehrung: {
    paragraphe: '§ 33 Abs. 1 StBVV',
    table: 'C',
    min: 2 / 10,
    max: 12 / 10,
    frequence: () => 12,
    mensuel: true,
    gegenstandswert: (e) => Math.max(e.jahresumsatz || 0, e.betriebsausgaben || 0),
    baseLibelle: 'jahresumsatz',
  },
  ustVoranmeldung: {
    paragraphe: '§ 24 Abs. 1 Nr. 7 StBVV',
    table: 'A',
    min: 1 / 10,
    max: 6 / 10,
    frequence: (e) => e.ustPeriodicite ?? 12,
    /* Chaque declaration periodique est une affaire distincte : la valeur de
     * l'objet porte sur les operations de la periode declaree, pas sur
     * l'annee entiere. Le minimum de 650 EUR s'applique par declaration. */
    gegenstandswert: (e) => {
      const periodes = e.ustPeriodicite ?? 12;
      return Math.max(0.1 * ((e.jahresumsatz || 0) / periodes), 650);
    },
    baseLibelle: 'jahresumsatz',
  },
  ustJahreserklaerung: {
    paragraphe: '§ 24 Abs. 1 Nr. 8 StBVV',
    table: 'A',
    min: 1 / 10,
    max: 8 / 10,
    frequence: () => 1,
    gegenstandswert: (e) => Math.max(0.1 * (e.jahresumsatz || 0), 8000),
    baseLibelle: 'jahresumsatz',
  },
  gewerbesteuer: {
    paragraphe: '§ 24 Abs. 1 Nr. 5 StBVV',
    table: 'A',
    min: 1 / 10,
    max: 6 / 10,
    frequence: () => 1,
    gegenstandswert: (e) => Math.max(e.gewerbeertrag || 0, 8000),
    baseLibelle: 'gewerbeertrag',
  },
  koerperschaftsteuer: {
    paragraphe: '§ 24 Abs. 1 Nr. 3 StBVV',
    table: 'A',
    min: 2 / 10,
    max: 8 / 10,
    frequence: () => 1,
    gegenstandswert: (e) => Math.max(e.einkommenKoerperschaft || 0, 16000),
    baseLibelle: 'einkommenKoerperschaft',
  },
  /* Prestation forfaitaire : montant par salarie, hors table */
  lohnbuchhaltung: {
    paragraphe: '§ 34 Abs. 2 StBVV',
    table: null,
    forfait: {
      min: STBVV_DIVERS.lohnAbrechnungMin,
      max: STBVV_DIVERS.lohnAbrechnungMax,
      unites: (e) => Math.max(0, e.nombreSalaries || 0),
    },
    frequence: () => 12,
    mensuel: true,
    baseLibelle: 'nombreSalaries',
  },
};

/* Profils pre-configures — pilotent la selection par defaut dans l'interface */
export const PROFILS_HONORAIRE = {
  arbeitnehmer: ['einkommensteuer'],
  vermieter: ['einkommensteuer', 'anlageV'],
  freiberufler: ['einkommensteuer', 'euer', 'ustVoranmeldung', 'ustJahreserklaerung', 'buchfuehrung'],
  gewerbe: ['einkommensteuer', 'euer', 'gewerbesteuer', 'ustVoranmeldung', 'ustJahreserklaerung', 'buchfuehrung'],
  kapitalgesellschaft: [
    'jahresabschluss', 'koerperschaftsteuer', 'gewerbesteuer',
    'ustVoranmeldung', 'ustJahreserklaerung', 'buchfuehrung', 'lohnbuchhaltung',
  ],
};

/* --- Calcul du devis ------------------------------------------------------ */
export function calculerHonoraire(entree) {
  const selection = entree.prestations || [];
  const lignes = [];

  for (const cle of selection) {
    const p = PRESTATIONS[cle];
    if (!p) continue;

    const frequence = p.frequence(entree);
    let min;
    let moyen;
    let max;
    let gegenstandswert = null;
    let gebuehrBase = null;

    if (p.forfait) {
      const unites = p.forfait.unites(entree);
      min = p.forfait.min * unites * frequence;
      max = p.forfait.max * unites * frequence;
      moyen = (min + max) / 2;
    } else {
      gegenstandswert = p.gegenstandswert(entree);
      gebuehrBase = gebuehrPleine(gegenstandswert, p.table);
      min = gebuehrBase * p.min * frequence;
      max = gebuehrBase * p.max * frequence;
      moyen = gebuehrBase * ((p.min + p.max) / 2) * frequence;
    }

    lignes.push({
      cle,
      paragraphe: p.paragraphe,
      table: p.table,
      cadre: p.forfait
        ? `${p.forfait.min}–${p.forfait.max} € / ${entree.nombreSalaries || 0}`
        : `${Math.round(p.min * 10)}/10 – ${Math.round(p.max * 10)}/10`,
      gegenstandswert,
      gebuehrBase,
      frequence,
      mensuel: !!p.mensuel,
      baseLibelle: p.baseLibelle,
      min,
      moyen,
      max,
    });
  }

  const somme = (champ) => lignes.reduce((total, l) => total + l[champ], 0);
  const totalMin = somme('min');
  const totalMoyen = somme('moyen');
  const totalMax = somme('max');

  /* § 16 StBVV — forfait de frais postaux : 20 % des honoraires, max 20 € */
  const auslagen = (base) => Math.min(base * STBVV_DIVERS.auslagenPart, STBVV_DIVERS.auslagenMax);
  const tva = (base) => base * STBVV_DIVERS.tvaTaux;

  const construire = (base) => {
    const frais = auslagen(base);
    const ht = base + frais;
    return { ht, frais, ttc: ht + tva(ht) };
  };

  const bMin = construire(totalMin);
  const bMoyen = construire(totalMoyen);
  const bMax = construire(totalMax);

  return {
    lignes,
    totaux: {
      min: totalMin,
      moyen: totalMoyen,
      max: totalMax,
      auslagen: bMoyen.frais,
      minTTC: bMin.ttc,
      moyenTTC: bMoyen.ttc,
      maxTTC: bMax.ttc,
      moyenMensuelTTC: bMoyen.ttc / 12,
    },
    tauxTVA: STBVV_DIVERS.tvaTaux,
  };
}
