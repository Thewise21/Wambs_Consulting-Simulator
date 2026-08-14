/* ============================================================================
 * Comparateur de forme juridique
 * ----------------------------------------------------------------------------
 * Compare quatre montages sur un meme benefice avant remuneration du dirigeant :
 *   - Freiberufler          : pas de taxe professionnelle
 *   - Einzelunternehmen     : taxe professionnelle avec abattement + § 35 EStG
 *   - UG (haftungsbeschraenkt) : impot sur les societes + reserve obligatoire
 *   - GmbH                  : impot sur les societes
 *
 * Hypotheses assumees, affichees a l'utilisateur :
 *   - le dirigeant est associe majoritaire, donc dispense d'affiliation
 *     obligatoire a la securite sociale ; la comparaison reste ainsi neutre
 *     entre l'entrepreneur individuel et le gerant de societe ;
 *   - les Hinzurechnungen et Kuerzungen de la taxe professionnelle ne sont pas
 *     modelisees (voir gewerbesteuer.js) ;
 *   - les distributions sont imposees au prelevement forfaitaire ; l'option
 *     pour le Teileinkuenfteverfahren n'est pas simulee ;
 *   - la remuneration du gerant est supposee conforme au marche : une
 *     remuneration excessive serait requalifiee en distribution occulte.
 * ========================================================================== */
import {
  KOERPERSCHAFTSTEUER, KAPITALERTRAGSTEUER, FORMES_JURIDIQUES,
  FORFAITS, KIRCHENSTEUER_TAUX, ANNEE_DEFAUT,
} from './parameter.js';
import { impotSelonBareme, solidaritaetszuschlag } from './estTarif.js';
import { calculerGewerbesteuer } from './gewerbesteuer.js';

export const FORMES = ['freiberufler', 'einzelunternehmen', 'ug', 'gmbh'];

/* Impot sur le revenu d'une personne physique, avec Soli et impot d'eglise */
function impositionPersonnelle({ zvE, splitting, kirchenmitglied, bundesland, annee }) {
  const impot = impotSelonBareme(Math.max(0, zvE), splitting, annee);
  const soli = solidaritaetszuschlag(impot, splitting, annee);
  const taux = KIRCHENSTEUER_TAUX[bundesland] ?? KIRCHENSTEUER_TAUX.DEFAUT;
  const kist = kirchenmitglied ? impot * taux : 0;
  return { impot, soli, kist, total: impot + soli + kist };
}

/* --- Entrepreneur individuel et profession liberale ---------------------- */
function calculerEntrepriseIndividuelle(entree, avecGewerbesteuer) {
  const { benefice, hebesatz, splitting, kirchenmitglied, bundesland, annee } = entree;

  const gewSt = avecGewerbesteuer
    ? calculerGewerbesteuer({ gewinn: benefice, hebesatz, kapitalgesellschaft: false, annee })
    : null;

  /* La taxe professionnelle n'est pas deductible du benefice imposable
     (§ 4 Abs. 5b EStG) : l'assiette de l'impot sur le revenu reste le benefice. */
  const forfaits = FORFAITS[annee] || FORFAITS[ANNEE_DEFAUT];
  const zvE = Math.max(0, benefice - forfaits.sonderausgabenPauschbetrag);

  const perso = impositionPersonnelle({ zvE, splitting, kirchenmitglied, bundesland, annee });

  /* § 35 EStG : l'imputation ne peut pas depasser l'impot sur le revenu du */
  const anrechnung = gewSt ? Math.min(gewSt.anrechnungPotentielle, perso.impot) : 0;
  const gewerbesteuerNette = gewSt ? gewSt.steuer - anrechnung : 0;

  const chargeTotale = perso.total + gewerbesteuerNette;

  return {
    forme: avecGewerbesteuer ? 'einzelunternehmen' : 'freiberufler',
    beneficeSociete: 0,
    remuneration: 0,
    postes: {
      gewerbesteuer: gewSt ? gewSt.steuer : 0,
      anrechnungGewerbesteuer: -anrechnung,
      koerperschaftsteuer: 0,
      soliKoerperschaftsteuer: 0,
      einkommensteuer: perso.impot,
      soli: perso.soli,
      kirchensteuer: perso.kist,
      abgeltungsteuer: 0,
    },
    detailGewerbesteuer: gewSt,
    chargeTotale,
    revenuDisponible: benefice - chargeTotale,
    resteDansSociete: 0,
    tauxCharge: benefice > 0 ? chargeTotale / benefice : 0,
  };
}

/* --- UG et GmbH ------------------------------------------------------------ */
function calculerSocieteDeCapitaux(entree, typeSociete) {
  const {
    benefice, remuneration, hebesatz, quoteDistribution,
    splitting, kirchenmitglied, bundesland, annee,
  } = entree;

  const kst = KOERPERSCHAFTSTEUER[annee] || KOERPERSCHAFTSTEUER[ANNEE_DEFAUT];
  const kest = KAPITALERTRAGSTEUER[annee] || KAPITALERTRAGSTEUER[ANNEE_DEFAUT];
  const forfaits = FORFAITS[annee] || FORFAITS[ANNEE_DEFAUT];
  const forme = FORMES_JURIDIQUES[typeSociete];

  /* La remuneration du gerant est une charge deductible : c'est le principal
     levier de la forme societaire. */
  const salaire = Math.min(Math.max(0, remuneration), Math.max(0, benefice));
  const beneficeSociete = Math.max(0, benefice - salaire);

  /* Niveau societe */
  const gewSt = calculerGewerbesteuer({
    gewinn: beneficeSociete, hebesatz, kapitalgesellschaft: true, annee,
  });
  const koerperschaftsteuer = beneficeSociete * kst.satz;
  const soliKoerperschaftsteuer = koerperschaftsteuer * kst.soliSatz;

  const beneficeApresImpots = beneficeSociete
    - gewSt.steuer - koerperschaftsteuer - soliKoerperschaftsteuer;

  /* Une UG doit doter une reserve de 25 % du benefice annuel jusqu'a
     atteindre 25.000 EUR (§ 5a Abs. 3 GmbHG) : seule la part restante est
     distribuable. */
  const partDistribuable = Math.max(0, beneficeApresImpots) * (1 - forme.thesaurierungsquote);
  const distribution = partDistribuable * Math.min(1, Math.max(0, quoteDistribution));

  /* Niveau associe — prelevement forfaitaire sur les distributions */
  const baseImposable = Math.max(0, distribution - kest.sparerPauschbetrag);
  const abgeltungsteuer = baseImposable * kest.satz;
  const soliAbgeltung = abgeltungsteuer * kest.soliSatz;
  const tauxKirche = KIRCHENSTEUER_TAUX[bundesland] ?? KIRCHENSTEUER_TAUX.DEFAUT;
  const kistAbgeltung = kirchenmitglied ? abgeltungsteuer * tauxKirche : 0;

  /* Niveau associe — remuneration imposee comme un salaire */
  const zvESalaire = Math.max(
    0,
    salaire - forfaits.arbeitnehmerPauschbetrag - forfaits.sonderausgabenPauschbetrag,
  );
  const perso = impositionPersonnelle({
    zvE: zvESalaire, splitting, kirchenmitglied, bundesland, annee,
  });

  const chargeTotale = gewSt.steuer + koerperschaftsteuer + soliKoerperschaftsteuer
    + perso.total + abgeltungsteuer + soliAbgeltung + kistAbgeltung;

  const revenuDisponible = (salaire - perso.total)
    + (distribution - abgeltungsteuer - soliAbgeltung - kistAbgeltung);

  return {
    forme: typeSociete,
    beneficeSociete,
    remuneration: salaire,
    distribution,
    postes: {
      gewerbesteuer: gewSt.steuer,
      anrechnungGewerbesteuer: 0,
      koerperschaftsteuer,
      soliKoerperschaftsteuer,
      einkommensteuer: perso.impot,
      soli: perso.soli,
      kirchensteuer: perso.kist + kistAbgeltung,
      abgeltungsteuer: abgeltungsteuer + soliAbgeltung,
    },
    detailGewerbesteuer: gewSt,
    chargeTotale,
    revenuDisponible,
    resteDansSociete: Math.max(0, beneficeApresImpots) - distribution,
    tauxCharge: benefice > 0 ? chargeTotale / benefice : 0,
    stammkapitalMinimum: forme.stammkapitalMinimum,
    reserveObligatoire: Math.max(0, beneficeApresImpots) * forme.thesaurierungsquote,
  };
}

/* --- Comparaison des quatre formes ---------------------------------------- */
export function comparerFormesJuridiques(entree) {
  const parametres = {
    benefice: Math.max(0, entree.benefice || 0),
    remuneration: Math.max(0, entree.remuneration || 0),
    hebesatz: entree.hebesatz || 410,
    quoteDistribution: entree.quoteDistribution ?? 1,
    splitting: !!entree.splitting,
    kirchenmitglied: !!entree.kirchenmitglied,
    bundesland: entree.bundesland || 'BE',
    annee: entree.annee || ANNEE_DEFAUT,
  };

  const resultats = [
    calculerEntrepriseIndividuelle(parametres, false),
    calculerEntrepriseIndividuelle(parametres, true),
    calculerSocieteDeCapitaux(parametres, 'ug'),
    calculerSocieteDeCapitaux(parametres, 'gmbh'),
  ];

  /* Un euro laisse dans la societe ne vaut pas un euro en poche : il supporte
     encore le prelevement forfaitaire le jour ou il sera distribue. Sans cette
     decote, l'UG paraitrait meilleure que la GmbH alors qu'elles sont
     fiscalement identiques — son avantage apparent ne viendrait que de la
     reserve qu'elle est obligee de constituer. */
  const kest = KAPITALERTRAGSTEUER[parametres.annee] || KAPITALERTRAGSTEUER[ANNEE_DEFAUT];
  const tauxKirche = parametres.kirchenmitglied
    ? (KIRCHENSTEUER_TAUX[parametres.bundesland] ?? KIRCHENSTEUER_TAUX.DEFAUT)
    : 0;
  const chargeDifferee = kest.satz * (1 + kest.soliSatz + tauxKirche);
  const valeurCreee = (r) => r.revenuDisponible + r.resteDansSociete * (1 - chargeDifferee);
  const classement = [...resultats].sort((a, b) => valeurCreee(b) - valeurCreee(a));

  const meilleure = classement[0];
  const pire = classement[classement.length - 1];

  return {
    parametres,
    resultats,
    classement: classement.map((r) => r.forme),
    meilleure: meilleure.forme,
    ecartMaximal: valeurCreee(meilleure) - valeurCreee(pire),
    chargeDifferee,
    valeurCreee,
  };
}
