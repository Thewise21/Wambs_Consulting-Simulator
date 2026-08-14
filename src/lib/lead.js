/* ============================================================================
 * Construction et envoi de la charge utile prospect
 * ----------------------------------------------------------------------------
 * Deux principes gouvernent ce module :
 *
 *   1. Rien ne part sans consentement explicite. La fonction d'envoi refuse
 *      la charge utile si le consentement est absent — c'est une garantie de
 *      code, pas seulement une case a cocher dans l'interface.
 *   2. L'envoi ne bloque jamais la conversion. En cas d'echec ou de lenteur du
 *      webhook, le prospect atteint quand meme Calendly. Perdre un lead dans
 *      n8n est ennuyeux ; perdre un rendez-vous l'est davantage.
 * ========================================================================== */
import { LEAD } from '../config/lead';
import { STAND } from '../calculators/parameter';

/* Validation minimale, cote client. Le controle serieux se fait dans n8n. */
export function courrielValide(valeur) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valeur || '').trim());
}

export function construireCharge({ outil, langue, contact, resume, consentement }) {
  return {
    version: LEAD.versionContrat,
    source: LEAD.source,
    /* Horodatage cote client : n8n ajoutera le sien, qui fait foi */
    horodatageClient: new Date().toISOString(),
    langue,
    consentement: {
      accorde: !!consentement,
      texte: contact.texteConsentement || '',
      horodatage: consentement ? new Date().toISOString() : null,
    },
    contact: {
      nom: String(contact.nom || '').trim(),
      email: String(contact.email || '').trim(),
      telephone: String(contact.telephone || '').trim(),
      message: String(contact.message || '').trim(),
    },
    outil: {
      id: outil?.id || null,
      route: outil?.route || null,
      pipelines: outil?.pipelines || [],
    },
    /* Chiffres cles calcules par le simulateur — c'est ce qui permet de
       qualifier le prospect avant meme le rendez-vous. */
    resume: resume || null,
    contexte: {
      parametresFiscaux: STAND,
      referent: typeof document !== 'undefined' ? document.referrer || null : null,
      urlPage: typeof window !== 'undefined' ? window.location.href : null,
    },
  };
}

/* Envoi non bloquant. Renvoie toujours un objet decrivant l'issue, jamais une
 * exception : l'appelant enchaine sur Calendly quoi qu'il arrive. */
export async function envoyerLead(charge) {
  if (!LEAD.actif) return { statut: 'desactive' };
  if (!charge?.consentement?.accorde) return { statut: 'refuse-sans-consentement' };

  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), LEAD.delaiMaximalMs);

  try {
    const reponse = await fetch(LEAD.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(charge),
      signal: controleur.signal,
      /* Pas de cookies : le webhook n'en a pas besoin et cela evite tout
         debat inutile sur le suivi. */
      credentials: 'omit',
    });
    return reponse.ok
      ? { statut: 'envoye' }
      : { statut: 'erreur', code: reponse.status };
  } catch (erreur) {
    return { statut: erreur?.name === 'AbortError' ? 'delai-depasse' : 'erreur-reseau' };
  } finally {
    clearTimeout(minuteur);
  }
}
