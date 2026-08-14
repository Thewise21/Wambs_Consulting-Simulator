/* ============================================================================
 * PARAMETRES LEGAUX — SOURCE UNIQUE DE VERITE
 * ----------------------------------------------------------------------------
 * ATTENTION : ce fichier contient TOUTES les constantes legales des simulateurs.
 * Aucune valeur chiffree ne doit etre codee en dur ailleurs dans l'application.
 *
 * A verifier chaque annee (novembre/decembre) :
 *   - tarif § 32a EStG                → Bundesgesetzblatt / gesetze-im-internet.de
 *   - franchises Solidaritatszuschlag → § 3 SolZG
 *   - valeurs de securite sociale     → Sozialversicherungsrechengroessenverordnung
 *   - tables StBVV A / B / C          → Anlagen 1-3 StBGebV
 *
 * Sources verifiees le 13.08.2026 :
 *   § 32a EStG      : https://www.gesetze-im-internet.de/estg/__32a.html
 *   SV 2026         : https://www.vdek.com/vertragspartner/arbeitgeber/beitragssaetze.html
 *   StBVV Anlage 1  : https://www.gesetze-im-internet.de/stbgebv/anlage_1.html
 *   StBVV Anlage 2  : https://www.gesetze-im-internet.de/stbgebv/anlage_2.html
 *   StBVV Anlage 3  : https://www.gesetze-im-internet.de/stbgebv/anlage_3.html
 *   GewSt           : § 11 GewStG, § 35 EStG — Hebesatz Berlin 410 % en 2026
 *   § 19 UStG       : seuils 25.000 / 100.000 EUR depuis 2025 (JStG 2024)
 *   Firmenwagen     : § 6 Abs. 1 Nr. 4 EStG — plafond electrique porte a
 *                     100.000 EUR pour les acquisitions des le 01.07.2025
 *   Pendlerpauschale: 0,38 EUR/km des le 1er km au 01.01.2026
 *                     (Steueraenderungsgesetz 2025)
 * ========================================================================== */

export const STAND = '14.08.2026';
export const ANNEE_DEFAUT = 2026;
export const ANNEES_DISPONIBLES = [2026, 2025];

/* --- Tarif de l'impot sur le revenu § 32a Abs. 1 EStG ---------------------- */
/* Zones : 0 | (a2*y + b2)*y | (a3*z + b3)*z + c3 | 0,42x - c4 | 0,45x - c5    */
export const TARIF = {
  2026: {
    grundfreibetrag: 12348, // zone 1 : jusqu'a 12.348 EUR — 0 EUR
    zone2Fin: 17799,        // zone 2 : 12.349 - 17.799 EUR
    a2: 914.51,
    b2: 1400,
    zone3Fin: 69878,        // zone 3 : 17.800 - 69.878 EUR
    a3: 173.10,
    b3: 2397,
    c3: 1034.87,
    zone4Fin: 277825,       // zone 4 : 69.879 - 277.825 EUR — 42 %
    c4: 11135.63,
    c5: 19470.38,           // zone 5 : a partir de 277.826 EUR — 45 %
  },
  2025: {
    grundfreibetrag: 12096,
    zone2Fin: 17443,
    a2: 932.30,
    b2: 1400,
    zone3Fin: 68480,
    a3: 176.64,
    b3: 2397,
    c3: 1015.13,
    zone4Fin: 277825,
    c4: 10911.92,
    c5: 19246.67,
  },
};

/* --- Solidaritatszuschlag § 3 f. SolZG ------------------------------------ */
export const SOLI = {
  2026: { taux: 0.055, franchise: 20350, franchiseSplitting: 40700, tauxZoneAllegement: 0.119 },
  2025: { taux: 0.055, franchise: 19950, franchiseSplitting: 39900, tauxZoneAllegement: 0.119 },
};

/* --- Kirchensteuer — 8 % en Baviere et Bade-Wurtemberg, 9 % ailleurs ------ */
export const KIRCHENSTEUER_TAUX = { BY: 0.08, BW: 0.08, DEFAUT: 0.09 };

export const BUNDESLAENDER = [
  'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
  'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH',
];

/* --- Securite sociale ------------------------------------------------------ */
export const SV = {
  2026: {
    bbgRentenversicherungAn: 101400,   // = 8.450 EUR / mois
    bbgKrankenversicherungAn: 69750,   // = 5.812,50 EUR / mois
    jahresarbeitsentgeltgrenze: 77400, // = 6.450 EUR / mois (seuil assurance privee)
    tauxRV: 0.186,
    tauxAV: 0.026,
    tauxKV: 0.146,
    zusatzbeitragMoyen: 0.029,
    tauxPV: 0.036,
    supplementSansEnfant: 0.006,       // > 23 ans et sans enfant
    reductionParEnfant: 0.0025,        // a partir du 2e enfant < 25 ans, max 4 fois
    supplementSachsenAn: 0.005,        // la Saxe reporte 0,5 pt sur le salarie
    bezugsgroesse: 47460,              // 3.955 EUR / mois
  },
  2025: {
    bbgRentenversicherungAn: 96600,
    bbgKrankenversicherungAn: 66150,
    jahresarbeitsentgeltgrenze: 73800,
    tauxRV: 0.186,
    tauxAV: 0.026,
    tauxKV: 0.146,
    zusatzbeitragMoyen: 0.025,
    tauxPV: 0.036,
    supplementSansEnfant: 0.006,
    reductionParEnfant: 0.0025,
    supplementSachsenAn: 0.005,
    bezugsgroesse: 44940,
  },
};

/* --- Forfaits et abattements de l'impot sur le salaire -------------------- */
export const FORFAITS = {
  2026: {
    arbeitnehmerPauschbetrag: 1230,        // § 9a Nr. 1a EStG
    sonderausgabenPauschbetrag: 36,        // § 10c EStG
    entlastungsbetragAlleinerziehende: 4260, // § 24b EStG (1er enfant)
    entlastungsbetragProEnfantSuppl: 240,
    kinderfreibetragTotal: 9756,           // § 32 Abs. 6 EStG (les deux parents)
    kindergeldMensuel: 259,
    minVorsorgepauschale: 1900,            // § 39b Abs. 2 S. 5 Nr. 3 EStG
    minVorsorgepauschaleKlasseIII: 3000,
    partMinVorsorgepauschale: 0.12,
    sparerPauschbetrag: 1000,
  },
  2025: {
    arbeitnehmerPauschbetrag: 1230,
    sonderausgabenPauschbetrag: 36,
    entlastungsbetragAlleinerziehende: 4260,
    entlastungsbetragProEnfantSuppl: 240,
    kinderfreibetragTotal: 9600,
    kindergeldMensuel: 255,
    minVorsorgepauschale: 1900,
    minVorsorgepauschaleKlasseIII: 3000,
    partMinVorsorgepauschale: 0.12,
    sparerPauschbetrag: 1000,
  },
};

/* --- Fiscalite internationale --------------------------------------------- */
export const INTERNATIONAL = {
  /* § 1 Abs. 3 EStG — option pour l'assujettissement illimite */
  seuilRevenusAllemands: 0.9,
  /* § 46 Abs. 2 Nr. 1 EStG — obligation de declarer si revenus soumis au
     Progressionsvorbehalt superieurs a ce montant */
  seuilDeclarationProgression: 410,
  /* Etats ouvrant droit au § 1a EStG (splitting avec conjoint non resident) */
  paysEEE: ['FR', 'BE', 'LU', 'NL', 'AT', 'IT', 'ES', 'PL', 'PT', 'EU_AUTRE'],
  paysAvecClauseSuisse: ['CH'],
};

/* --- Gewerbesteuer --------------------------------------------------------- */
/* Sources : § 11 GewStG (Steuermesszahl, Freibetrag), § 35 EStG (imputation) */
export const GEWERBESTEUER = {
  2026: {
    steuermesszahl: 0.035,
    freibetragNatuerlichePersonen: 24500, // pas d'abattement pour les societes de capitaux
    anrechnungsfaktor: 4,                 // § 35 EStG : 4 fois le Messbetrag
    hebesatzMinimum: 200,                 // § 16 Abs. 4 S. 2 GewStG
    arrondiErtrag: 100,                   // § 11 Abs. 1 S. 3 GewStG
  },
  2025: {
    steuermesszahl: 0.035,
    freibetragNatuerlichePersonen: 24500,
    anrechnungsfaktor: 4,
    hebesatzMinimum: 200,
    arrondiErtrag: 100,
  },
};

/* Quelques Hebesatze de reference — l'utilisateur peut saisir le sien */
export const HEBESAETZE_REFERENCE = [
  { commune: 'Berlin', hebesatz: 410 },
  { commune: 'Hamburg', hebesatz: 470 },
  { commune: 'Muenchen', hebesatz: 490 },
  { commune: 'Koeln', hebesatz: 475 },
  { commune: 'Frankfurt', hebesatz: 460 },
  { commune: 'Leipzig', hebesatz: 460 },
  { commune: 'Potsdam', hebesatz: 455 },
  { commune: 'Duesseldorf', hebesatz: 440 },
];

/* --- Imposition des societes de capitaux ---------------------------------- */
export const KOERPERSCHAFTSTEUER = {
  2026: { satz: 0.15, soliSatz: 0.055 }, // § 23 KStG — pas de franchise de Soli ici
  2025: { satz: 0.15, soliSatz: 0.055 },
};

/* --- Imposition des distributions (Abgeltungsteuer) ----------------------- */
export const KAPITALERTRAGSTEUER = {
  2026: { satz: 0.25, soliSatz: 0.055, sparerPauschbetrag: 1000 },
  2025: { satz: 0.25, soliSatz: 0.055, sparerPauschbetrag: 1000 },
};

/* --- Formes juridiques ----------------------------------------------------- */
export const FORMES_JURIDIQUES = {
  ug: {
    stammkapitalMinimum: 1,
    thesaurierungsquote: 0.25, // § 5a Abs. 3 GmbHG : reserve obligatoire
    ruecklageZiel: 25000,
  },
  gmbh: { stammkapitalMinimum: 25000, thesaurierungsquote: 0, ruecklageZiel: 0 },
};

/* --- Kleinunternehmerregelung § 19 UStG ----------------------------------- */
/* Seuils releves par le JStG 2024, applicables depuis 2025 */
export const KLEINUNTERNEHMER = {
  2026: { grenzeVorjahr: 25000, grenzeLaufendesJahr: 100000, bindungJahre: 5 },
  2025: { grenzeVorjahr: 25000, grenzeLaufendesJahr: 100000, bindungJahre: 5 },
};

export const UMSATZSTEUER = { regelsatz: 0.19, ermaessigterSatz: 0.07 };

/* --- Vehicule de fonction --------------------------------------------------- */
/* § 6 Abs. 1 Nr. 4 EStG. Le plafond des vehicules electriques est passe de
 * 70.000 a 100.000 EUR pour les acquisitions a partir du 01.07.2025. */
export const FIRMENWAGEN = {
  2026: {
    satzVerbrenner: 0.01,
    satzElektroReduit: 0.0025,      // un quart de l'assiette
    satzElektroAuDessus: 0.005,     // la moitie de l'assiette
    satzHybride: 0.005,
    plafondElektro: 100000,
    plafondElektroAvantJuillet2025: 70000,
    satzArbeitsweg: 0.0003,         // 0,03 % par kilometre et par mois
    satzEinzelbewertung: 0.0002,    // 0,002 % par kilometre et par trajet
  },
  2025: {
    satzVerbrenner: 0.01,
    satzElektroReduit: 0.0025,
    satzElektroAuDessus: 0.005,
    satzHybride: 0.005,
    plafondElektro: 100000,
    plafondElektroAvantJuillet2025: 70000,
    satzArbeitsweg: 0.0003,
    satzEinzelbewertung: 0.0002,
  },
};

/* --- Entfernungspauschale --------------------------------------------------- */
/* Le Steueraenderungsgesetz 2025 a unifie le bareme au 01.01.2026 :
 * 0,38 EUR des le premier kilometre, fin du palier a 20 km. */
export const ENTFERNUNGSPAUSCHALE = {
  2026: { proKm: 0.38, palier: null, proKmApresPalier: 0.38 },
  2025: { proKm: 0.30, palier: 20, proKmApresPalier: 0.38 },
};

/* --- Immobilier locatif ---------------------------------------------------- */
/* Amortissement § 7 Abs. 4 et Abs. 5a EStG. Seule la construction s'amortit :
 * la quote-part du terrain doit etre exclue. */
export const AMORTISSEMENT_IMMOBILIER = {
  habitationDepuis2023: 0.03,      // acheve apres le 31.12.2022
  habitationDepuis1925: 0.02,      // acheve apres le 31.12.1924
  habitationAvant1925: 0.025,
  batimentProfessionnel: 0.03,
  degressif: 0.05,                 // § 7 Abs. 5a, chantiers 10/2023 - 09/2029
};

/* § 23 Abs. 1 Nr. 1 EStG — plus-value privee */
export const SPECULATION_IMMOBILIERE = {
  delaiAns: 10,
  delaiUsagePropreAns: 3,
};

/* Droits de mutation par Land — verifies pour 2026 */
export const GRUNDERWERBSTEUER = {
  BW: 0.05, BY: 0.035, BE: 0.06, BB: 0.065,
  HB: 0.055, HH: 0.055, HE: 0.06, MV: 0.06,
  NI: 0.05, NW: 0.065, RP: 0.05, SL: 0.065,
  SN: 0.055, ST: 0.05, SH: 0.065, TH: 0.05,
};

/* Frais annexes usuels a l'achat, en part du prix */
export const FRAIS_ACQUISITION = {
  notaire: 0.015,
  registreFoncier: 0.005,
  commissionCourtierMax: 0.0357, // part acquereur, TVA comprise
};

/* --- Photovoltaique --------------------------------------------------------- */
export const PHOTOVOLTAIQUE = {
  /* § 3 Nr. 72 EStG — exoneration d'impot sur le revenu */
  limiteParUniteKwp: 30,
  limiteParContribuableKwp: 100,
  /* § 12 Abs. 3 UStG — taux zero sur la livraison et l'installation */
  tauxTvaInstallation: 0,
  /* Reperes de rendement, ajustables par l'utilisateur */
  productionParKwpDefaut: 950,   // kWh par kWp et par an
  partAutoconsommationDefaut: 0.3,
};

/* --- Indemnite de depart § 34 EStG ------------------------------------------ */
export const ABFINDUNG = {
  diviseur: 5,
  /* Depuis 2025 la regle du cinquieme n'est plus appliquee au prelevement
   * mensuel : elle ne joue qu'a la declaration annuelle. */
  appliqueeAuPrelevementDepuis: 2025,
};

/* --- Prevoyance vieillesse -------------------------------------------------- */
export const PREVOYANCE = {
  2026: {
    ruerupPlafond: 30826,
    ruerupPlafondCouple: 61652,
    riesterPlafondSonderausgaben: 2100,
    riesterZulageBase: 175,
    riesterZulageEnfant: 300,        // ne(e) a partir de 2008
    riesterZulageEnfantAvant2008: 185,
    riesterPartMinimale: 0.04,
    /* § 22 Nr. 1 S. 3 EStG — part imposable selon l'annee de depart */
    partImposableRente: 0.84,
    partImposableProgressionAnnuelle: 0.005,
    niveauRenteBrut: 0.48,           // repere du niveau de pension
  },
  2025: {
    ruerupPlafond: 29344,
    ruerupPlafondCouple: 58688,
    riesterPlafondSonderausgaben: 2100,
    riesterZulageBase: 175,
    riesterZulageEnfant: 300,
    riesterZulageEnfantAvant2008: 185,
    riesterPartMinimale: 0.04,
    partImposableRente: 0.835,
    partImposableProgressionAnnuelle: 0.005,
    niveauRenteBrut: 0.48,
  },
};

/* --- Droits de succession et de donation ------------------------------------ */
/* ErbStG — abattements et bareme inchanges depuis 2010 */
export const SUCCESSION = {
  abattements: {
    conjoint: 500000,
    enfant: 400000,
    petitEnfant: 200000,
    parentSuccession: 100000,   // ascendants en cas de succession
    classeII: 20000,
    classeIII: 20000,
  },
  /* Abattement supplementaire de pension, § 17 ErbStG */
  versorgungsfreibetragConjoint: 256000,
  /* Bareme par classe : [plafond de la part taxable, taux] */
  bareme: {
    I: [[75000, 0.07], [300000, 0.11], [600000, 0.15], [6000000, 0.19],
      [13000000, 0.23], [26000000, 0.27], [Infinity, 0.30]],
    II: [[75000, 0.15], [300000, 0.20], [600000, 0.25], [6000000, 0.30],
      [13000000, 0.35], [26000000, 0.40], [Infinity, 0.43]],
    III: [[75000, 0.30], [300000, 0.30], [600000, 0.30], [6000000, 0.30],
      [13000000, 0.50], [26000000, 0.50], [Infinity, 0.50]],
  },
  delaiRenouvellementAns: 10,
};

/* --- Obligation de declarer et delais ---------------------------------------- */
export const DECLARATION = {
  /* § 46 Abs. 2 Nr. 1 EStG — seuil des revenus soumis au taux effectif */
  seuilRevenusAnnexes: 410,
  /* § 149 AO — les dates sont donnees en mois et jour de l'annee suivante */
  delaiSansConseil: { moisApresAnnee: 7, jour: 31 },        // 31 juillet N+1
  delaiAvecConseil: { anneesApres: 2, mois: 2, jour: 28 },  // 28 fevrier N+2
  /* § 152 AO — majoration de retard */
  majorationParMoisPart: 0.0025,
  majorationParMoisMinimum: 25,
};

/* ==========================================================================
 * DIASPORA — situations liees a un pays d'origine hors UE
 * ======================================================================== */

/* --- Ländergruppeneinteilung ------------------------------------------------ */
/* Le ministere federal des Finances classe chaque pays en quatre groupes selon
 * le niveau de vie. Les montants deductibles sont reduits en consequence.
 *
 * ATTENTION : la liste complete des pays figure dans la circulaire du BMF
 * (derniere version du 02.12.2025) et n'est PAS reproduite ici. Elle change
 * chaque annee et une erreur de groupe fausse directement le montant annonce
 * au client. Les simulateurs demandent donc le groupe a l'utilisateur.
 * Les exemples ci-dessous ne servent qu'a l'orienter. */
export const LAENDERGRUPPEN = {
  1: { fraction: 1 },
  2: { fraction: 0.75 },
  3: { fraction: 0.5 },
  4: { fraction: 0.25 },
};

/* --- Soutien aux proches a l'etranger, § 33a EStG --------------------------- */
export const UNTERHALT = {
  2026: {
    hoechstbetrag: 12348,          // aligne sur le Grundfreibetrag
    anrechnungsfreierBetrag: 624,  // § 33a Abs. 1 S. 5 EStG
    vermoegensgrenze: 15500,       // patrimoine « faible » tolere chez le beneficiaire
  },
  2025: {
    hoechstbetrag: 12096,
    anrechnungsfreierBetrag: 624,
    vermoegensgrenze: 15500,
  },
  /* Depuis le 01.01.2025, seuls les virements bancaires sont deductibles
   * (§ 33a Abs. 1 S. 12 EStG). Les remises en especes ne le sont plus. */
  virementObligatoireDepuis: 2025,
  /* Opfergrenze : hors conjoint, la deduction est plafonnee a une part du
   * revenu net du payeur. 1 point par tranche entiere de 500 EUR, maximum
   * 50 %, diminue de 5 points par conjoint et par enfant a charge, dans la
   * limite de 25 points. */
  opfergrenze: {
    pointParTranche: 0.01,
    tailleTranche: 500,
    maximum: 0.5,
    reductionConjoint: 0.05,
    reductionEnfant: 0.05,
    reductionMaximale: 0.25,
  },
};

/* --- Allocations familiales pour enfants a l'etranger ----------------------- */
/* § 63 Abs. 1 S. 6 EStG : principe de territorialite. Aucun droit pour un
 * enfant residant dans un Etat tiers, sauf convention de securite sociale. */
export const KINDERGELD_INTERNATIONAL = {
  zonesUE: [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'GR', 'HU',
    'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI',
    'ES', 'SE', 'IS', 'LI', 'NO', 'CH',
  ],
  /* Etats ayant conclu une convention couvrant les allocations familiales.
   * La Macedoine du Nord n'en fait pas partie, contrairement a une idee
   * repandue dans la region. */
  abkommensstaaten: ['DZ', 'BA', 'XK', 'MA', 'ME', 'RS', 'TN', 'TR'],
};

/* --- Retraite : remboursement des cotisations, § 210 SGB VI ------------------ */
export const RENTE = {
  2026: {
    rentenwert: 42.52,              // valeur du point au 01.07.2026
    rentenwertPrecedent: 40.79,
    durchschnittsentgelt: 51944,    // revenu moyen provisoire 2026
    tauxRV: 0.186,
  },
  2025: {
    rentenwert: 40.79,
    rentenwertPrecedent: 39.32,
    durchschnittsentgelt: 50493,
    tauxRV: 0.186,
  },
  wartezeitMoisRetraite: 60,        // 5 ans pour ouvrir un droit a pension
  delaiErstattungMois: 24,          // § 210 Abs. 3 SGB VI
  ageRetraiteReference: 67,
};

/* ==========================================================================
 * StBVV — Steuerberatervergutungsverordnung
 * Tables sous forme [valeur de l'objet jusqu'a, honoraire plein 10/10]
 * ======================================================================== */

/* Anlage 1 — Tabelle A (Beratungstabelle) */
export const TABELLE_A = [
  [300, 31], [600, 56], [900, 81], [1200, 106], [1500, 130],
  [2000, 166], [2500, 200], [3000, 235], [3500, 270], [4000, 305],
  [4500, 340], [5000, 375], [6000, 422], [7000, 467], [8000, 514],
  [9000, 560], [10000, 605], [13000, 655], [16000, 705], [19000, 755],
  [22000, 805], [25000, 854], [30000, 946], [35000, 1036], [40000, 1125],
  [45000, 1215], [50000, 1304], [65000, 1399], [80000, 1496], [95000, 1592],
  [110000, 1689], [125000, 1784], [140000, 1879], [155000, 1976], [170000, 2071],
  [185000, 2168], [200000, 2264], [230000, 2412], [260000, 2559], [290000, 2705],
  [320000, 2859], [350000, 2926], [380000, 2990], [410000, 3055], [440000, 3115],
  [470000, 3175], [500000, 3234], [550000, 3320], [600000, 3404],
];
/* Au-dela de 600.000 EUR : par tranche entamee de 50.000 EUR */
export const TABELLE_A_EXTRAPOLATION = [
  { jusqua: 5000000, pas: 50000, montant: 149 },
  { jusqua: 25000000, pas: 50000, montant: 112 },
  { jusqua: Infinity, pas: 50000, montant: 88 },
];

/* Anlage 2 — Tabelle B (Abschlusstabelle) */
export const TABELLE_B = [
  [3000, 49], [3500, 57], [4000, 68], [4500, 76], [5000, 86],
  [6000, 96], [7000, 105], [8000, 116], [9000, 121], [10000, 127],
  [12500, 134], [15000, 151], [17500, 166], [20000, 178], [22500, 191],
  [25000, 201], [37500, 215], [50000, 263], [62500, 303], [75000, 338],
  [87500, 353], [100000, 369], [125000, 423], [150000, 471], [175000, 512],
  [200000, 548], [225000, 582], [250000, 613], [300000, 641], [350000, 696],
  [400000, 746], [450000, 791], [500000, 832], [625000, 871], [750000, 968],
  [875000, 1050], [1000000, 1126], [1250000, 1194], [1500000, 1324],
  [1750000, 1438], [2000000, 1542], [2250000, 1635], [2500000, 1718],
  [3000000, 1797], [3500000, 1951], [4000000, 2089], [4500000, 2214],
  [5000000, 2328], [7500000, 2720], [10000000, 3162], [12500000, 3520],
  [15000000, 3819], [17500000, 4074], [20000000, 4293], [22500000, 4573],
  [25000000, 4831], [30000000, 5315], [35000000, 5759], [40000000, 6172],
  [45000000, 6558], [50000000, 6923],
];
export const TABELLE_B_EXTRAPOLATION = [
  { jusqua: 125000000, pas: 5000000, montant: 273 },
  { jusqua: 250000000, pas: 12500000, montant: 477 },
  { jusqua: Infinity, pas: 25000000, montant: 681 },
];

/* Anlage 3 — Tabelle C (Buchfuhrungstabelle) */
export const TABELLE_C = [
  [15000, 72], [17500, 80], [20000, 88], [22500, 93], [25000, 101],
  [30000, 108], [35000, 117], [40000, 122], [45000, 129], [50000, 138],
  [62500, 145], [75000, 158], [87500, 174], [100000, 188], [125000, 209],
  [150000, 230], [200000, 275], [250000, 317], [300000, 359], [350000, 404],
  [400000, 441], [450000, 475], [500000, 512],
];
export const TABELLE_C_EXTRAPOLATION = [
  { jusqua: Infinity, pas: 50000, montant: 36 },
];

/* --- Autres parametres StBVV ---------------------------------------------- */
export const STBVV_DIVERS = {
  tvaTaux: 0.19,                    // § 15 StBVV
  auslagenPart: 0.20,               // § 16 StBVV — forfait postal 20 %
  auslagenMax: 20,                  // plafonne a 20 EUR par affaire
  /* § 13 StBVV — depuis la reforme, par QUART d'heure entame (et non plus
   * par demi-heure). Verifie sur gesetze-im-internet.de le 14.08.2026. */
  zeitgebuehrMin: 16.5,
  zeitgebuehrMax: 41,
  lohnAbrechnungMin: 6,             // § 34 Abs. 2 StBVV — par salarie et par periode
  lohnAbrechnungMax: 30,
  lohnEinrichtungMin: 6,            // § 34 Abs. 1 StBVV — mise en place
  lohnEinrichtungMax: 19,
};
