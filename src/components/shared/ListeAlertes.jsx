/* Rend une liste d'alertes issue d'un moteur de calcul.
 * Les moteurs renvoient {cle, niveau, params} ; la traduction et le formatage
 * des montants, taux et parts sont centralises ici pour que chaque simulateur
 * n'ait pas a repeter la meme boucle. */
import { Alerte } from './UI';
import { euro, pourcent, nombre, interpoler } from '../../lib/format';

export default function ListeAlertes({ alertes, textes, langue, titre }) {
  if (!alertes || alertes.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {titre && <h3 className="text-sm font-semibold text-wambs-cyan">{titre}</h3>}
      {alertes.map((alerte) => {
        const modele = textes[alerte.cle];
        if (!modele) return null;

        const p = alerte.params || {};
        const valeurs = { ...p };
        /* Conventions de nommage partagees par tous les moteurs :
           un montant est en euros, un taux ou une part en pourcentage. */
        for (const cle of ['montant', 'limite', 'plafond', 'minimum', 'seuil', 'abattement']) {
          if (p[cle] !== undefined) valeurs[cle] = euro(p[cle], langue);
        }
        for (const cle of ['taux', 'part']) {
          if (p[cle] !== undefined) valeurs[cle] = pourcent(p[cle], langue);
        }
        for (const cle of ['puissance', 'total', 'jours', 'nombre']) {
          if (p[cle] !== undefined) valeurs[cle] = nombre(p[cle], langue);
        }

        return (
          <Alerte
            key={alerte.cle}
            niveau={alerte.niveau}
            titre={interpoler(modele.titre, valeurs)}
            texte={interpoler(modele.texte, valeurs)}
            reference={modele.reference}
          />
        );
      })}
    </div>
  );
}
