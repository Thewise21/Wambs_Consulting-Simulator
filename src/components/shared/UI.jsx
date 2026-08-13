/* Briques d'interface partagees par les simulateurs.
 * Reprennent strictement le langage visuel existant (Neon Aurora) :
 * bg-wambs-panel / border-wambs-border / text-gradient / btn-gradient. */
import { LINKS } from '../../config/links';
import { LEAD } from '../../config/lead';
import { euro } from '../../lib/format';
import FormulaireLead from './FormulaireLead';

/* --- Bloc de section ------------------------------------------------------ */
export function Section({ titre, indice, children }) {
  return (
    <section className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5">
      {titre && (
        <div className="mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-wambs-cyan">{titre}</h3>
          {indice && <p className="text-xs text-wambs-muted mt-1 leading-relaxed">{indice}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/* --- Champ numerique avec unite ------------------------------------------ */
export function ChampNombre({ label, indice, valeur, onChange, unite = '€', min = 0, max, pas = 100 }) {
  return (
    <label className="block">
      <span className="block text-sm text-wambs-text mb-1.5">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={Number.isFinite(valeur) ? valeur : ''}
          min={min}
          max={max}
          step={pas}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-wambs-surface border border-wambs-border
                     text-wambs-text font-data text-sm sm:text-base min-h-[44px]
                     focus:outline-none focus:border-wambs-purple/60 transition-colors"
        />
        <span className="text-wambs-muted text-sm w-8 flex-shrink-0">{unite}</span>
      </div>
      {indice && <span className="block text-xs text-wambs-muted mt-1 leading-relaxed">{indice}</span>}
    </label>
  );
}

/* --- Curseur avec valeur chiffree ---------------------------------------- */
export function Curseur({ label, valeur, onChange, min, max, pas, langue, formatteur }) {
  const afficher = formatteur || ((v) => euro(v, langue));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <span className="text-sm text-wambs-text">{label}</span>
        <span className="text-base sm:text-lg font-semibold text-wambs-orange font-data">{afficher(valeur)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={pas}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="flex justify-between text-[10px] text-wambs-muted mt-1 font-data">
        <span>{afficher(min)}</span>
        <span>{afficher(max)}</span>
      </div>
    </div>
  );
}

/* --- Groupe de boutons exclusifs ----------------------------------------- */
/* Les classes de grille sont listees en toutes lettres : Tailwind analyse le
 * source statiquement et ne genererait pas une classe construite a la volee. */
const GRILLES = {
  auto: 'flex flex-wrap gap-2',
  2: 'grid gap-2 grid-cols-1 sm:grid-cols-2',
  3: 'grid gap-2 grid-cols-2 sm:grid-cols-3',
  4: 'grid gap-2 grid-cols-2 sm:grid-cols-4',
  6: 'grid gap-2 grid-cols-3 sm:grid-cols-6',
};

export function Choix({ label, indice, options, valeur, onChange, colonnes = 'auto' }) {
  const classeGrille = GRILLES[colonnes] || GRILLES.auto;

  return (
    <div>
      {label && <span className="block text-sm text-wambs-text mb-2">{label}</span>}
      <div className={classeGrille}>
        {options.map((option) => {
          const actif = valeur === option.valeur;
          return (
            <button
              key={option.valeur}
              type="button"
              onClick={() => onChange(option.valeur)}
              className={`px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer
                          min-h-[44px] card-hover text-left ${
                actif
                  ? 'border-wambs-cyan/50 text-wambs-text selected-card'
                  : 'border-wambs-border bg-wambs-surface text-wambs-muted'
              }`}
            >
              <span className="block font-medium">{option.label}</span>
              {option.indice && <span className="block text-[11px] text-wambs-muted mt-0.5">{option.indice}</span>}
            </button>
          );
        })}
      </div>
      {indice && <span className="block text-xs text-wambs-muted mt-2 leading-relaxed">{indice}</span>}
    </div>
  );
}

/* --- Interrupteur oui / non ---------------------------------------------- */
export function Bascule({ label, indice, valeur, onChange, libelleOui, libelleNon }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="block text-sm text-wambs-text">{label}</span>
        {indice && <span className="block text-xs text-wambs-muted mt-0.5 leading-relaxed">{indice}</span>}
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {[
          { v: true, l: libelleOui },
          { v: false, l: libelleNon },
        ].map(({ v, l }) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={`px-3 py-2 rounded-lg border text-xs sm:text-sm transition-all cursor-pointer min-h-[40px] ${
              valeur === v
                ? 'border-wambs-cyan/50 text-wambs-text selected-card'
                : 'border-wambs-border bg-wambs-surface text-wambs-muted'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/* --- Cases a cocher multiples -------------------------------------------- */
export function CaseAcocher({ label, indice, coche, onChange, marqueur }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!coche)}
      className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
                  text-left card-hover ${
        coche ? 'border-wambs-cyan/50 selected-card' : 'border-wambs-border bg-wambs-surface'
      }`}
    >
      <span
        className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center ${
          coche ? 'bg-wambs-purple border-wambs-purple' : 'border-wambs-muted'
        }`}
      >
        {coche && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-wambs-text font-medium">{label}</span>
        {indice && <span className="block text-xs text-wambs-muted mt-0.5 leading-relaxed">{indice}</span>}
      </span>
      {marqueur && (
        <span className="text-xs text-wambs-muted font-data flex-shrink-0">{marqueur}</span>
      )}
    </button>
  );
}

/* --- Resultat principal --------------------------------------------------- */
export function ResultatPrincipal({ etiquette, montant, sousTexte, accent = '#FB923C' }) {
  return (
    <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 sm:p-6 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-wambs-cyan via-wambs-purple to-wambs-magenta" />
      <p className="text-xs sm:text-sm text-wambs-muted mb-2">{etiquette}</p>
      <div className="text-3xl sm:text-4xl font-bold font-data mb-1" style={{ color: accent }}>{montant}</div>
      {sousTexte && <p className="text-xs sm:text-sm text-wambs-muted mt-2">{sousTexte}</p>}
    </div>
  );
}

/* --- Ligne d'un tableau de decomposition ---------------------------------- */
export function LigneDetail({ label, indice, valeur, negatif, total, accent }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-2 ${
      total ? 'border-t border-wambs-border mt-1 pt-3' : ''
    }`}>
      <span className="min-w-0">
        <span className={`block text-sm ${total ? 'font-semibold text-wambs-text' : 'text-wambs-text'}`}>{label}</span>
        {indice && <span className="block text-[11px] text-wambs-muted leading-relaxed">{indice}</span>}
      </span>
      <span
        className={`font-data text-sm sm:text-base flex-shrink-0 ${total ? 'font-semibold' : ''}`}
        style={{ color: accent || (negatif ? '#EC4899' : undefined) }}
      >
        {negatif ? '− ' : ''}{valeur}
      </span>
    </div>
  );
}

/* --- Message contextuel --------------------------------------------------- */
const COULEURS_ALERTE = {
  positif: { bordure: 'rgba(6, 245, 245, 0.4)', fond: 'rgba(6, 245, 245, 0.06)', texte: '#06F5F5' },
  info: { bordure: 'rgba(168, 85, 247, 0.35)', fond: 'rgba(168, 85, 247, 0.05)', texte: '#A855F7' },
  attention: { bordure: 'rgba(251, 146, 60, 0.4)', fond: 'rgba(251, 146, 60, 0.06)', texte: '#FB923C' },
  important: { bordure: 'rgba(236, 72, 153, 0.4)', fond: 'rgba(236, 72, 153, 0.06)', texte: '#EC4899' },
};

export function Alerte({ niveau = 'info', titre, texte, reference }) {
  const c = COULEURS_ALERTE[niveau] || COULEURS_ALERTE.info;
  return (
    <div className="rounded-lg border p-3 sm:p-4" style={{ borderColor: c.bordure, backgroundColor: c.fond }}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.texte }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: c.texte }}>{titre}</p>
          {texte && <p className="text-xs sm:text-sm text-wambs-text mt-1 leading-relaxed">{texte}</p>}
          {reference && <p className="text-[11px] text-wambs-muted mt-1.5 font-data">{reference}</p>}
        </div>
      </div>
    </div>
  );
}

/* --- Appel a l'action commun a tous les simulateurs ----------------------- *
 * Sans webhook configure, le bloc se comporte exactement comme avant : un lien
 * direct vers la prise de rendez-vous. Avec webhook, il precede ce lien d'un
 * formulaire de contact soumis au consentement.
 * `resume` transporte les chiffres cles du simulateur vers n8n ; il permet de
 * qualifier le prospect avant meme le rendez-vous.
 * ------------------------------------------------------------------------- */
export function BlocCta({ titre, sousTitre, libelleBouton, note, t, resume }) {
  const captureActive = LEAD.actif && t?.lead;

  return (
    <div className="relative bg-wambs-panel border border-wambs-purple/30 rounded-xl p-5 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-wambs-cyan via-wambs-purple to-wambs-magenta" />
      {titre && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">&#9733;</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-wambs-purple">{titre}</span>
        </div>
      )}
      {sousTitre && <p className="text-sm text-wambs-text mb-3 leading-relaxed">{sousTitre}</p>}

      {captureActive ? (
        <FormulaireLead t={t} resume={resume} urlRendezVous={LINKS.calendlyFree} />
      ) : (
        <a
          href={LINKS.calendlyFree}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 btn-gradient font-semibold text-center rounded-xl text-base sm:text-lg text-white mb-3"
        >
          {libelleBouton}
        </a>
      )}

      {note && <p className="text-wambs-muted text-xs text-center">{note}</p>}
    </div>
  );
}

/* --- Mention legale de bas de simulateur --------------------------------- */
export function Avertissement({ texte, stand }) {
  return (
    <p className="text-[11px] text-wambs-muted text-center italic px-2 leading-relaxed">
      {texte}
      {stand && <span className="block not-italic mt-1 font-data">{stand}</span>}
    </p>
  );
}

/* --- Barre de navigation interne (retour au hub) -------------------------- */
export function RetourHub({ libelle, onRetour }) {
  return (
    <button
      type="button"
      onClick={onRetour}
      className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-wambs-muted
                 hover:text-wambs-cyan transition-colors cursor-pointer mb-3"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
      {libelle}
    </button>
  );
}
