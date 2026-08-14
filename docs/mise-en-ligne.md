# Mise en ligne et archivage de l'ancien simulateur

## Où en est l'hébergement

Deux emplacements coexistent aujourd'hui, et c'est la source de la confusion.

| | Ancien | Nouveau |
|---|---|---|
| Adresse | `simulator.wambsconsulting.de` | `wambsconsulting.de/simulator/` |
| Hébergeur | GitHub Pages, branche `gh-pages` | OVH, dossier `/simulator` |
| Base Vite | `/` | `/simulator/` |
| Contenu | Simulateur unique | Suite de 17 outils |

Le fichier `CNAME` de la branche `gh-pages` porte encore
`simulator.wambsconsulting.de` : c'est lui qui maintient l'ancienne adresse en
vie.

### Pourquoi `npm run deploy` a été neutralisé

Ce script poussait le contenu de `dist/` vers `gh-pages`. Depuis que la base est
passée à `/simulator/`, un tel envoi publierait un site dont toutes les
ressources pointent vers `/simulator/...` sur un domaine servi à la racine.
Résultat : **page blanche**. Le script affiche désormais un message et s'arrête.

---

## Préparer le paquet

```bash
npm run paquet
```

La commande enchaîne l'auto-contrôle des moteurs, l'alignement des traductions,
l'analyse statique, la construction, puis vérifie que les ressources
correspondent bien à la base configurée. Elle s'arrête au premier échec et ne
prépare rien dans ce cas.

Le résultat se trouve dans `livraison/`, avec un `.htaccess` et un `VERSION.txt`
indiquant le commit livré. **Ce script ne publie rien.**

---

## Mettre en ligne

1. **Fusionner la PR** dans `master`. Ne livrez pas depuis une branche : le
   `VERSION.txt` doit désigner un commit présent sur `master`.
2. `npm run paquet`
3. Se connecter en FTP à l'hébergement OVH (FileZilla ou l'explorateur de
   fichiers de l'espace client).
4. Téléverser **tout le contenu** de `livraison/` dans le dossier `/simulator`
   de l'hébergement, **fichier `.htaccess` compris**.
   Dans FileZilla : *Serveur → Forcer l'affichage des fichiers cachés*, sinon il
   ne sera pas transféré.
5. Vérifier `https://wambsconsulting.de/simulator/` dans une fenêtre privée.
   Contrôler en particulier :
   - la page d'accueil liste bien les 17 outils ;
   - le basculement DE / FR / EN ;
   - les mentions légales en pied de page ;
   - le retour vers le site principal.

---

## Archiver l'ancien simulateur

À faire **après** avoir vérifié que la nouvelle adresse fonctionne. Dans
l'ordre.

### 1. Conserver une copie

La branche `gh-pages-backup-2026-08-10` existe déjà. Créez-en une nouvelle à la
date du jour avant toute modification :

```bash
git push origin origin/gh-pages:refs/heads/gh-pages-archive-AAAA-MM-JJ
```

### 2. Rediriger l'ancienne adresse

Le plus propre est une redirection permanente, pour ne pas perdre le
référencement ni les liens déjà partagés — QR codes, publications WhatsApp,
signatures d'e-mail.

Sur la branche `gh-pages`, remplacer `index.html` par une page de redirection :

```html
<!doctype html>
<meta charset="utf-8">
<title>WAMB'S Consulting — Rechner</title>
<link rel="canonical" href="https://wambsconsulting.de/simulator/">
<meta http-equiv="refresh" content="0; url=https://wambsconsulting.de/simulator/">
<p>Der Rechner ist umgezogen:
<a href="https://wambsconsulting.de/simulator/">wambsconsulting.de/simulator/</a></p>
```

Conserver le fichier `CNAME` tel quel : c'est lui qui garde l'ancienne adresse
active pour servir la redirection.

### 3. Ne pas supprimer tout de suite

Laissez la redirection en place au moins six mois. Les QR codes imprimés et les
publications déjà diffusées pointent vers l'ancienne adresse ; la supprimer
créerait des liens morts que vous ne contrôlez plus.

### 4. Vérifier les supports existants

`marketing-assets/` contient des visuels WhatsApp et `qr-simulator.png` un code
QR. S'ils encodent `simulator.wambsconsulting.de`, ils continueront de
fonctionner grâce à la redirection — mais les prochains tirages devraient
pointer directement vers la nouvelle adresse.

---

## Avant de publier

Trois points relèvent de votre décision et non de la technique.

**Les constantes fiscales n'ont pas été relues.** Elles sont vérifiées aux
sources officielles et datées dans `src/calculators/parameter.js`, mais elles
couvrent l'impôt sur le revenu, la TVA, la taxe professionnelle, l'impôt sur les
sociétés, la StBVV, l'immobilier, la retraite, les successions et le § 33a. Une
erreur y devient un chiffre affiché publiquement par un cabinet.

**Les textes des 17 outils n'ont pas suivi la révision du Steuerberater.** La
copie existante est passée par la revue approuvée du 10.08.2026. Les nouveaux
textes ont été alignés mécaniquement sur les mêmes règles — pas approuvés.

**La capture de prospects reste désactivée** tant que `VITE_N8N_WEBHOOK_URL`
n'est pas renseigné. Si vous l'activez, la politique de confidentialité du site
doit mentionner ce traitement au préalable. Voir `docs/routage-des-leads.md`.
