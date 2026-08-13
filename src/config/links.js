/* Configuration des liens et donnees WAMB'S Consulting */
export const LINKS = {
  calendly: 'https://calendly.com/wambsconsulting',
  calendlyFree: 'https://calendly.com/wambsconsulting/kostenlose-erstberatung',
  website: 'https://wambsconsulting.de',
  email: 'info@wambsconsulting.de',
  impressum: 'https://wambsconsulting.de/impressum',
  datenschutz: 'https://wambsconsulting.de/datenschutz',
  taxdome: 'https://wambsconsulting.eu.taxdome.com',
  address: 'Knesebeckstr. 63, 10719 Berlin',
};

/* Donnees de l'entreprise pour les trust signals */
export const COMPANY = {
  name: "WAMB'S Consulting",
  type: 'Finanz- und Unternehmensberatung',
  city: 'Berlin',
  mandanten: '1.000+',
  founded: 2020,
  languages: ['DE', 'FR', 'EN'],
  /* REGLE : aucun Steuerberater n'est nomme sur le site.
     Les missions reservees (Vorbehaltsaufgaben) sont presentees comme
     relevant d'un « unabhaengiger Steuerberater », sans identite.
     Ne pas reintroduire de nom ici, meme si le tableau n'est pas affiche
     aujourd'hui : il alimenterait un futur composant. */
  team: [
    { name: 'Poclaire Wamba', role: 'ceo' },
    { name: 'Laura Meguedong', role: 'assistenz' },
    { name: 'Kengo Leonel', role: 'automation' },
    { name: 'Fikret Yildiz', role: 'sachbearbeiter' },
  ],
};

/* Services proposes — lies aux 16 pipelines TaxDome actives */
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
  beamte: [
    'einkommensteuer',
    'lohnsteuerausgleich',
    'bescheidpruefung',
    'beamtenberatung',
  ],
  etudiant: [
    'einkommensteuer',
    'lohnsteuerausgleich',
    'studentenberatung',
  ],
  elternzeit: [
    'einkommensteuer',
    'bescheidpruefung',
    'elterngeldoptimierung',
  ],
  arbeitslos: [
    'einkommensteuer',
    'bescheidpruefung',
    'wiedereingliederung',
  ],
  autre: [
    'einkommensteuer',
    'bescheidpruefung',
  ],
};
