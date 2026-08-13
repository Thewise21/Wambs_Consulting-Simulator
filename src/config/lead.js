/* ============================================================================
 * Capture et routage des prospects
 * ----------------------------------------------------------------------------
 * L'adresse du webhook n8n est fournie au moment du build par la variable
 * d'environnement VITE_N8N_WEBHOOK_URL (voir .env.example).
 *
 * Tant qu'elle n'est pas definie, le formulaire n'apparait pas et les
 * simulateurs se comportent exactement comme avant : aucune regression, et
 * aucune donnee transmise par inadvertance.
 *
 * ATTENTION : tout ce qui figure ici finit dans le bundle public. L'URL du
 * webhook est donc visible de quiconque ouvre les outils de developpement.
 * Elle doit etre traitee comme un point d'entree public : validation et
 * limitation de debit du cote n8n, jamais de secret ici.
 * ========================================================================== */

/* Vite remplace litteralement l'expression `import.meta.env.VITE_...` au build.
 * Ecrire `import.meta.env?.VITE_...` empeche cette substitution et desactive
 * silencieusement la capture — l'ecriture ci-dessous est la seule correcte. */
const url = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

export const LEAD = {
  webhookUrl: url,
  /* La capture ne s'active que si un webhook est configure */
  actif: Boolean(url),
  /* Au-dela, on n'attend plus la reponse : le prospect ne doit jamais
     patienter a cause de notre tuyauterie. */
  delaiMaximalMs: 4000,
  /* Version du contrat de charge utile. A incrementer si la structure change,
     pour que le workflow n8n puisse distinguer les formats. */
  versionContrat: 1,
  source: 'simulator.wambsconsulting.de',
};

/* Correspondance outil -> pipeline TaxDome. Les identifiants proviennent de
 * config/tools.js ; ce tableau ne fait que les nommer pour n8n. */
export const PIPELINES_TAXDOME = {
  einkommensteuer: 'Einkommensteuererklärung',
  bescheidpruefung: 'Bescheidprüfung',
  lohnbuchhaltung: 'Lohnbuchhaltung',
  ustVoranmeldung: 'USt-Voranmeldung',
  fibu: 'Finanzbuchhaltung (FiBu)',
  jahresabschluss: 'Jahresabschluss / EÜR',
  existenzgruendung: 'Existenzgründung',
  onboarding: 'Mandanten-Onboarding',
};
