# Routage des prospects — simulateurs → n8n → TaxDome

Ce document décrit ce que les simulateurs envoient, comment l'activer, et ce
qu'il reste à construire côté n8n.

---

## 1. Activation

La capture est **désactivée par défaut**. Tant qu'aucune URL de webhook n'est
configurée, les simulateurs affichent un lien direct vers Calendly et ne
transmettent rien.

Pour l'activer :

```bash
cp .env.example .env
# renseigner VITE_N8N_WEBHOOK_URL, puis
npm run build
```

### Deux pièges qui font échouer l'activation en silence

**Le fichier `.env` ne doit pas contenir de BOM.** Sous Windows,
`Set-Content -Encoding utf8` en ajoute un, et Vite ignore alors la première
variable sans le moindre message. Créez le fichier depuis un éditeur en
« UTF-8 sans BOM », ou en PowerShell :

```powershell
[System.IO.File]::WriteAllText("$PWD\.env","VITE_N8N_WEBHOOK_URL=https://…`n",(New-Object System.Text.UTF8Encoding($false)))
```

**Vérifiez que l'URL est bien passée dans le bundle** après le build :

```powershell
Select-String -Path dist/assets/*.js -Pattern "votre-domaine-n8n" -Quiet
```

Si la réponse est `False`, la variable n'a pas été prise en compte.

---

## 2. Ce qui est transmis

Une requête `POST` en `application/json`, sans cookies, avec un délai maximal
de 4 secondes. **Rien n'est envoyé sans consentement explicite** : la fonction
d'envoi refuse la charge utile si la case n'est pas cochée.

```json
{
  "version": 1,
  "source": "simulator.wambsconsulting.de",
  "horodatageClient": "2026-08-13T18:45:52.297Z",
  "langue": "fr",
  "consentement": {
    "accorde": true,
    "texte": "J'accepte que WAMB'S Consulting conserve et traite …",
    "horodatage": "2026-08-13T18:45:52.297Z"
  },
  "contact": {
    "nom": "Marie Dupont",
    "email": "marie@example.com",
    "telephone": "",
    "message": ""
  },
  "outil": {
    "id": "unterhalt",
    "route": "unterhalt",
    "pipelines": ["einkommensteuer", "bescheidpruefung"]
  },
  "resume": {
    "montantVerse": 6000,
    "groupePays": 4,
    "personnesSoutenues": 1,
    "deductible": 3087,
    "economie": 957
  },
  "contexte": {
    "parametresFiscaux": "13.08.2026",
    "referent": null,
    "urlPage": "https://simulator.wambsconsulting.de/#/unterhalt"
  }
}
```

### Le champ `resume`

Il change d'un simulateur à l'autre : ce sont les chiffres qui qualifient le
prospect avant même le rendez-vous. Un prospect « forme juridique, écart de
12 000 € » et un prospect « soutien familial, 957 € » n'appellent pas le même
suivi.

Ne construisez donc pas de schéma rigide dans n8n : traitez `resume` comme un
objet libre et stockez-le tel quel.

### Le champ `outil.pipelines`

C'est la clé du routage. Il reprend les identifiants déclarés dans
`src/config/tools.js` ; `src/config/lead.js` les traduit en noms de pipelines
TaxDome (`PIPELINES_TAXDOME`).

| Identifiant | Pipeline TaxDome |
|---|---|
| `einkommensteuer` | Einkommensteuererklärung |
| `bescheidpruefung` | Bescheidprüfung |
| `lohnbuchhaltung` | Lohnbuchhaltung |
| `ustVoranmeldung` | USt-Voranmeldung |
| `fibu` | Finanzbuchhaltung (FiBu) |
| `jahresabschluss` | Jahresabschluss / EÜR |
| `existenzgruendung` | Existenzgründung |
| `onboarding` | Mandanten-Onboarding |

---

## 3. Sécurité

**L'URL du webhook est publique.** Elle figure dans le bundle JavaScript,
visible de quiconque ouvre les outils de développement. C'est inhérent à un
site statique et il n'existe pas de contournement honnête : n'y placez aucun
secret.

Conséquences pratiques pour la configuration n8n :

- activer la limitation de débit sur le webhook ;
- rejeter toute charge utile dont `consentement.accorde` n'est pas `true` ;
- valider le format de l'adresse e-mail avant toute création dans TaxDome ;
- prévoir un rejet des soumissions répétées depuis la même adresse en quelques
  secondes, pour éviter qu'un robot ne remplisse la base.

---

## 4. Conformité

Le consentement est recueilli par une case **non pré-cochée**, et le bouton
d'envoi reste inactif tant qu'elle ne l'est pas. Le texte exact affiché au
moment du clic est transmis avec la charge utile, horodaté : c'est la preuve
du consentement, à conserver.

Le texte de confidentialité affiché sur la page d'accueil a été corrigé en
conséquence. Il annonçait auparavant qu'aucune donnée n'était transmise, ce qui
serait devenu faux.

**Deux points relèvent de votre décision, pas du code :**

1. La politique de confidentialité sur `wambsconsulting.de` doit mentionner ce
   traitement : finalité, base légale (consentement, art. 6 §1 a RGPD), durée
   de conservation, destinataires — dont n8n, en tant que sous-traitant.
2. Un contrat de sous-traitance avec n8n est nécessaire si ce n'est pas déjà
   fait, ainsi qu'avec Calendly.

---

## 5. Ce qui reste à construire dans n8n

Le squelette importable se trouve dans `docs/n8n-workflow-simulator-leads.json`.
Il enchaîne : réception → contrôle du consentement → normalisation et mappage
de pipeline → notification par e-mail → emplacement réservé pour TaxDome.

**L'étape TaxDome est volontairement laissée en attente.** Votre `CLAUDE.md`
indique que TaxDome est piloté par une API interne via navigateur, avec jeton
CSRF — ce n'est pas une API publique dans laquelle un webhook peut écrire
directement. Trois voies possibles, par ordre de robustesse :

1. **Notification puis création via votre skill `taxdome-workflow-manager`** —
   le plus sûr aujourd'hui : n8n stocke le prospect et vous alerte, la création
   se fait par le canal que vous maîtrisez déjà.
2. **Import périodique par fichier** — n8n accumule les prospects dans une
   feuille ou une base, importée dans TaxDome par lots.
3. **Appel direct à l'API interne** — possible mais fragile : le jeton CSRF et
   la session ne sont pas conçus pour un usage serveur.

Je recommande la première pour démarrer. Elle donne immédiatement ce qui vous
manque — savoir quel simulateur produit du mandat — sans dépendre d'une API
qui peut changer sans préavis.

---

## 6. Mesurer, enfin

Une fois le flux en place, la question qui a motivé tout ceci devient
répondable : rapprochez `outil.id` du devenir du prospect dans TaxDome.

Trois chiffres par simulateur suffisent : nombre de formulaires envoyés,
nombre de rendez-vous tenus, nombre de mandats signés. C'est ce rapport, et
non le trafic, qui doit décider du prochain simulateur à construire — ou de
celui qu'il faut retirer.
