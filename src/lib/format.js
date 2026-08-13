/* Formatage monetaire et numerique, adapte a la langue affichee.
 * La devise reste l'euro dans les trois langues. */

const LOCALES = { de: 'de-DE', fr: 'fr-FR', en: 'en-GB' };

export function locale(langue) {
  return LOCALES[langue] || LOCALES.de;
}

export function euro(valeur, langue = 'de', decimales = 0) {
  const v = Number.isFinite(valeur) ? valeur : 0;
  return new Intl.NumberFormat(locale(langue), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(v);
}

export function nombre(valeur, langue = 'de', decimales = 0) {
  const v = Number.isFinite(valeur) ? valeur : 0;
  return new Intl.NumberFormat(locale(langue), {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(v);
}

export function pourcent(valeur, langue = 'de', decimales = 1) {
  const v = Number.isFinite(valeur) ? valeur : 0;
  return new Intl.NumberFormat(locale(langue), {
    style: 'percent',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(v);
}

/* Remplace les jetons {cle} d'un texte traduit par leurs valeurs */
export function interpoler(modele, valeurs = {}) {
  if (!modele) return '';
  return modele.replace(/\{(\w+)\}/g, (_, cle) => (valeurs[cle] !== undefined ? valeurs[cle] : `{${cle}}`));
}
