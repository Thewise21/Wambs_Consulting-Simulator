/* ============================================================================
 * Droits de succession et de donation (ErbStG)
 * ----------------------------------------------------------------------------
 * Trois leviers seulement : le lien de parente (qui fixe l'abattement et la
 * classe), la valeur transmise, et le temps — les abattements se reconstituent
 * tous les dix ans. C'est ce dernier point qui fait la difference entre une
 * transmission preparee et une transmission subie.
 * ========================================================================== */
import { SUCCESSION, ANNEE_DEFAUT } from './parameter.js';

/* Lien de parente -> abattement et classe d'imposition */
export const LIENS = {
  conjoint: { abattement: 'conjoint', classe: 'I' },
  enfant: { abattement: 'enfant', classe: 'I' },
  petitEnfant: { abattement: 'petitEnfant', classe: 'I' },
  parent: { abattement: 'parentSuccession', classe: 'I' },
  frereSoeur: { abattement: 'classeII', classe: 'II' },
  neveu: { abattement: 'classeII', classe: 'II' },
  autre: { abattement: 'classeIII', classe: 'III' },
};

function tauxApplicable(baseTaxable, classe) {
  const bareme = SUCCESSION.bareme[classe] || SUCCESSION.bareme.III;
  for (const [plafond, taux] of bareme) {
    if (baseTaxable <= plafond) return taux;
  }
  return bareme[bareme.length - 1][1];
}

export function analyserSuccession(entree) {
  const annee = entree.annee || ANNEE_DEFAUT;
  const patrimoine = Math.max(0, entree.patrimoine || 0);
  const lien = LIENS[entree.lien] ? entree.lien : 'enfant';
  const config = LIENS[lien];
  const donation = !!entree.donation;
  const beneficiaires = Math.max(1, Math.round(entree.beneficiaires || 1));

  /* L'abattement de pension du § 17 ErbStG ne vaut qu'en cas de deces */
  const abattementBase = SUCCESSION.abattements[config.abattement];
  const versorgung = (!donation && lien === 'conjoint')
    ? SUCCESSION.versorgungsfreibetragConjoint
    : 0;
  const abattement = abattementBase + versorgung;

  /* Chaque beneficiaire dispose de son propre abattement */
  const partParBeneficiaire = patrimoine / beneficiaires;
  const baseTaxableParPart = Math.max(0, partParBeneficiaire - abattement);

  /* § 19 ErbStG : le taux s'applique a la totalite de la part taxable, pas par
     tranches — d'ou l'effet de seuil corrige par le Haerteausgleich. */
  const taux = tauxApplicable(baseTaxableParPart, config.classe);
  const impotParPart = baseTaxableParPart * taux;
  const impotTotal = impotParPart * beneficiaires;

  const netParBeneficiaire = partParBeneficiaire - impotParPart;
  const netTotal = patrimoine - impotTotal;
  const tauxEffectif = patrimoine > 0 ? impotTotal / patrimoine : 0;

  /* Que donnerait un etalement sur deux periodes de dix ans ? */
  const partEtalee = partParBeneficiaire / 2;
  const baseEtalee = Math.max(0, partEtalee - abattement);
  const impotEtale = baseEtalee * tauxApplicable(baseEtalee, config.classe) * 2 * beneficiaires;
  const gainEtalement = Math.max(0, impotTotal - impotEtale);

  const alertes = [];

  if (impotTotal === 0) {
    alertes.push({ cle: 'sousAbattement', niveau: 'positif', params: { abattement } });
  } else {
    alertes.push({
      cle: 'impotDu',
      niveau: 'attention',
      params: { montant: impotTotal, taux, classe: config.classe },
    });
  }
  if (gainEtalement > 0) {
    alertes.push({
      cle: 'etalement',
      niveau: 'positif',
      params: { montant: gainEtalement, ans: SUCCESSION.delaiRenouvellementAns },
    });
  }
  if (config.classe !== 'I') {
    alertes.push({ cle: 'classeDefavorable', niveau: 'attention', params: { classe: config.classe } });
  }
  if (!donation && lien === 'conjoint') {
    alertes.push({ cle: 'versorgungsfreibetrag', niveau: 'positif', params: { montant: versorgung } });
  }
  alertes.push({ cle: 'immobilier', niveau: 'info', params: {} });
  alertes.push({ cle: 'delaiDeclaration', niveau: 'attention', params: {} });

  return {
    annee,
    lien,
    classe: config.classe,
    donation,
    beneficiaires,
    abattement,
    abattementBase,
    versorgung,
    partParBeneficiaire,
    baseTaxableParPart,
    taux,
    impotParPart,
    impotTotal,
    netParBeneficiaire,
    netTotal,
    tauxEffectif,
    impotEtale,
    gainEtalement,
    delaiRenouvellement: SUCCESSION.delaiRenouvellementAns,
    alertes,
  };
}
