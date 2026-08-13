/* Mini-routeur base sur le fragment d'URL.
 * Volontairement sans dependance : le simulateur est livre en fichiers
 * statiques (OVH / GitHub Pages), le hash evite toute reecriture serveur. */
import { useEffect, useState } from 'react';

function lireRoute() {
  if (typeof window === 'undefined') return '';
  return window.location.hash.replace(/^#\/?/, '').split('?')[0];
}

export function useRoute() {
  const [route, setRoute] = useState(lireRoute);

  useEffect(() => {
    const surChangement = () => {
      setRoute(lireRoute());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', surChangement);
    return () => window.removeEventListener('hashchange', surChangement);
  }, []);

  const naviguer = (cible) => {
    window.location.hash = cible ? `#/${cible}` : '#/';
  };

  return [route, naviguer];
}
