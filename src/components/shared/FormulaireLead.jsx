/* ============================================================================
 * Formulaire de prise de contact, integre a l'appel a l'action.
 * ----------------------------------------------------------------------------
 * Le consentement n'est jamais pre-coche et le bouton reste inactif tant qu'il
 * manque. Sans webhook configure, ce composant ne s'affiche pas du tout.
 * ========================================================================== */
import { useState } from 'react';
import { LINKS } from '../../config/links';
import { LEAD } from '../../config/lead';
import { construireCharge, envoyerLead, courrielValide } from '../../lib/lead';
import { useOutilCourant } from '../../lib/contexteOutil';

export default function FormulaireLead({ t, resume, urlRendezVous }) {
  const s = t.lead;
  const { outil, langue } = useOutilCourant();

  const [contact, setContact] = useState({ nom: '', email: '', telephone: '', message: '' });
  const [consentement, setConsentement] = useState(false);
  const [etat, setEtat] = useState('saisie'); // saisie | envoi | envoye
  const [erreurEmail, setErreurEmail] = useState(false);

  const maj = (champ, valeur) => setContact((prev) => ({ ...prev, [champ]: valeur }));

  const complet = contact.nom.trim().length >= 2 && courrielValide(contact.email) && consentement;

  const soumettre = async (evenement) => {
    evenement.preventDefault();
    if (!courrielValide(contact.email)) { setErreurEmail(true); return; }
    if (!complet) return;

    setEtat('envoi');
    const charge = construireCharge({
      outil,
      langue,
      contact: { ...contact, texteConsentement: s.consentement },
      resume,
      consentement,
    });
    /* L'issue est volontairement ignoree : un echec de transmission ne doit
       pas empecher le prospect d'ouvrir la prise de rendez-vous. */
    await envoyerLead(charge);
    setEtat('envoye');
    window.open(urlRendezVous || LINKS.calendlyFree, '_blank', 'noopener,noreferrer');
  };

  if (!LEAD.actif) return null;

  if (etat === 'envoye') {
    return (
      <div className="rounded-lg border border-wambs-cyan/40 p-4 mb-3"
        style={{ backgroundColor: 'rgba(6, 245, 245, 0.06)' }}>
        <p className="text-sm font-semibold text-wambs-cyan">{s.confirmationTitre}</p>
        <p className="text-xs text-wambs-text mt-1 leading-relaxed">{s.confirmationTexte}</p>
        <a href={urlRendezVous || LINKS.calendlyFree} target="_blank" rel="noopener noreferrer"
          className="inline-block mt-2 text-xs text-wambs-cyan underline">
          {s.confirmationLien}
        </a>
      </div>
    );
  }

  const champ = (nom, type, requis) => (
    <label className="block">
      <span className="block text-xs text-wambs-text mb-1">
        {s.champs[nom]}{requis && <span className="text-wambs-magenta"> *</span>}
      </span>
      <input
        type={type}
        value={contact[nom]}
        onChange={(e) => { maj(nom, e.target.value); if (nom === 'email') setErreurEmail(false); }}
        autoComplete={nom === 'email' ? 'email' : nom === 'nom' ? 'name' : 'tel'}
        className={`w-full px-3 py-2 rounded-lg bg-wambs-surface border text-wambs-text text-sm
                    min-h-[42px] focus:outline-none transition-colors ${
          nom === 'email' && erreurEmail
            ? 'border-wambs-magenta focus:border-wambs-magenta'
            : 'border-wambs-border focus:border-wambs-purple/60'
        }`}
      />
      {nom === 'email' && erreurEmail && (
        <span className="block text-[13px] text-wambs-magenta mt-1">{s.emailInvalide}</span>
      )}
    </label>
  );

  return (
    <form onSubmit={soumettre} className="space-y-2.5 mb-3">
      <p className="text-xs text-wambs-muted leading-relaxed">{s.introduction}</p>

      {champ('nom', 'text', true)}
      {champ('email', 'email', true)}
      {champ('telephone', 'tel', false)}

      <button
        type="button"
        onClick={() => setConsentement(!consentement)}
        className="w-full flex items-start gap-2.5 text-left cursor-pointer"
      >
        <span className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center ${
          consentement ? 'bg-wambs-purple border-wambs-purple' : 'border-wambs-muted'
        }`}>
          {consentement && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        <span className="text-[13px] text-wambs-muted leading-relaxed">
          {s.consentement}{' '}
          <a href={LINKS.datenschutz} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-wambs-cyan underline">
            {s.lienConfidentialite}
          </a>
        </span>
      </button>

      <button
        type="submit"
        disabled={!complet || etat === 'envoi'}
        className={`block w-full py-4 font-semibold text-center rounded-xl text-base sm:text-lg min-h-[52px] ${
          complet && etat !== 'envoi'
            ? 'btn-gradient text-white cursor-pointer'
            : 'bg-wambs-surface text-wambs-muted cursor-not-allowed'
        }`}
      >
        {etat === 'envoi' ? s.envoiEnCours : s.bouton}
      </button>

      <p className="text-[13px] text-wambs-muted text-center leading-relaxed">{s.mentionDonnees}</p>
    </form>
  );
}
