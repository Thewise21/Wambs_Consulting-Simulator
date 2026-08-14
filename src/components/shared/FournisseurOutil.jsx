/* Rend l'outil courant et la langue accessibles au formulaire de contact. */
import { ContexteOutil } from '../../lib/contexteOutil';

export default function FournisseurOutil({ outil, langue, children }) {
  return (
    <ContexteOutil.Provider value={{ outil, langue }}>
      {children}
    </ContexteOutil.Provider>
  );
}
