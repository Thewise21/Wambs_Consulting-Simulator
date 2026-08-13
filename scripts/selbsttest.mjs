/* ============================================================================
 * Auto-controle des moteurs de calcul — `npm run selbsttest`
 * ----------------------------------------------------------------------------
 * A executer apres chaque mise a jour des constantes dans
 * src/calculators/parameter.js (typiquement en decembre pour l'annee suivante).
 * Le script verifie la coherence interne du bareme et affiche des valeurs de
 * reference que l'on peut confronter a un calculateur officiel
 * (BMF-Lohn- und Einkommensteuerrechner).
 * ========================================================================== */
import {
  einkommensteuer,
  einkommensteuerSplitting,
  solidaritaetszuschlag,
  progressionsvorbehalt,
  tauxMarginal,
} from '../src/calculators/estTarif.js';
import { calculerBruttoNetto } from '../src/calculators/bruttoNetto.js';
import { calculerHonoraire, PRESTATIONS } from '../src/calculators/stbvv.js';
import { analyserExpatriation } from '../src/calculators/expat.js';
import { calculerGewerbesteuer } from '../src/calculators/gewerbesteuer.js';
import { comparerFormesJuridiques } from '../src/calculators/rechtsform.js';
import { analyserKleinunternehmer } from '../src/calculators/kleinunternehmer.js';
import { calculerFirmenwagen } from '../src/calculators/firmenwagen.js';
import { analyserImmobilier, analyserKaufnebenkosten, fraisAcquisition } from '../src/calculators/immobilien.js';
import { analyserPhotovoltaique } from '../src/calculators/photovoltaik.js';
import { analyserAbfindung } from '../src/calculators/abfindung.js';
import { analyserAltersvorsorge } from '../src/calculators/altersvorsorge.js';
import { analyserSuccession } from '../src/calculators/erbschaft.js';
import { analyserErklaerungspflicht } from '../src/calculators/erklaerungspflicht.js';
import { analyserUnterhalt, calculerOpfergrenze } from '../src/calculators/unterhalt.js';
import { analyserKindergeldAusland, regimePourPays } from '../src/calculators/kindergeldAusland.js';
import { analyserRentenerstattung } from '../src/calculators/rentenerstattung.js';
import { STAND, TARIF, PREVOYANCE, UNTERHALT, ANNEE_DEFAUT } from '../src/calculators/parameter.js';

const eur = (v) => `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(v)} EUR`;
const pct = (v) => `${(v * 100).toFixed(1)} %`;

let erreurs = 0;
function verifier(libelle, condition, detail = '') {
  if (condition) {
    console.log(`  OK   ${libelle}`);
  } else {
    erreurs += 1;
    console.log(`  ECHEC ${libelle} ${detail}`);
  }
}

console.log(`\n=== Auto-controle — parametres au ${STAND}, annee par defaut ${ANNEE_DEFAUT} ===\n`);

/* --- 1. Bareme § 32a EStG ------------------------------------------------- */
console.log('1. Bareme de l\'impot sur le revenu');
for (const annee of Object.keys(TARIF).map(Number).sort((a, b) => b - a)) {
  const p = TARIF[annee];
  verifier(
    `${annee} — pas d'impot jusqu'au Grundfreibetrag (${p.grundfreibetrag})`,
    einkommensteuer(p.grundfreibetrag, annee) === 0 && einkommensteuer(p.grundfreibetrag + 1, annee) >= 0,
  );

  /* Continuite : l'ecart d'impot d'un euro a la frontiere d'une zone doit
     rester inferieur a 1 EUR, sinon une constante est fausse. */
  for (const borne of [p.zone2Fin, p.zone3Fin, p.zone4Fin]) {
    const ecart = einkommensteuer(borne + 1, annee) - einkommensteuer(borne, annee);
    verifier(`${annee} — continuite a ${borne} (ecart ${ecart} EUR)`, ecart >= 0 && ecart <= 1, `ecart=${ecart}`);
  }

  /* Monotonie stricte et taux marginal plafonne a 45 % */
  let monotone = true;
  let marginalOk = true;
  for (let zve = 1000; zve <= 400000; zve += 997) {
    if (einkommensteuer(zve + 100, annee) < einkommensteuer(zve, annee)) monotone = false;
    if (tauxMarginal(zve, false, annee) > 0.4501) marginalOk = false;
  }
  verifier(`${annee} — impot strictement croissant`, monotone);
  verifier(`${annee} — taux marginal <= 45 %`, marginalOk);

  /* Le splitting ne peut jamais couter plus cher que le bareme de base */
  verifier(
    `${annee} — splitting toujours <= bareme de base`,
    [20000, 60000, 120000, 300000].every((z) => einkommensteuerSplitting(z, annee) <= einkommensteuer(z, annee)),
  );
}

console.log('\n   Valeurs de reference a confronter au calculateur du BMF :');
for (const zve of [15000, 30000, 50000, 70000, 100000, 300000]) {
  const est = einkommensteuer(zve, ANNEE_DEFAUT);
  console.log(`   zvE ${String(zve).padStart(7)} -> ESt ${String(est).padStart(7)} (taux moyen ${pct(est / zve)})`);
}

/* --- 2. Solidaritatszuschlag --------------------------------------------- */
console.log('\n2. Solidaritatszuschlag');
verifier('nul sous la franchise', solidaritaetszuschlag(20000, false, ANNEE_DEFAUT) === 0);
verifier('zone d\'allegement progressive', solidaritaetszuschlag(21000, false, ANNEE_DEFAUT) > 0
  && solidaritaetszuschlag(21000, false, ANNEE_DEFAUT) < 0.055 * 21000);
verifier('plafonne a 5,5 % au-dela', Math.abs(solidaritaetszuschlag(200000, false, ANNEE_DEFAUT) - 0.055 * 200000) < 0.01);
verifier('franchise doublee en cas de splitting', solidaritaetszuschlag(30000, true, ANNEE_DEFAUT) === 0);

/* --- 3. Progressionsvorbehalt -------------------------------------------- */
console.log('\n3. Progressionsvorbehalt (§ 32b EStG)');
const pv = progressionsvorbehalt(30000, 20000, false, ANNEE_DEFAUT);
verifier('le supplement est positif', pv.supplement > 0);
verifier('le taux special depasse le taux normal', pv.tauxSpecial > pv.tauxNormal);
verifier('sans revenus exoneres, aucun effet', progressionsvorbehalt(30000, 0, false, ANNEE_DEFAUT).supplement === 0);
console.log(`   30.000 EUR imposables + 20.000 EUR exoneres -> surcout ${eur(pv.supplement)} `
  + `(taux ${pct(pv.tauxNormal)} -> ${pct(pv.tauxSpecial)})`);

/* --- 4. Brut / net -------------------------------------------------------- */
console.log('\n4. Calculateur brut / net');
const base = {
  bundesland: 'BE', kirchenmitglied: false, sansEnfant: true,
  enfantsMoins25: 0, kinderfreibetraege: 0, kvType: 'gesetzlich', annee: ANNEE_DEFAUT,
};
let netCroissant = true;
for (let brut = 15000; brut < 200000; brut += 5000) {
  const a = calculerBruttoNetto({ ...base, bruttoAnnuel: brut, klasse: 'I' });
  const b = calculerBruttoNetto({ ...base, bruttoAnnuel: brut + 5000, klasse: 'I' });
  if (b.netAnnuel <= a.netAnnuel) netCroissant = false;
}
verifier('le net augmente toujours avec le brut', netCroissant);

const cl = (k, brut = 50000) => calculerBruttoNetto({ ...base, bruttoAnnuel: brut, klasse: k });
verifier('classe III plus avantageuse que classe I', cl('III').netAnnuel > cl('I').netAnnuel);
verifier('classe V moins avantageuse que classe I', cl('V').netAnnuel < cl('I').netAnnuel);
verifier('classe VI la moins avantageuse', cl('VI').netAnnuel <= cl('V').netAnnuel);
verifier('plancher de 14 % applique en classe V a bas revenu',
  cl('V', 14000).postes.lohnsteuer > 0);
verifier('cout employeur superieur au brut', cl('I').coutEmployeur > 50000);
verifier('plafonnement des cotisations au-dela de la BBG',
  cl('I', 200000).detailsTechniques.assietteRVPlafonnee === true);

console.log('\n   Celibataire, classe I, Berlin, sans confession :');
for (const brut of [30000, 45000, 60000, 90000]) {
  const r = cl('I', brut);
  console.log(`   Brut ${eur(brut).padStart(12)} -> net ${eur(r.netMensuel).padStart(10)}/mois `
    + `| impots ${eur(r.totalImpots).padStart(10)} | social ${eur(r.totalSocial).padStart(10)} `
    + `| net ${pct(r.tauxNet)}`);
}

/* --- 5. StBVV ------------------------------------------------------------- */
console.log('\n5. Honoraires StBVV');
const devis = calculerHonoraire({
  prestations: ['einkommensteuer', 'ustVoranmeldung', 'buchfuehrung'],
  sommeEinkuenfte: 60000,
  jahresumsatz: 200000,
  betriebsausgaben: 120000,
  annee: ANNEE_DEFAUT,
});
verifier('le devis contient trois lignes', devis.lignes.length === 3);
verifier('minimum <= moyen <= maximum',
  devis.totaux.min <= devis.totaux.moyen && devis.totaux.moyen <= devis.totaux.max);
verifier('la TVA est ajoutee', devis.totaux.moyenTTC > devis.totaux.moyen);
verifier('chaque ligne cite sa base legale', devis.lignes.every((l) => !!l.paragraphe));
verifier('toutes les prestations sont calculables',
  Object.keys(PRESTATIONS).every((cle) => {
    const d = calculerHonoraire({
      prestations: [cle], sommeEinkuenfte: 60000, jahresumsatz: 200000,
      betriebsausgaben: 120000, bilanzsumme: 500000, gewerbeertrag: 50000,
      einkommenKoerperschaft: 40000, mieteinnahmen: 20000, nombreSalaries: 5,
      annee: ANNEE_DEFAUT,
    });
    return d.lignes.length === 1 && d.lignes[0].moyen > 0;
  }));

/* Regression : la valeur de l'objet d'une declaration de TVA porte sur la
 * periode declaree, pas sur l'annee. Une erreur ici multipliait l'honoraire
 * par le nombre de periodes. */
const ustMensuel = calculerHonoraire({ prestations: ['ustVoranmeldung'], jahresumsatz: 150000, ustPeriodicite: 12 });
const ustTrimestriel = calculerHonoraire({ prestations: ['ustVoranmeldung'], jahresumsatz: 150000, ustPeriodicite: 4 });
verifier('assiette TVA calculee par periode et non par an',
  Math.abs(ustMensuel.lignes[0].gegenstandswert - 1250) < 1,
  `obtenu ${ustMensuel.lignes[0].gegenstandswert}`);
verifier('declarer mensuellement coute plus cher qu\'au trimestre',
  ustMensuel.totaux.moyen > ustTrimestriel.totaux.moyen);
verifier('honoraire TVA annuel dans un ordre de grandeur plausible',
  ustMensuel.totaux.moyen > 200 && ustMensuel.totaux.moyen < 1200,
  `obtenu ${Math.round(ustMensuel.totaux.moyen)} EUR`);
verifier('plancher de 650 EUR applique aux petits chiffres d\'affaires',
  calculerHonoraire({ prestations: ['ustVoranmeldung'], jahresumsatz: 12000, ustPeriodicite: 12 })
    .lignes[0].gegenstandswert === 650);

console.log(`   Exemple freelance (60k revenus, 200k CA) -> ${eur(devis.totaux.moyenTTC)} TTC par an (fourchette `
  + `${eur(devis.totaux.minTTC)} - ${eur(devis.totaux.maxTTC)})`);
console.log(`   TVA mensuelle sur 150k de CA -> ${eur(ustMensuel.totaux.moyen)} par an `
  + `(${eur(ustMensuel.totaux.moyen / 12)} par declaration)`);

/* --- 6. Expatriation ------------------------------------------------------ */
console.log('\n6. Simulateur expatriation');
const expat = analyserExpatriation({
  situation: 'arrivee',
  moisArrivee: 7,
  paysOrigine: 'FR',
  revenuAllemand: 30000,
  revenuEtranger: 25000,
  statut: 'marie',
  conjointResteAlEtranger: true,
  revenuConjoint: 10000,
  enfants: 2,
  annee: ANNEE_DEFAUT,
});
verifier('assujettissement partiel detecte', expat.typeAssujettissement === 'wechsel');
verifier('Progressionsvorbehalt applique', expat.progression.supplement > 0);
verifier('obligation de declarer signalee', expat.obligationDeclaration === true);
verifier('splitting § 1a examine pour un conjoint dans l\'UE', expat.splittingPossible !== null);
verifier('au moins trois points de vigilance', expat.alertes.length >= 3);
verifier('checklist non vide', expat.checklist.length > 0);
console.log(`   Arrivee en juillet depuis la France -> surcout du Progressionsvorbehalt `
  + `${eur(expat.progression.supplement)}`);

/* --- 7. Taxe professionnelle ---------------------------------------------- */
console.log('\n7. Taxe professionnelle');
const gewEI = calculerGewerbesteuer({ gewinn: 80000, hebesatz: 410, kapitalgesellschaft: false });
const gewGmbH = calculerGewerbesteuer({ gewinn: 80000, hebesatz: 410, kapitalgesellschaft: true });
verifier('abattement de 24.500 EUR pour la personne physique', gewEI.freibetrag === 24500);
verifier('aucun abattement pour la societe de capitaux', gewGmbH.freibetrag === 0);
verifier('la societe de capitaux paie davantage', gewGmbH.steuer > gewEI.steuer);
verifier('aucune imputation pour la societe de capitaux', gewGmbH.anrechnungPotentielle === 0);
verifier('arrondi du Gewerbeertrag a la centaine inferieure',
  calculerGewerbesteuer({ gewinn: 80099, hebesatz: 410 }).ertrag === 80000);
verifier('imputation integrale a un Hebesatz de 400 %',
  Math.abs(calculerGewerbesteuer({ gewinn: 80000, hebesatz: 400 }).chargeApresAnrechnung) < 0.01);
verifier('charge residuelle au-dela de 400 %', gewEI.chargeApresAnrechnung > 0);
verifier('benefice sous l\'abattement : aucune taxe',
  calculerGewerbesteuer({ gewinn: 20000, hebesatz: 410 }).steuer === 0);
console.log(`   80.000 EUR a Berlin (410 %) -> entreprise individuelle ${eur(gewEI.steuer)} `
  + `dont ${eur(gewEI.chargeApresAnrechnung)} apres imputation | GmbH ${eur(gewGmbH.steuer)}`);

/* --- 8. Forme juridique ---------------------------------------------------- */
console.log('\n8. Comparateur de forme juridique');
const communs = { hebesatz: 410, bundesland: 'BE', kirchenmitglied: false, splitting: false, annee: ANNEE_DEFAUT };
const compare = (benefice, remuneration, quote) => comparerFormesJuridiques({
  ...communs, benefice, remuneration, quoteDistribution: quote,
});

const petit = compare(45000, 30000, 1);
const grand = compare(250000, 90000, 0);
verifier('quatre formes comparees', petit.resultats.length === 4);
verifier('charges toujours positives', petit.resultats.every((r) => r.chargeTotale >= 0));
verifier('taux de charge plausible', petit.resultats.every((r) => r.tauxCharge >= 0 && r.tauxCharge < 0.7));
verifier('la profession liberale echappe a la taxe professionnelle',
  petit.resultats.find((r) => r.forme === 'freiberufler').postes.gewerbesteuer === 0);
verifier('a faible benefice, l\'entreprise individuelle devance la GmbH',
  petit.valeurCreee(petit.resultats.find((r) => r.forme === 'einzelunternehmen'))
  > petit.valeurCreee(petit.resultats.find((r) => r.forme === 'gmbh')));
/* La societe de capitaux reporte l'impot, elle ne l'evite pas : sa charge
   immediate est plus faible, mais la distribution ulterieure renverse
   l'avantage. C'est le message central de cet outil. */
verifier('a fort benefice thesaurise, la societe differe l\'impot',
  grand.resultats.find((r) => r.forme === 'gmbh').chargeTotale
  < grand.resultats.find((r) => r.forme === 'einzelunternehmen').chargeTotale);
verifier('mais la distribution ulterieure renverse l\'avantage',
  grand.valeurCreee(grand.resultats.find((r) => r.forme === 'einzelunternehmen'))
  > grand.valeurCreee(grand.resultats.find((r) => r.forme === 'gmbh')));
verifier('reserve obligatoire dotee dans l\'UG',
  grand.resultats.find((r) => r.forme === 'ug').reserveObligatoire > 0);
verifier('la GmbH ne dote aucune reserve obligatoire',
  grand.resultats.find((r) => r.forme === 'gmbh').reserveObligatoire === 0);
/* Regression : sans decote sur les benefices laisses en societe, l'UG
   paraissait meilleure que la GmbH alors que leur fiscalite est identique. */
const distributionIntegrale = compare(120000, 60000, 1);
verifier('UG et GmbH a egalite en distribution integrale',
  Math.abs(
    distributionIntegrale.valeurCreee(distributionIntegrale.resultats.find((r) => r.forme === 'ug'))
    - distributionIntegrale.valeurCreee(distributionIntegrale.resultats.find((r) => r.forme === 'gmbh')),
  ) < 1);
verifier('decote appliquee aux benefices thesaurises',
  grand.chargeDifferee > 0.26 && grand.chargeDifferee < 0.27);
verifier('la remuneration ne peut exceder le benefice',
  compare(50000, 90000, 1).resultats.find((r) => r.forme === 'gmbh').remuneration === 50000);
for (const r of grand.resultats) {
  console.log(`   ${r.forme.padEnd(20)} charge ${eur(r.chargeTotale).padStart(12)} `
    + `(${pct(r.tauxCharge)}) | disponible ${eur(r.revenuDisponible).padStart(12)} `
    + `| en societe ${eur(r.resteDansSociete).padStart(12)}`);
}

/* --- 9. Kleinunternehmer ---------------------------------------------------- */
console.log('\n9. Kleinunternehmerregelung');
const b2c = analyserKleinunternehmer({ umsatz: 20000, vorjahresumsatz: 18000, partParticuliers: 1, achats: 1000 });
const b2b = analyserKleinunternehmer({ umsatz: 20000, vorjahresumsatz: 18000, partParticuliers: 0, achats: 6000 });
verifier('clientele de particuliers : la franchise l\'emporte', b2c.recommandation === 'kleinunternehmer');
verifier('clientele professionnelle : le regime normal l\'emporte', b2b.recommandation === 'regelbesteuerung');
verifier('eligible sous les deux seuils', b2c.eligible === true);
verifier('inegible au-dela du chiffre d\'affaires de l\'annee precedente',
  analyserKleinunternehmer({ umsatz: 30000, vorjahresumsatz: 30000 }).eligible === false);
verifier('premiere annee : seul le plafond courant compte',
  analyserKleinunternehmer({ umsatz: 30000, vorjahresumsatz: 0, premiereAnnee: true }).eligible === true);
verifier('bascule signalee au-dela de 25.000 EUR',
  analyserKleinunternehmer({ umsatz: 40000, vorjahresumsatz: 20000 })
    .alertes.some((a) => a.cle === 'basculeAnneeProchaine'));
verifier('seuil de bascule compris entre 0 et 1',
  b2b.seuilBascule === null || (b2b.seuilBascule >= 0 && b2b.seuilBascule <= 1));
verifier('la TVA non deductible est un cout pour le Kleinunternehmer',
  b2b.kleinunternehmer.depenses > b2b.regimeNormal.depenses);
console.log(`   20.000 EUR de CA, 100 % particuliers -> franchise favorable de ${eur(-b2c.difference)}`);
console.log(`   20.000 EUR de CA, 100 % professionnels, 6.000 EUR d'achats -> regime normal favorable de ${eur(b2b.difference)}`);

/* --- 10. Vehicule de fonction ---------------------------------------------- */
console.log('\n10. Vehicule de fonction');
const contexteVehicule = {
  bruttoAnnuel: 60000, klasse: 'I', bundesland: 'BE', distanceTravail: 20,
  joursTravailles: 220, annee: ANNEE_DEFAUT,
};
const thermique = calculerFirmenwagen({ ...contexteVehicule, bruttolistenpreis: 50000, motorisation: 'verbrenner' });
const electrique = calculerFirmenwagen({ ...contexteVehicule, bruttolistenpreis: 50000, motorisation: 'elektro' });
const electriqueCher = calculerFirmenwagen({ ...contexteVehicule, bruttolistenpreis: 120000, motorisation: 'elektro' });

verifier('assiette pleine pour le thermique', thermique.base.part === 1);
verifier('assiette au quart sous le plafond electrique', electrique.base.part === 0.25);
verifier('assiette a la moitie au-dessus du plafond', electriqueCher.base.part === 0.5);
verifier('le vehicule a un cout net positif', thermique.forfait.coutAnnuel > 0);
verifier('l\'electrique coute moins cher que le thermique',
  electrique.forfait.coutAnnuel < thermique.forfait.coutAnnuel);
verifier('economie electrique chiffree', electrique.comparaisonThermique.economie > 0);
verifier('carnet ignore sans donnees de cout', thermique.carnetExploitable === false);
const avecCarnet = calculerFirmenwagen({
  ...contexteVehicule, bruttolistenpreis: 50000, motorisation: 'verbrenner',
  coutAnnuelVehicule: 9000, kmTotal: 30000, kmPrives: 3000,
});
verifier('carnet exploitable avec les couts reels', avecCarnet.carnetExploitable === true);
verifier('faible usage prive : le carnet l\'emporte', avecCarnet.meilleureMethode === 'carnet');
verifier('deduction pour trajets calculee', thermique.deductionTrajets > 0);
console.log(`   Thermique 50.000 EUR -> ${eur(thermique.forfait.coutMensuel)}/mois `
  + `| electrique -> ${eur(electrique.forfait.coutMensuel)}/mois `
  + `(economie ${eur(electrique.comparaisonThermique.economie)}/an)`);
console.log(`   Carnet de bord (3.000 km prives sur 30.000) -> ${eur(avecCarnet.carnet.coutMensuel)}/mois `
  + `contre ${eur(avecCarnet.forfait.coutMensuel)}/mois au forfait`);

/* --- 11. Immobilier locatif ------------------------------------------------- */
console.log('\n11. Immobilier locatif et frais d\'acquisition');
const bien = analyserImmobilier({
  prix: 300000, partTerrain: 0.2, bundesland: 'BE', courtier: true,
  loyerAnnuel: 14400, chargesAnnuelles: 2400, interetsAnnuels: 7500,
  remboursementCapital: 4500, autresRevenus: 70000, typeAmortissement: 'habitationDepuis1925',
});
verifier('le terrain est exclu de la base amortissable',
  Math.abs(bien.baseAmortissable - (300000 + bien.frais.total) * 0.8) < 1);
verifier('amortissement au taux retenu', Math.abs(bien.tauxAmortissement - 0.02) < 1e-9);
verifier('les frais d\'acquisition depassent 10 % a Berlin avec courtier', bien.frais.part > 0.1);
verifier('un deficit foncier reduit l\'impot', bien.resultatFiscal < 0 && bien.effetImpot < 0);
verifier('rendement brut superieur au rendement net', bien.rendementBrut > bien.rendementNet);
const bienBenefice = analyserImmobilier({
  prix: 200000, partTerrain: 0.2, loyerAnnuel: 20000, chargesAnnuelles: 1000,
  interetsAnnuels: 0, autresRevenus: 60000,
});
verifier('un benefice foncier augmente l\'impot', bienBenefice.effetImpot > 0);
verifier('taux de mutation correct en Baviere',
  Math.abs(fraisAcquisition({ prix: 100000, bundesland: 'BY', courtier: false }).tauxMutation - 0.035) < 1e-9);
const nebenkosten = analyserKaufnebenkosten({ prix: 400000, bundesland: 'NW', courtier: true, apport: 30000 });
verifier('apport insuffisant detecte', nebenkosten.apportSuffisant === false);
verifier('ecart entre Lands chiffre', nebenkosten.economieAilleurs > 0);
console.log(`   300.000 EUR a Berlin avec courtier -> frais ${eur(bien.frais.total)} (${pct(bien.frais.part)}) `
  + `| tresorerie ${eur(bien.fluxMensuelApresImpot)}/mois apres impot`);

/* --- 12. Photovoltaique ------------------------------------------------------ */
console.log('\n12. Photovoltaique');
const pvPetite = analyserPhotovoltaique({ puissanceKwp: 12, unites: 1, investissement: 18000 });
const pvGrande = analyserPhotovoltaique({ puissanceKwp: 45, unites: 1, investissement: 60000 });
const pvImmeuble = analyserPhotovoltaique({ puissanceKwp: 45, unites: 3, investissement: 60000 });
const pvCumul = analyserPhotovoltaique({ puissanceKwp: 30, unites: 1, autresInstallationsKwp: 80 });
verifier('installation de 12 kWp exoneree', pvPetite.exonere === true);
verifier('45 kWp sur une seule unite : au-dela de la limite', pvGrande.exonere === false);
verifier('45 kWp sur trois unites : dans la limite', pvImmeuble.exonere === true);
verifier('plafond de 100 kWp par contribuable applique', pvCumul.respecteContribuable === false);
verifier('taux zero de TVA chiffre', pvPetite.tvaEconomisee > 0);
verifier('aucun impot si exoneree', pvPetite.impotSiImposable === 0);
verifier('impot du si non exoneree', pvGrande.impotSiImposable > 0);
console.log(`   12 kWp -> ${eur(pvPetite.beneficeAnnuel)} par an, exoneres | TVA evitee ${eur(pvPetite.tvaEconomisee)}`);

/* --- 13. Indemnite de depart -------------------------------------------------- */
console.log('\n13. Indemnite de depart');
const abf = analyserAbfindung({ indemnite: 60000, revenuRestant: 45000 });
verifier('la regle du cinquieme ne peut pas desavantager', abf.chargeRetenue <= abf.chargeOrdinaire);
verifier('economie chiffree', abf.economie >= 0);
verifier('net inferieur a l\'indemnite brute', abf.netIndemnite < abf.indemnite);
verifier('taux effectif plausible', abf.tauxEffectif > 0 && abf.tauxEffectif < 0.5);
verifier('avertissement sur le prelevement mensuel',
  abf.alertes.some((a) => a.cle === 'plusDePrelevement'));
const abfHautRevenu = analyserAbfindung({ indemnite: 60000, revenuRestant: 250000 });
verifier('sans effet a taux marginal maximal', abfHautRevenu.economie < abf.economie);
console.log(`   60.000 EUR sur 45.000 EUR de salaire -> impot ${eur(abf.chargeTotale)} `
  + `(${pct(abf.tauxEffectif)}), economie ${eur(abf.economie)}`);

/* --- 14. Prevoyance vieillesse ------------------------------------------------ */
console.log('\n14. Prevoyance vieillesse');
const prev = analyserAltersvorsorge({ brutAnnuel: 60000, age: 40, ageRetraite: 67, epargneAnnuelle: 6000, enfants: 2 });
verifier('deficit de retraite positif', prev.deficitAnnuel > 0);
verifier('pension nette inferieure a la pension brute', prev.renteNetteAnnuelle <= prev.renteBruteAnnuelle);
verifier('economie Rurup positive', prev.ruerup.economie > 0);
verifier('effort net inferieur au versement', prev.ruerup.effortNet < prev.ruerup.versement);
verifier('primes Riester majorees par les enfants', prev.riester.zulages > 175);
verifier('capital constitue superieur aux versements cumules',
  prev.ruerup.capital > prev.ruerup.versement * prev.anneesRestantes * 0.99);
verifier('versement Rurup plafonne',
  analyserAltersvorsorge({ brutAnnuel: 200000, age: 40, epargneAnnuelle: 99999 }).ruerup.versement
  === PREVOYANCE[ANNEE_DEFAUT].ruerupPlafond);
console.log(`   60.000 EUR a 40 ans -> deficit ${eur(prev.deficitMensuel)}/mois `
  + `| 6.000 EUR en Rurup coutent ${eur(prev.ruerup.effortNet)} net`);

/* --- 15. Succession et donation ----------------------------------------------- */
console.log('\n15. Succession et donation');
const succEnfant = analyserSuccession({ patrimoine: 600000, lien: 'enfant', beneficiaires: 1 });
const succDeuxEnfants = analyserSuccession({ patrimoine: 600000, lien: 'enfant', beneficiaires: 2 });
const succNeveu = analyserSuccession({ patrimoine: 600000, lien: 'neveu', beneficiaires: 1 });
const succConjoint = analyserSuccession({ patrimoine: 600000, lien: 'conjoint', beneficiaires: 1 });
verifier('abattement enfant de 400.000 EUR', succEnfant.abattementBase === 400000);
verifier('deux enfants paient moins qu\'un seul', succDeuxEnfants.impotTotal < succEnfant.impotTotal);
verifier('la classe II est plus lourde que la classe I', succNeveu.impotTotal > succEnfant.impotTotal);
verifier('abattement de pension pour le conjoint au deces', succConjoint.versorgung > 0);
verifier('aucun abattement de pension en donation',
  analyserSuccession({ patrimoine: 600000, lien: 'conjoint', donation: true }).versorgung === 0);
verifier('sous l\'abattement, aucun impot',
  analyserSuccession({ patrimoine: 300000, lien: 'enfant' }).impotTotal === 0);
verifier('l\'etalement sur dix ans reduit la charge', succEnfant.gainEtalement > 0);
console.log(`   600.000 EUR a un enfant -> ${eur(succEnfant.impotTotal)} | a deux enfants -> `
  + `${eur(succDeuxEnfants.impotTotal)} | a un neveu -> ${eur(succNeveu.impotTotal)}`);

/* --- 16. Obligation de declarer et delais -------------------------------------- */
console.log('\n16. Obligation de declarer et delais');
const oblig = analyserErklaerungspflicht({
  anneeFiscale: 2025, motifs: ['revenusAnnexes', 'classeVouFacteur'], revenusAnnexesMontant: 2000,
});
const libre = analyserErklaerungspflicht({ anneeFiscale: 2025, motifs: [], volontaires: ['fraisEleves'] });
const sousSeuil = analyserErklaerungspflicht({
  anneeFiscale: 2025, motifs: ['revenusAnnexes'], revenusAnnexesMontant: 300,
});
verifier('obligation detectee', oblig.obligatoire === true);
verifier('aucune obligation sans motif', libre.obligatoire === false);
verifier('seuil de 410 EUR applique', sousSeuil.obligatoire === false);
verifier('delai sans conseil au 31 juillet',
  oblig.echeanceSansConseil.getUTCMonth() === 6 && oblig.echeanceSansConseil.getUTCFullYear() === 2026);
verifier('delai avec conseil en fevrier de la deuxieme annee',
  oblig.echeanceAvecConseil.getUTCFullYear() === 2027 && oblig.echeanceAvecConseil.getUTCMonth() <= 2);
verifier('le conseil apporte plus de six mois', oblig.joursSupplementaires > 180);
verifier('quatre ans pour la declaration volontaire',
  libre.echeanceVolontaire.getUTCFullYear() === 2029);
console.log(`   Exercice 2025 -> sans conseil ${oblig.echeanceSansConseil.toISOString().slice(0, 10)}, `
  + `avec conseil ${oblig.echeanceAvecConseil.toISOString().slice(0, 10)} `
  + `(+${oblig.joursSupplementaires} jours)`);

/* --- 17. Soutien aux proches a l'etranger (§ 33a EStG) ---------------------- */
console.log('\n17. Soutien aux proches a l\'etranger');
const communUnterhalt = {
  montantVerse: 6000, nombrePersonnes: 1, revenusPersonne: 0, moisSoutien: 12,
  parVirement: true, revenuNetPayeur: 30000, revenuImposablePayeur: 38000,
};
const uGroupe4 = analyserUnterhalt({ ...communUnterhalt, laendergruppe: 4 });
const uGroupe1 = analyserUnterhalt({ ...communUnterhalt, laendergruppe: 1 });
verifier('plafond reduit au quart en groupe 4',
  Math.abs(uGroupe4.plafondPlein - UNTERHALT[ANNEE_DEFAUT].hoechstbetrag * 0.25) < 1);
verifier('plafond plein en groupe 1',
  Math.abs(uGroupe1.plafondPlein - UNTERHALT[ANNEE_DEFAUT].hoechstbetrag) < 1);
verifier('le groupe 1 permet de deduire davantage', uGroupe1.deductibleTotal > uGroupe4.deductibleTotal);
verifier('especes : plus rien de deductible depuis 2025',
  analyserUnterhalt({ ...communUnterhalt, laendergruppe: 4, parVirement: false }).deductibleTotal === 0);
verifier('beneficiaire apte au travail : deduction refusee',
  analyserUnterhalt({ ...communUnterhalt, laendergruppe: 4, beneficiaireApteAuTravail: true }).deductibleTotal === 0);
verifier('revenus du beneficiaire imputes au-dela de 624 EUR',
  analyserUnterhalt({ ...communUnterhalt, laendergruppe: 1, revenusPersonne: 2624 }).imputation === 2000);
verifier('reduction par douzieme si soutien partiel',
  Math.abs(analyserUnterhalt({ ...communUnterhalt, laendergruppe: 1, moisSoutien: 6 }).plafondProrata
    - uGroupe1.plafondPlein / 2) < 1);
verifier('Opfergrenze plafonne le soutien hors conjoint',
  analyserUnterhalt({ ...communUnterhalt, laendergruppe: 1, montantVerse: 12000, revenuNetPayeur: 20000 })
    .limiteParOpfergrenze === true);
verifier('Opfergrenze inapplicable au conjoint',
  analyserUnterhalt({ ...communUnterhalt, laendergruppe: 1, montantVerse: 12000, revenuNetPayeur: 20000, conjointBeneficiaire: true })
    .limiteParOpfergrenze === false);
verifier('Opfergrenze plafonnee a 50 %',
  calculerOpfergrenze({ revenuNet: 500000, conjoint: false, enfants: 0 }).part === 0.5);
verifier('Opfergrenze reduite par conjoint et enfants',
  calculerOpfergrenze({ revenuNet: 100000, conjoint: true, enfants: 2 }).part
  < calculerOpfergrenze({ revenuNet: 100000, conjoint: false, enfants: 0 }).part);
verifier('economie d\'impot positive', uGroupe4.economie > 0);
console.log(`   6.000 EUR envoyes, groupe 4 -> ${eur(uGroupe4.deductibleTotal)} deductibles, `
  + `economie ${eur(uGroupe4.economie)} | groupe 1 -> ${eur(uGroupe1.deductibleTotal)} deductibles`);

/* --- 18. Allocations pour enfants a l'etranger ------------------------------ */
console.log('\n18. Allocations pour enfants a l\'etranger');
const communKg = { enfants: 2, revenuImposable: 45000, laendergruppe: 4 };
const kgUE = analyserKindergeldAusland({ ...communKg, regime: 'ue', laendergruppe: 1 });
const kgAbkommen = analyserKindergeldAusland({ ...communKg, regime: 'abkommen' });
const kgTiers = analyserKindergeldAusland({ ...communKg, regime: 'drittstaat' });
verifier('droit plein dans l\'UE', kgUE.droitAllocations === true);
verifier('aucun droit en Etat tiers', kgTiers.droitAllocations === false);
verifier('Etat conventionne : droit sous condition d\'activite', kgAbkommen.droitAllocations === true);
verifier('sans activite cotisante, pas de droit conventionnel',
  analyserKindergeldAusland({ ...communKg, regime: 'abkommen', activiteCotisante: false }).droitAllocations === false);
verifier('abattement reduit au quart en groupe 4',
  Math.abs(kgTiers.abattementReduit - kgTiers.abattementPlein * 0.25) < 1);
verifier('l\'abattement subsiste meme sans allocations', kgTiers.economieAbattement > 0);
verifier('regime UE plus favorable que l\'Etat tiers', kgUE.avantageRetenu > kgTiers.avantageRetenu);
verifier('ecart avec une famille en Allemagne chiffre', kgTiers.ecartAvecAllemagne > 0);
verifier('classement des pays coherent',
  regimePourPays('FR') === 'ue' && regimePourPays('TR') === 'abkommen' && regimePourPays('CM') === 'drittstaat');
verifier('la Macedoine du Nord n\'est pas un Etat conventionne', regimePourPays('MK') === 'drittstaat');
console.log(`   2 enfants -> UE ${eur(kgUE.avantageRetenu)} | Etat conventionne ${eur(kgAbkommen.avantageRetenu)} `
  + `| Etat tiers ${eur(kgTiers.avantageRetenu)} (ecart ${eur(kgTiers.ecartAvecAllemagne)})`);

/* --- 19. Remboursement des cotisations retraite ----------------------------- */
console.log('\n19. Remboursement des cotisations retraite');
const rCourt = analyserRentenerstattung({ moisCotises: 36, salaireMoyenAnnuel: 45000, age: 35, moisDepuisDepart: 30 });
const rLong = analyserRentenerstattung({ moisCotises: 180, salaireMoyenAnnuel: 45000, age: 45, moisDepuisDepart: 30 });
verifier('cinq ans non atteints en 36 mois', rCourt.wartezeitAtteinte === false);
verifier('aucune pension sans les cinq ans', rCourt.pensionMensuelle === 0);
verifier('pension calculee au-dela de cinq ans', rLong.pensionMensuelle > 0);
verifier('seule la part salariale est remboursee',
  Math.abs(rLong.remboursement - rLong.cotisationsTotales / 2) < 1);
verifier('la part patronale est perdue', rLong.partPerdue > 0);
verifier('delai de 24 mois respecte', rLong.delaiRespecte === true);
verifier('delai non ecoule signale',
  analyserRentenerstattung({ moisCotises: 180, salaireMoyenAnnuel: 45000, moisDepuisDepart: 6 }).delaiRespecte === false);
verifier('remboursement ferme aux ressortissants de l\'UE',
  analyserRentenerstattung({ moisCotises: 180, salaireMoyenAnnuel: 45000, moisDepuisDepart: 30, ressortissantUE: true })
    .remboursementPossible === false);
verifier('carriere courte : remboursement recommande', rCourt.recommandation === 'rembourser');
verifier('carriere longue : conservation recommandee', rLong.recommandation === 'conserver');
verifier('point d\'equilibre calcule', rLong.anneesPourEgaler > 0 && rLong.anneesPourEgaler < 30);
console.log(`   15 ans a 45.000 EUR -> pension ${eur(rLong.pensionMensuelle)}/mois `
  + `ou remboursement ${eur(rLong.remboursement)} (equilibre apres ${rLong.anneesPourEgaler.toFixed(1)} ans)`);

/* --- 20. Robustesse et cas limites ------------------------------------------- */
/* Un simulateur public recoit des saisies absurdes : zero, valeurs negatives,
 * montants extremes. Aucun de ces cas ne doit produire NaN, Infinity ou un
 * resultat aberrant affiche a un prospect. */
console.log('\n20. Robustesse aux saisies extremes');

const estFini = (valeur) => {
  if (typeof valeur === 'number') return Number.isFinite(valeur);
  if (Array.isArray(valeur)) return valeur.every(estFini);
  if (valeur && typeof valeur === 'object') return Object.values(valeur).every(estFini);
  return true;
};

const casLimites = [
  ['bareme a zero', () => einkommensteuer(0)],
  ['bareme negatif', () => einkommensteuer(-5000)],
  ['bareme extreme', () => einkommensteuer(50000000)],
  ['brut nul', () => calculerBruttoNetto({ ...base, bruttoAnnuel: 0, klasse: 'I' })],
  ['brut negatif', () => calculerBruttoNetto({ ...base, bruttoAnnuel: -1000, klasse: 'I' })],
  ['brut extreme', () => calculerBruttoNetto({ ...base, bruttoAnnuel: 5000000, klasse: 'VI' })],
  ['assurance privee sans prime', () => calculerBruttoNetto({ ...base, bruttoAnnuel: 90000, klasse: 'I', kvType: 'privat', primeMensuellePrivee: 0 })],
  ['sans affiliation retraite', () => calculerBruttoNetto({ ...base, bruttoAnnuel: 90000, klasse: 'I', rvPflichtig: false })],
  ['expatriation vide', () => analyserExpatriation({ situation: 'arrivee', revenuAllemand: 0, revenuEtranger: 0 })],
  ['expatriation mois 1', () => analyserExpatriation({ situation: 'arrivee', moisArrivee: 1, revenuAllemand: 50000, revenuEtranger: 10000 })],
  ['expatriation mois 12', () => analyserExpatriation({ situation: 'arrivee', moisArrivee: 12, revenuAllemand: 5000, revenuEtranger: 60000 })],
  ['honoraires a zero', () => calculerHonoraire({ prestations: Object.keys(PRESTATIONS), sommeEinkuenfte: 0, jahresumsatz: 0, betriebsausgaben: 0, bilanzsumme: 0, nombreSalaries: 0 })],
  ['honoraires extremes', () => calculerHonoraire({ prestations: Object.keys(PRESTATIONS), sommeEinkuenfte: 3e8, jahresumsatz: 3e8, bilanzsumme: 3e8, nombreSalaries: 5000 })],
  ['taxe pro negative', () => calculerGewerbesteuer({ gewinn: -50000, hebesatz: 410 })],
  ['taxe pro sous le minimum legal', () => calculerGewerbesteuer({ gewinn: 100000, hebesatz: 50 })],
  ['formes juridiques a zero', () => comparerFormesJuridiques({ benefice: 0, remuneration: 0 })],
  ['formes juridiques extremes', () => comparerFormesJuridiques({ benefice: 5000000, remuneration: 300000, quoteDistribution: 0.5 })],
  ['franchise TVA a zero', () => analyserKleinunternehmer({ umsatz: 0, achats: 0 })],
  ['vehicule a zero', () => calculerFirmenwagen({ bruttolistenpreis: 0, bruttoAnnuel: 0, distanceTravail: 0, joursTravailles: 0 })],
  ['carnet sans kilometrage', () => calculerFirmenwagen({ bruttolistenpreis: 40000, bruttoAnnuel: 50000, coutAnnuelVehicule: 8000, kmTotal: 0, kmPrives: 5000 })],
];

for (const [libelle, executer] of casLimites) {
  let resultat;
  let plante = false;
  try { resultat = executer(); } catch { plante = true; }
  verifier(`${libelle} — sans exception ni valeur non finie`, !plante && estFini(resultat));
}

/* Invariants economiques : ces relations doivent tenir sur toute la plage */
let netCroissantPartout = true;
let coutVehiculeCroissant = true;
let impotCroissantPartout = true;
for (let i = 0; i < 60; i += 1) {
  const brut = 10000 + i * 3000;
  const a = calculerBruttoNetto({ ...base, bruttoAnnuel: brut, klasse: 'I' });
  const b = calculerBruttoNetto({ ...base, bruttoAnnuel: brut + 3000, klasse: 'I' });
  if (b.netAnnuel <= a.netAnnuel) netCroissantPartout = false;
  if (b.postes.lohnsteuer < a.postes.lohnsteuer) impotCroissantPartout = false;

  const prix = 10000 + i * 3000;
  const v1 = calculerFirmenwagen({ bruttolistenpreis: prix, motorisation: 'verbrenner', bruttoAnnuel: 60000, distanceTravail: 15, joursTravailles: 220 });
  const v2 = calculerFirmenwagen({ bruttolistenpreis: prix + 3000, motorisation: 'verbrenner', bruttoAnnuel: 60000, distanceTravail: 15, joursTravailles: 220 });
  if (v2.forfait.coutAnnuel < v1.forfait.coutAnnuel) coutVehiculeCroissant = false;
}
verifier('le net croit avec le brut sur toute la plage', netCroissantPartout);
verifier('l\'impot sur le salaire ne decroit jamais', impotCroissantPartout);
verifier('le cout du vehicule croit avec le prix catalogue', coutVehiculeCroissant);

/* Le taux de charge d'un avantage en nature ne peut pas depasser 100 % */
let tauxPlausible = true;
for (let prix = 10000; prix <= 150000; prix += 5000) {
  const v = calculerFirmenwagen({ bruttolistenpreis: prix, motorisation: 'verbrenner', bruttoAnnuel: 45000, distanceTravail: 30, joursTravailles: 220 });
  if (v.forfait.tauxCharge < 0 || v.forfait.tauxCharge > 1) tauxPlausible = false;
}
verifier('la charge d\'un avantage en nature reste entre 0 et 100 %', tauxPlausible);

/* Regression : le § 35 StBVV ne fixe aucune valeur minimale, contrairement
   au § 25. Appliquer celle de l'EUER surfacturait les petites structures. */
const petitAbschluss = calculerHonoraire({ prestations: ['jahresabschluss'], bilanzsumme: 8000, jahresumsatz: 8000 });
verifier('aucun minimum d\'assiette impose au bilan (§ 35 StBVV)',
  petitAbschluss.lignes[0].gegenstandswert === 8000,
  `obtenu ${petitAbschluss.lignes[0].gegenstandswert}`);

/* La franchise de Soli s'applique dans toutes les classes ; seule la classe III
   beneficie du montant double (§ 3 Abs. 4 SolZG). */
verifier('franchise de Soli appliquee aussi en classe V',
  calculerBruttoNetto({ ...base, bruttoAnnuel: 30000, klasse: 'V' }).postes.soli === 0);
/* Coherence entre outils : le meme salaire doit donner le meme revenu
   imposable, que l'on passe par le simulateur brut/net ou par l'expatriation. */
const zvEBruttoNetto = calculerBruttoNetto({ ...base, bruttoAnnuel: 45000, klasse: 'I' }).zvE;
const zvEExpat = analyserExpatriation({
  situation: 'resident', revenuAllemand: 45000, revenuEtranger: 0, annee: ANNEE_DEFAUT,
}).zvE;
verifier('revenu imposable identique d\'un simulateur a l\'autre',
  Math.abs(zvEBruttoNetto - zvEExpat) < 1,
  `brut/net ${Math.round(zvEBruttoNetto)} contre expatriation ${Math.round(zvEExpat)}`);

verifier('franchise doublee en classe III',
  calculerBruttoNetto({ ...base, bruttoAnnuel: 150000, klasse: 'III' }).postes.soli
  < calculerBruttoNetto({ ...base, bruttoAnnuel: 150000, klasse: 'I' }).postes.soli);

/* --- Bilan ---------------------------------------------------------------- */
console.log(`\n=== ${erreurs === 0 ? 'Tous les controles sont passes' : `${erreurs} controle(s) en echec`} ===\n`);
process.exit(erreurs === 0 ? 0 : 1);
