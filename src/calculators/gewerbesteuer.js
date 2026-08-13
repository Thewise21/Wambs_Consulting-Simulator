/* ============================================================================
 * Taxe professionnelle allemande (Gewerbesteuer)
 * ----------------------------------------------------------------------------
 * Gewerbeertrag arrondi -> abattement -> Steuermessbetrag -> x Hebesatz
 *
 * Simplification assumee et signalee : les Hinzurechnungen (§ 8 GewStG, p. ex.
 * une part des loyers et interets) et les Kuerzungen (§ 9 GewStG) ne sont pas
 * modelisees. Elles augmentent generalement la base — le resultat affiche est
 * donc un plancher pour les entreprises fortement louees ou endettees.
 * ========================================================================== */
import { GEWERBESTEUER, ANNEE_DEFAUT } from './parameter.js';

export function calculerGewerbesteuer({
  gewinn,
  hebesatz,
  kapitalgesellschaft = false,
  annee = ANNEE_DEFAUT,
}) {
  const p = GEWERBESTEUER[annee] || GEWERBESTEUER[ANNEE_DEFAUT];
  const taux = Math.max(p.hebesatzMinimum, hebesatz || 0) / 100;

  /* § 11 Abs. 1 S. 3 GewStG : arrondi a la centaine d'euros inferieure */
  const ertrag = Math.floor(Math.max(0, gewinn) / p.arrondiErtrag) * p.arrondiErtrag;

  /* L'abattement n'existe que pour les personnes physiques et les societes
     de personnes — jamais pour une GmbH ou une UG. */
  const freibetrag = kapitalgesellschaft ? 0 : p.freibetragNatuerlichePersonen;
  const bemessungsgrundlage = Math.max(0, ertrag - freibetrag);

  const messbetrag = bemessungsgrundlage * p.steuermesszahl;
  const steuer = messbetrag * taux;

  /* § 35 EStG : imputation sur l'impot sur le revenu, plafonnee au plus petit
     de 4 fois le Messbetrag et de la taxe reellement due. Le troisieme plafond
     (la fraction d'impot correspondant aux revenus commerciaux) est applique
     par l'appelant, qui seul connait l'impot total. */
  const anrechnungPotentielle = kapitalgesellschaft
    ? 0
    : Math.min(messbetrag * p.anrechnungsfaktor, steuer);

  return {
    ertrag,
    freibetrag,
    bemessungsgrundlage,
    messbetrag,
    hebesatz: taux * 100,
    steuer,
    anrechnungPotentielle,
    /* Charge nette apres imputation maximale — utile pour la comparaison */
    chargeApresAnrechnung: steuer - anrechnungPotentielle,
    hebesatzNeutre: hebesatzNeutre(annee),
  };
}

/* Hebesatz « neutre » : l'imputation vaut 4 x Messbetrag et la taxe vaut
 * Hebesatz x Messbetrag. Les deux s'egalisent a 400 %. En dessous, la taxe est
 * integralement compensee pour un entrepreneur individuel ; au-dela, le
 * surplus reste a sa charge. */
export function hebesatzNeutre(annee = ANNEE_DEFAUT) {
  const p = GEWERBESTEUER[annee] || GEWERBESTEUER[ANNEE_DEFAUT];
  return p.anrechnungsfaktor * 100;
}
