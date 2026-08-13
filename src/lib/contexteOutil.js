/* Identite du simulateur courant, mise a disposition de l'appel a l'action.
 * Evite de faire descendre l'outil et la langue en propriete a travers les
 * dix-sept simulateurs.
 *
 * Le composant fournisseur vit dans components/shared/FournisseurOutil.jsx :
 * exporter un composant et un hook depuis le meme fichier casserait le
 * rafraichissement a chaud. */
import { createContext, useContext } from 'react';

export const ContexteOutil = createContext({ outil: null, langue: 'de' });

export function useOutilCourant() {
  return useContext(ContexteOutil);
}
