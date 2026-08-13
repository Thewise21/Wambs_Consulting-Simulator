/* ============================================================================
 * Vehicule de fonction : forfait de 1 % contre carnet de bord
 * ----------------------------------------------------------------------------
 * L'avantage en nature s'ajoute au salaire brut imposable. Le cout reel du
 * vehicule pour le salarie est donc la difference entre son net avec et sans
 * ce supplement : le moteur brut/net existant fait tout le travail.
 *
 * Base legale : § 6 Abs. 1 Nr. 4 EStG (forfait, assiette reduite pour les
 * vehicules electriques) et § 8 Abs. 2 EStG (trajets domicile-travail).
 * ========================================================================== */
import { FIRMENWAGEN, ENTFERNUNGSPAUSCHALE, ANNEE_DEFAUT } from './parameter.js';
import { calculerBruttoNetto } from './bruttoNetto.js';

export const MOTORISATIONS = ['verbrenner', 'elektro', 'hybride'];

/* Assiette retenue pour le forfait : prix catalogue, sa moitie ou son quart */
export function assietteForfaitaire({ bruttolistenpreis, motorisation, anschaffungRecente, annee }) {
  const p = FIRMENWAGEN[annee] || FIRMENWAGEN[ANNEE_DEFAUT];
  const prix = Math.max(0, bruttolistenpreis || 0);

  if (motorisation === 'elektro') {
    const plafond = anschaffungRecente ? p.plafondElektro : p.plafondElektroAvantJuillet2025;
    /* Un quart de l'assiette sous le plafond, la moitie au-dessus */
    const part = prix <= plafond ? 0.25 : 0.5;
    return { assiette: prix * part, part, plafond };
  }
  if (motorisation === 'hybride') {
    return { assiette: prix * 0.5, part: 0.5, plafond: null };
  }
  return { assiette: prix, part: 1, plafond: null };
}

/* Avantage en nature annuel selon le forfait */
function avantageForfaitaire({ assiette, distanceTravail, annee }) {
  const p = FIRMENWAGEN[annee] || FIRMENWAGEN[ANNEE_DEFAUT];
  const usagePrive = assiette * p.satzVerbrenner * 12;
  const trajetsTravail = assiette * p.satzArbeitsweg * distanceTravail * 12;
  return { usagePrive, trajetsTravail, total: usagePrive + trajetsTravail };
}

/* Avantage en nature annuel selon le carnet de bord */
function avantageCarnetDeBord({ coutAnnuel, kmTotal, kmPrives, distanceTravail, joursTravailles }) {
  if (kmTotal <= 0) return { coutParKm: 0, usagePrive: 0, trajetsTravail: 0, total: 0 };
  const coutParKm = coutAnnuel / kmTotal;
  const kmTravail = distanceTravail * 2 * joursTravailles;
  const usagePrive = coutParKm * Math.max(0, kmPrives);
  const trajetsTravail = coutParKm * kmTravail;
  return { coutParKm, kmTravail, usagePrive, trajetsTravail, total: usagePrive + trajetsTravail };
}

/* Deduction pour trajets domicile-travail, applicable dans les deux methodes */
function entfernungspauschale({ distanceTravail, joursTravailles, annee }) {
  const p = ENTFERNUNGSPAUSCHALE[annee] || ENTFERNUNGSPAUSCHALE[ANNEE_DEFAUT];
  const km = Math.floor(Math.max(0, distanceTravail));
  if (!p.palier) return km * p.proKm * joursTravailles;
  const dansPalier = Math.min(km, p.palier);
  const auDela = Math.max(0, km - p.palier);
  return (dansPalier * p.proKm + auDela * p.proKmApresPalier) * joursTravailles;
}

export function calculerFirmenwagen(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const distanceTravail = Math.max(0, entree.distanceTravail || 0);
  const joursTravailles = Math.max(0, entree.joursTravailles || 0);

  const contexteSalaire = {
    klasse: entree.klasse || 'I',
    bundesland: entree.bundesland || 'BE',
    kirchenmitglied: !!entree.kirchenmitglied,
    kinderfreibetraege: entree.kinderfreibetraege || 0,
    enfantsMoins25: entree.enfantsMoins25 || 0,
    sansEnfant: entree.sansEnfant !== false,
    kvType: entree.kvType || 'gesetzlich',
    zusatzbeitrag: entree.zusatzbeitrag,
    rvPflichtig: entree.rvPflichtig !== false,
    annee,
  };

  const salaireSeul = calculerBruttoNetto({
    ...contexteSalaire,
    bruttoAnnuel: Math.max(0, entree.bruttoAnnuel || 0),
  });

  /* Cout net d'un avantage en nature donne.
   *
   * L'avantage grossit l'assiette imposable mais n'est jamais verse en
   * especes : le salarie ne perd donc pas l'avantage lui-meme, il perd
   * l'impot et les cotisations qu'il declenche. Comparer directement les deux
   * nets serait un contresens — l'ajout d'un Sachbezug fait mecaniquement
   * monter le net affiche, alors que la paie versee, elle, diminue. */
  const coutNet = (avantage) => {
    const avecVehicule = calculerBruttoNetto({
      ...contexteSalaire,
      bruttoAnnuel: Math.max(0, entree.bruttoAnnuel || 0) + avantage,
    });
    const impotsSupplementaires = avecVehicule.totalImpots - salaireSeul.totalImpots;
    const cotisationsSupplementaires = avecVehicule.totalSocial - salaireSeul.totalSocial;
    const coutAnnuel = impotsSupplementaires + cotisationsSupplementaires;

    return {
      /* Salaire reellement verse : le net calcule, diminue de l'avantage */
      netVerseAnnuel: avecVehicule.netAnnuel - avantage,
      coutAnnuel,
      coutMensuel: coutAnnuel / 12,
      impotsSupplementaires,
      cotisationsSupplementaires,
      tauxCharge: avantage > 0 ? coutAnnuel / avantage : 0,
    };
  };

  const base = assietteForfaitaire({
    bruttolistenpreis: entree.bruttolistenpreis,
    motorisation: entree.motorisation || 'verbrenner',
    anschaffungRecente: entree.anschaffungRecente !== false,
    annee,
  });

  const forfait = avantageForfaitaire({ assiette: base.assiette, distanceTravail, annee });
  const carnet = avantageCarnetDeBord({
    coutAnnuel: Math.max(0, entree.coutAnnuelVehicule || 0),
    kmTotal: Math.max(0, entree.kmTotal || 0),
    kmPrives: Math.max(0, entree.kmPrives || 0),
    distanceTravail,
    joursTravailles,
  });

  const resultatForfait = { avantage: forfait, ...coutNet(forfait.total) };
  const resultatCarnet = { avantage: carnet, ...coutNet(carnet.total) };

  /* Comparaison avec un vehicule thermique de meme prix catalogue */
  let comparaisonThermique = null;
  if (entree.motorisation !== 'verbrenner') {
    const baseThermique = assietteForfaitaire({
      bruttolistenpreis: entree.bruttolistenpreis,
      motorisation: 'verbrenner',
      anschaffungRecente: true,
      annee,
    });
    const forfaitThermique = avantageForfaitaire({
      assiette: baseThermique.assiette, distanceTravail, annee,
    });
    const coutThermique = coutNet(forfaitThermique.total);
    comparaisonThermique = {
      avantage: forfaitThermique.total,
      coutAnnuel: coutThermique.coutAnnuel,
      economie: coutThermique.coutAnnuel - resultatForfait.coutAnnuel,
    };
  }

  const deductionTrajets = entfernungspauschale({ distanceTravail, joursTravailles, annee });

  const carnetExploitable = (entree.kmTotal || 0) > 0 && (entree.coutAnnuelVehicule || 0) > 0;
  const meilleureMethode = !carnetExploitable
    ? 'forfait'
    : (resultatCarnet.coutAnnuel < resultatForfait.coutAnnuel ? 'carnet' : 'forfait');
  const economieMethode = carnetExploitable
    ? Math.abs(resultatForfait.coutAnnuel - resultatCarnet.coutAnnuel)
    : 0;

  /* --- Alertes -------------------------------------------------------------- */
  const alertes = [];

  if (entree.motorisation === 'elektro') {
    if (base.part === 0.25) {
      alertes.push({ cle: 'electriqueAvantage', niveau: 'positif', params: { plafond: base.plafond } });
    } else {
      alertes.push({ cle: 'electriqueAuDessusPlafond', niveau: 'attention', params: { plafond: base.plafond } });
    }
    if (!entree.anschaffungRecente) {
      alertes.push({ cle: 'plafondAncien', niveau: 'info', params: { plafond: base.plafond } });
    }
  }
  if (entree.motorisation === 'hybride') {
    alertes.push({ cle: 'hybrideConditions', niveau: 'attention', params: {} });
  }
  if (carnetExploitable && meilleureMethode === 'carnet') {
    alertes.push({ cle: 'carnetInteressant', niveau: 'positif', params: { montant: economieMethode } });
  }
  if (carnetExploitable && meilleureMethode === 'forfait') {
    alertes.push({ cle: 'forfaitInteressant', niveau: 'info', params: { montant: economieMethode } });
  }
  if (!carnetExploitable) {
    alertes.push({ cle: 'carnetNonRenseigne', niveau: 'info', params: {} });
  }
  alertes.push({ cle: 'carnetExigences', niveau: 'attention', params: {} });
  if (deductionTrajets > 0) {
    alertes.push({ cle: 'entfernungspauschale', niveau: 'positif', params: { montant: deductionTrajets } });
  }
  if (distanceTravail > 0 && joursTravailles < 180) {
    alertes.push({ cle: 'einzelbewertung', niveau: 'info', params: { jours: joursTravailles } });
  }

  return {
    annee,
    base,
    salaireSeul,
    forfait: resultatForfait,
    carnet: resultatCarnet,
    carnetExploitable,
    meilleureMethode,
    economieMethode,
    comparaisonThermique,
    deductionTrajets,
    alertes,
  };
}
