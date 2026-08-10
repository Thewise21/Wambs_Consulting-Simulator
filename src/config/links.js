/* Configuration des liens et donnees WAMB'S Consulting */
export const LINKS = {
  calendly: 'https://calendly.com/wambsconsulting',
  website: 'https://wambsconsulting.de',
  email: 'info@wambsconsulting.de',
  whatsapp: '+4917647358408',
  taxdome: 'https://wambsconsulting.eu.taxdome.com',
  address: 'Knesebeckstr. 63, 10719 Berlin',
};

/* Donnees de l'entreprise pour les trust signals */
export const COMPANY = {
  name: "WAMB'S Consulting",
  type: 'Steuerberatungskanzlei',
  city: 'Berlin',
  mandanten: '1.000+',
  founded: 2020,
  languages: ['DE', 'FR', 'EN'],
  team: [
    { name: 'Poclaire Wamba', role: 'ceo' },
    { name: 'StB Winfried Mueller', role: 'steuerberater' },
    { name: 'Laura Meguedong', role: 'assistenz' },
    { name: 'Kengo Leonel', role: 'automation' },
    { name: 'Fikret Yildiz', role: 'sachbearbeiter' },
  ],
};

/* Services proposes — lies aux 16 pipelines TaxDome actives
   Adaptes a la repartition reelle : 68% Privatpersonen, 11% Einzelunternehmer, 7% Ehepaare, 10% GmbH/UG */
export const SERVICES = {
  salarie: [
    'einkommensteuer',
    'lohnsteuerausgleich',
    'bescheidpruefung',
  ],
  freelance: [
    'einkommensteuer',
    'eur',
    'ustVoranmeldung',
    'gewerbeanmeldung',
    'fibu',
  ],
  gerant: [
    'jahresabschluss',
    'fibu',
    'lohnbuchhaltung',
    'ustVoranmeldung',
    'einkommensteuer',
    'bescheidpruefung',
  ],
  retraite: [
    'einkommensteuer',
    'bescheidpruefung',
    'rentenberatung',
  ],
  double: [
    'einkommensteuer',
    'eur',
    'gewerbeanmeldung',
    'fibu',
    'bescheidpruefung',
  ],
};
