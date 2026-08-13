# CLAUDE.md — Wambs-Simulator

## Projet
Suite de simulateurs fiscaux multilingues (DE/FR/EN) pour WAMB'S Consulting.
Chaque outil donne un chiffre au prospect, puis l'oriente vers une prise de
rendez-vous Calendly et une pipeline TaxDome.

Déployé sur `simulator.wambsconsulting.de` (fichiers statiques).

## Stack
- React 19 + Vite + TailwindCSS v4
- Recharts (graphiques)
- Aucun routeur externe : navigation par fragment d'URL (`src/lib/router.js`),
  pour rester compatible avec un hébergement statique sans réécriture serveur.

## Les quatorze simulateurs

| Route | Outil | Nature |
|-------|-------|--------|
| `#/` | Hub | Choix du simulateur |
| `#/steuer` | Potentiel fiscal | Parcours guidé en 6 étapes (outil historique) |
| `#/expat` | Expatriation | Parcours guidé en 4 étapes |
| `#/brutto-netto` | Brut / net | Calcul en direct |
| `#/honorar` | Honoraires StBVV | Calcul en direct |
| `#/rechtsform` | Forme juridique | Calcul en direct |
| `#/kleinunternehmer` | Franchise de TVA § 19 | Calcul en direct |
| `#/firmenwagen` | Véhicule de fonction | Calcul en direct |
| `#/immobilien` | Investissement locatif | Calcul en direct |
| `#/kaufnebenkosten` | Frais annexes d'achat | Calcul en direct |
| `#/photovoltaik` | Photovoltaïque | Calcul en direct |
| `#/abfindung` | Indemnité de départ | Calcul en direct |
| `#/altersvorsorge` | Retraite et prévoyance | Calcul en direct |
| `#/erbschaft` | Succession et donation | Calcul en direct |
| `#/erklaerungspflicht` | Obligation et délais | Calcul en direct |
| `#/unterhalt` | Soutien à la famille au pays (§ 33a) | Calcul en direct |
| `#/kindergeld-ausland` | Enfants vivant à l'étranger | Calcul en direct |
| `#/rentenerstattung` | Retour au pays (§ 210 SGB VI) | Calcul en direct |

Les alertes renvoyées par les moteurs (`{cle, niveau, params}`) sont rendues par
`components/shared/ListeAlertes.jsx`, qui centralise traduction et formatage.
Conventions de nommage des paramètres : `montant`, `limite`, `plafond`,
`minimum`, `seuil`, `abattement` sont formatés en euros ; `taux` et `part` en
pourcentage ; `puissance`, `total`, `jours`, `nombre` en nombre simple.

Ajouter un outil : une entrée dans `src/config/tools.js`, un composant dans
`src/tools/`, une entrée dans `COMPOSANTS` (App.jsx) et les trois blocs i18n.

## Règle absolue : les constantes légales

**Toutes** les valeurs chiffrées issues de la loi vivent dans
`src/calculators/parameter.js` — et nulle part ailleurs. Barème § 32a EStG,
franchises du Solidaritätszuschlag, plafonds de sécurité sociale, forfaits,
tables StBVV A/B/C.

Chaque année, vers décembre :
1. mettre à jour `parameter.js` (les sources officielles sont citées en tête) ;
2. mettre à jour `STAND` et `ANNEE_DEFAUT` ;
3. lancer `npm run selbsttest`.

Le script d'auto-contrôle vérifie la cohérence interne du barème (continuité
aux frontières de zones, monotonie, taux marginal plafonné) et affiche des
valeurs de référence à confronter au calculateur officiel du BMF.

## La Ländergruppeneinteilung n'est pas dans le code

Les trois outils diaspora dépendent du classement des pays par le ministère
fédéral des Finances (groupes 1 à 4 → montant plein, ¾, ½, ¼). **Cette table
n'est volontairement pas reproduite dans `parameter.js`** : elle compte près de
200 pays, change chaque année, et une erreur de groupe fausse directement le
montant annoncé au client.

Les simulateurs demandent donc le groupe à l'utilisateur, avec un repère fiable
(Afrique subsaharienne → groupe 4) et un renvoi explicite à la circulaire.
Si vous décidez un jour d'intégrer la table complète, elle doit venir du
document officiel et être revérifiée chaque décembre comme les autres
constantes.

## Cinq pièges déjà rencontrés

**Le § 25 et le § 35 StBVV ne se ressemblent pas.** Le § 25 (EÜR) impose une
assiette minimale de 17.500 €, le § 35 (bilan) n'en impose aucune. Appliquer
celle de l'EÜR au bilan surfacturait les petites structures.

**Deux moteurs ne doivent jamais répondre différemment à la même question.**
Le simulateur d'expatriation recalculait son propre revenu imposable au lieu de
réutiliser celui du brut/net : même salaire, deux résultats. Il passe désormais
par `estimerRevenuImposableSalarie`.

**Un avantage en nature n'est pas un revenu.** Ajouter le Sachbezug au brut
fait mécaniquement monter le net affiché, alors que la paie versée diminue. Le
coût réel d'un véhicule de fonction est l'impôt et les cotisations qu'il
déclenche — jamais la différence entre deux nets. Voir `firmenwagen.js`.

**`import.meta.env?.VITE_X` ne fonctionne pas.** Vite substitue littéralement
l'expression `import.meta.env.VITE_X` au build ; l'optional chaining empêche la
substitution et désactive la fonctionnalité en silence. Et sous Windows, un
`.env` écrit avec un BOM est ignoré sans le moindre message. Après toute
modification de variable d'environnement, vérifiez que la valeur est bien
présente dans `dist/assets/*.js`.

**Un jeton `{ans}` peut se cacher dans un libellé.** `npm run i18n` ne détecte
pas les jetons oubliés à l'interpolation : il faut parcourir les pages rendues.
Un balayage navigateur sur les 17 outils × 3 langues est le seul contrôle
fiable après avoir touché à un fichier de traduction.

**Un euro en société ne vaut pas un euro en poche.** Le comparateur de forme
juridique actualise les bénéfices non distribués du prélèvement forfaitaire à
venir. Sans cette décote, l'UG paraissait meilleure que la GmbH alors que leur
fiscalité est identique : son avantage apparent ne venait que de la réserve
qu'elle est obligée de constituer. Voir `rechtsform.js`.

## Structure
```
src/
├── calculators/          → logique métier pure, sans React
│   ├── parameter.js      → SOURCE UNIQUE des constantes légales
│   ├── estTarif.js       → § 32a EStG, Soli, Kirchensteuer, § 32b
│   ├── bruttoNetto.js    → § 39b EStG + cotisations sociales
│   ├── expat.js          → § 1, § 1a, § 32b, § 46, § 50 EStG
│   ├── stbvv.js          → tables et cadres d'honoraires StBVV
│   ├── gewerbesteuer.js  → § 11 GewStG, imputation § 35 EStG
│   ├── rechtsform.js     → comparateur EI / UG / GmbH
│   ├── kleinunternehmer.js → § 19 UStG contre régime normal
│   └── firmenwagen.js    → § 6 Abs. 1 Nr. 4 et § 8 Abs. 2 EStG
├── tools/                → un composant par simulateur
├── components/
│   ├── shared/UI.jsx     → briques communes (champs, alertes, CTA)
│   ├── ToolHub.jsx       → page d'accueil de la suite
│   └── Step*.jsx         → étapes du simulateur historique
├── config/
│   ├── links.js          → Calendly et coordonnées (jamais en dur ailleurs)
│   └── tools.js          → registre des simulateurs
├── lib/                  → routeur et formatage
├── i18n/
│   ├── de|fr|en.json         → simulateur historique
│   └── tools.de|fr|en.json   → hub et nouveaux simulateurs
└── App.jsx               → coquille : thème, langue, navigation
```

## Palette (définie dans src/index.css)
Thème clair par défaut, thème sombre « Neon Aurora » via `[data-theme="dark"]`.

- `--color-wambs-cyan: #06F5F5` — accent principal, mode sombre
- `--color-wambs-purple: #A855F7` — accent principal, mode clair
- `--color-wambs-magenta: #EC4899` · `--color-wambs-orange: #FB923C`
- `panel` / `surface` / `border` / `text` / `muted` s'adaptent au thème

Ne jamais coder une couleur en dur dans un composant : utiliser les classes
Tailwind `wambs-*`. Les classes construites dynamiquement ne fonctionnent pas
(Tailwind analyse le source statiquement) — voir `GRILLES` dans `shared/UI.jsx`.

## Conventions
- Commentaires et noms de variables en français
- Liens Calendly uniquement via `config/links.js`
- Six fichiers de traduction à tenir synchronisés
- Chaque simulateur affiche sa base légale et une mention de non-engagement

## Règle de nommage : aucun Steuerberater nommé

Le site ne nomme **aucun** Steuerberater. Les missions réservées
(Vorbehaltsaufgaben) et le conseil juridiquement contraignant sont attribués à
« einen unabhängigen Steuerberater » / « un conseiller fiscal indépendant » /
« an independent tax adviser », sans identité.

Concerné : le disclaimer de pied de page (`footer.disclaimer` dans les trois
`de|fr|en.json`), le CTA du calculateur d'honoraires (`honorar.ctaTexte` dans
les trois `tools.*.json`) et `COMPANY.team` dans `config/links.js`.

Ne pas réintroduire de nom, y compris dans des données non affichées.

## Capture des prospects

Désactivée par défaut. Elle ne s'active qu'avec `VITE_N8N_WEBHOOK_URL` dans un
fichier `.env` (voir `.env.example`). Sans elle, les simulateurs affichent un
lien direct vers Calendly et ne transmettent rien.

Le contrat de charge utile, la configuration n8n et les questions de conformité
sont documentés dans `docs/routage-des-leads.md`. Le squelette de workflow
importable est dans `docs/n8n-workflow-simulator-leads.json`.

Trois règles à ne pas contourner :

- **Rien ne part sans consentement.** `envoyerLead` refuse la charge utile si
  le consentement est absent — c'est une garantie de code, pas seulement une
  case à cocher.
- **L'envoi ne bloque jamais la conversion.** En cas d'échec ou de lenteur du
  webhook, le prospect atteint quand même Calendly.
- **Le texte de confidentialité doit rester exact.** Il annonce que les saisies
  ne quittent le navigateur que si le formulaire est envoyé. Toute évolution du
  flux doit s'y refléter.

## Contrôle des traductions

`npm run i18n` vérifie que les trois langues restent strictement parallèles :
arborescence de clés identique, mêmes jetons `{variable}` dans chaque texte,
mêmes longueurs de tableaux, aucune valeur vide, et **aucun texte visible codé
en dur** dans les composants (texte JSX comme attributs `aria-label`, `alt`,
`title`, `placeholder`).

À lancer après toute modification d'un fichier `i18n/` ou d'un composant.
L'allemand sert de langue de référence.

## Commandes
```
npm run dev          # serveur de développement
npm run build        # export statique dans dist/
npm run selbsttest   # contrôle des moteurs de calcul
npm run i18n         # contrôle d'alignement des traductions
npm run lint
```
