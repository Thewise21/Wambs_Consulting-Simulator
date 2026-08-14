# Relecture des constantes fiscales — 14.08.2026

Revérification systématique des constantes de `src/calculators/parameter.js`,
menée le 14.08.2026 sur le commit issu de la PR #1. Ce document est conçu pour
être contresigné : chaque bloc indique sa source, son niveau de vérification,
et ce qui reste à l'appréciation du professionnel.

**Deux erreurs ont été trouvées et corrigées à cette occasion** (§ 13 et § 34
StBVV, voir section 2). Tout le reste est confirmé.

## Niveaux de vérification

| Niveau | Signification |
|---|---|
| **A** | Confronté au texte légal sur gesetze-im-internet.de, au chiffre près |
| **B** | Confirmé par recoupement de sources secondaires concordantes (annonces officielles, presse spécialisée) |
| **C** | Simplification assumée du modèle — exige l'appréciation du professionnel |

---

## 1. Vérifié au niveau A — texte légal

| Constante | Valeur | Source |
|---|---|---|
| Barème § 32a EStG 2026 | Grundfreibetrag 12 348 € ; zones 17 799 / 69 878 / 277 825 € ; coefficients 914,51 · 1 400 · 173,10 · 2 397 · 1 034,87 · 11 135,63 · 19 470,38 | § 32a Abs. 1 EStG, version « ab VZ 2026 », relu le 14.08.2026 — **conforme au chiffre près** |
| Tables StBVV A, B, C | 49 + 61 + 23 lignes + règles d'extrapolation | Anlagen 1–3 StBGebV |
| Cadres § 24 StBVV | ESt 1/10–6/10 min 8 000 € ; KSt 2/10–8/10 min 16 000 € ; GewSt 1/10–6/10 min 8 000 € ; USt-VA 1/10–6/10 min 650 € ; USt-Jahr 1/10–8/10 min 8 000 € | § 24 Abs. 1 StBVV |
| Cadres § 35 StBVV | Bilan 10/10–40/10, assiette = moyenne bilan/production, **sans minimum** | § 35 StBVV |
| § 13 StBVV (corrigé) | 16,50–41 € par **quart d'heure** entamé | § 13 StBVV, relu le 14.08.2026 |
| § 34 StBVV (corrigé) | Paie 6–30 € /salarié/période ; mise en place 6–19 € | § 34 StBVV, relu le 14.08.2026 |
| Franchise Soli | 20 350 / 40 700 € (2026), zone d'atténuation 11,9 %, franchise applicable dans toutes les classes, doublée en III | § 3 Abs. 3–4 SolZG, relu pendant l'audit |

## 2. Erreurs trouvées à la relecture — corrigées

| Constante | Était | Est désormais | Impact |
|---|---|---|---|
| Zeitgebühr § 13 | 30–75 € / demi-heure (ancien droit) | 16,50–41 € / quart d'heure | Constante définie mais **non utilisée** par le calculateur — aucun montant affiché n'était faux |
| Paie § 34 Abs. 2 | 5–28 € | 6–30 € | L'honoraire moyen de la ligne paie passe de 16,50 à 18 € par salarié et par mois — le devis affiché était **sous-évalué** d'environ 9 % sur ce poste |
| Mise en place § 34 Abs. 1 | 5–18 € | 6–19 € | Constante non utilisée par le calculateur |

Un test de non-régression fixe désormais les valeurs révisées du § 34.

## 3. Vérifié au niveau B — sources concordantes

| Bloc | Valeurs clés | Observations |
|---|---|---|
| Sécurité sociale 2026 | BBG RV 101 400 € ; BBG KV 69 750 € ; JAEG 77 400 € ; RV 18,6 % ; AV 2,6 % ; KV 14,6 % + 2,9 % moyen ; PV 3,6 % + 0,6 sans enfant ; Bezugsgröße 47 460 € | Sozialversicherungsrechengrößen-VO 2026 |
| Famille 2026 | Kindergeld 259 €/mois ; Kinderfreibetrag 9 756 € (les deux parents) | Reconfirmé le 14.08.2026 |
| Rürup 2026 | 30 826 / 61 652 € | Valeur exacte 30 825,60 € — l'arrondi à l'euro est sans effet à l'échelle de l'outil |
| Droits de mutation | Les 16 Länder relus un à un le 14.08.2026, **tous conformes** — y compris Brême 5,5 % (relevé au 01.07.2025), Thuringe 5,0 % (baissé au 01.01.2024), Saxe 5,5 % (relevé au 01.01.2023) | |
| Retraite | Rentenwert 42,52 € (au 01.07.2026) ; Durchschnittsentgelt provisoire 51 944 € ; § 210 : part salariale seule, délai 24 mois ; fin de l'abattement 70 % pour les pensions servies hors UE depuis 10/2013 | |
| TVA / § 19 UStG | 19 / 7 % ; seuils 25 000 / 100 000 € avec effet immédiat en cours d'année | JStG 2024 |
| Véhicule | 1 % / 0,5 % / 0,25 % ; plafond électrique 100 000 € (mise à disposition dès le 01.07.2025, avant : 70 000 €) ; 0,03 % / 0,002 % | |
| Trajets | 0,38 €/km dès le 1er km au 01.01.2026 ; 2025 : 0,30 puis 0,38 à partir du 21e km | Steueränderungsgesetz 2025 |
| Indemnité de départ | Règle du cinquième maintenue mais retirée du prélèvement mensuel depuis 2025 | Wachstumschancengesetz |
| Successions | Abattements 500k/400k/200k/100k/20k ; Versorgungsfreibetrag 256 000 € ; barèmes des classes I–III ; règle des 10 ans | Stables depuis 2010 |
| § 33a EStG | Plafond = Grundfreibetrag (couplage automatique) ; franchise 624 € ; patrimoine ~15 500 € ; virement bancaire obligatoire depuis 2025 ; Opfergrenze 1 pt/500 €, max 50 %, −5 pts par conjoint/enfant (max −25) | |
| Enfants à l'étranger | États conventionnés : DZ, BA, XK, MA, ME, RS, TN, TR — la Macédoine du Nord n'en fait pas partie ; fractions 1 / ¾ / ½ / ¼ des groupes de pays | |
| Photovoltaïque | 30 kWc par unité, 100 kWc par contribuable, TVA à 0 % | § 3 Nr. 72 EStG, § 12 Abs. 3 UStG |
| IS / capitaux | KSt 15 % + Soli ; Abgeltungsteuer 25 % + Soli ; Sparer-Pauschbetrag 1 000 € ; réserve UG 25 % | |
| Taxe professionnelle | Messzahl 3,5 % ; abattement 24 500 € (personnes physiques) ; imputation × 4 ; Hebesatz minimal 200 % | § 11 GewStG, § 35 EStG |

## 4. Niveau C — simplifications assumées, à trancher par le professionnel

Ces points ne sont pas des erreurs : ce sont les limites déclarées du modèle.
Chacune est signalée à l'utilisateur dans l'outil concerné. La question posée
au professionnel est : **ces approximations sont-elles acceptables pour un
outil d'orientation public ?**

1. **Classes V et VI** — approximation du § 39b Abs. 2 S. 7 EStG avec plancher
   de 14 %, sans les seuils fins de la zone d'écrêtement.
2. **Vorsorgepauschale** — modèle § 39b simplifié ; les particularités de
   caisses individuelles ne sont pas reproduites.
3. **Plafond Rürup non minoré** — pour un salarié, le plafond devrait être
   réduit des cotisations RV (part patronale comprise). L'outil applique le
   plafond entier : l'économie affichée est **surestimée pour les salariés**.
   Point relevé à cette relecture — à trancher : minorer, ou réserver
   l'affichage aux indépendants.
4. **Estimation de pension à 48 % du brut** — repère grossier, signalé comme
   tel, avec renvoi au relevé de carrière.
5. **Rentenwert unique pour 2026** — 42,52 € s'applique dès juillet ; le
   premier semestre était à 40,79 €. Écart ~4 % sur une demi-année.
6. **Taxe professionnelle sans Hinzurechnungen/Kürzungen** (§§ 8–9 GewStG) —
   le résultat est un plancher pour les entreprises endettées ou locataires.
7. **Groupes de pays saisis par l'utilisateur** — la table du BMF n'est pas
   codée (près de 200 pays, révision annuelle). Repère donné : Afrique
   subsaharienne → groupe 4.
8. **Allocations en État conventionné calculées au taux allemand plein** — les
   conventions prévoient souvent des montants moindres ; signalé dans l'outil.
9. **Frais de notaire ~1,5 % + 0,5 %** — ordres de grandeur GNotKG, pas un
   calcul au barème.
10. **Succession sans Härteausgleich ni évaluation immobilière** — barème
    appliqué à la valeur saisie.

## 5. Rappels de gouvernance

- **Échéance de révision annuelle : décembre 2026** pour les valeurs 2027
  (procédure en tête de `parameter.js`, contrôle par `npm run selbsttest`).
- Les textes des 17 outils ont été alignés sur les règles de la révision de
  conformité du 10.08.2026, mais **n'ont pas été individuellement approuvés**
  par le Steuerberater coopérant.
- La présente relecture est une vérification documentaire aux sources. Elle ne
  remplace pas l'appréciation d'un professionnel habilité — c'est précisément
  l'objet de la signature ci-dessous.

## Visa

| Rôle | Nom | Date | Signature |
|---|---|---|---|
| Préparation et vérification aux sources | Claude (assistant), sous la responsabilité de Poclaire Wamba | 14.08.2026 | — |
| Relecture professionnelle | | | |
| Décision de mise en ligne | | | |
