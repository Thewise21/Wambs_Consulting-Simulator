/* Etape 6 — Resultat final + CTA Calendly + Services + Breakdown */
import { LINKS, SERVICES } from '../config/links';
import { BlocCta } from './shared/UI';

const profilMsgKey = {
  salarie: 'msgSalarie',
  freelance: 'msgFreelance',
  gerant: 'msgGerant',
  retraite: 'msgRetraite',
  double: 'msgDouble',
  beamte: 'msgBeamte',
  etudiant: 'msgEtudiant',
  elternzeit: 'msgElternzeit',
  arbeitslos: 'msgArbeitslos',
  autre: 'msgAutre',
};

export default function Step6Resultat({ data, t, onRestart }) {
  const s = t.step6;
  const resultat = data.resultat || { montant: 0, niveau: 'low' };
  const msgKey = profilMsgKey[data.profil] || 'msgSalarie';
  const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const niveauConfig = {
    low:    { color: '#06F5F5', bg: 'rgba(6, 245, 245, 0.1)' },
    medium: { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)' },
    high:   { color: '#FB923C', bg: 'rgba(251, 146, 60, 0.1)' },
  };

  const profilServices = SERVICES[data.profil] || SERVICES.salarie;

  return (
    <div className="step-enter space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-gradient mb-2">{s.title}</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colonne gauche — Resume + Services */}
        <div className="space-y-6">
          <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 sm:p-6 text-center">
            <p className="text-wambs-muted text-xs sm:text-sm mb-3 sm:mb-4">{s.summary}</p>
            <div className="text-3xl sm:text-4xl font-bold text-wambs-orange mb-2 font-data">{fmt(resultat.montant)}</div>
            <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4"
              style={{ color: niveauConfig[resultat.niveau].color, backgroundColor: niveauConfig[resultat.niveau].bg }}>
              {t.step5.potential} : {t.step5[resultat.niveau]}
            </span>
            <p className="text-wambs-text text-sm sm:text-base leading-relaxed">{s[msgKey]}</p>
          </div>

          {s.services && profilServices.length > 0 && (
            <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-wambs-cyan mb-3">{s.servicesTitle}</h3>
              <div className="flex flex-wrap gap-2">
                {profilServices.map((svc) => (
                  <span key={svc} className="px-3 py-1.5 rounded-full text-xs font-medium border border-wambs-purple/30 text-wambs-text"
                    style={{ backgroundColor: 'rgba(168, 85, 247, 0.08)' }}>
                    {s.services[svc] || svc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite — CTA Calendly */}
        <div className="space-y-4">
          {/* Le bloc commun gere aussi la capture du prospect ; il remplace
              l'ancien lien direct pour que ce simulateur remonte les memes
              informations que les seize autres. */}
          <BlocCta
            titre={s.ctaExclusive}
            libelleBouton={s.ctaPrimary}
            note={s.ctaFreeNote}
            t={t}
            resume={{
              profil: data.profil,
              revenu: data.revenu,
              statut: data.statut,
              steuerklasse: data.steuerklasse,
              enfants: data.enfants,
              potentielEstime: Math.round(resultat.montant || 0),
              niveau: resultat.niveau,
            }}
          />

          {/* Restart */}
          {s.restart && onRestart && (
            <button onClick={onRestart}
              className="block w-full py-3 text-center text-wambs-muted text-sm hover:text-wambs-cyan transition-colors cursor-pointer">
              ↻ {s.restart}
            </button>
          )}
        </div>
      </div>

      {/* Footer signature */}
      <div className="text-center pt-4 border-t border-wambs-border">
        {/* Ces lignes etaient codees en dur en allemand : elles s'affichaient
            telles quelles en francais et en anglais. La signature traduite
            contient deja le nom de la marque — pas de ligne separee. */}
        <p className="text-gradient font-semibold text-sm sm:text-base">{s.signature}</p>
        <p className="text-wambs-muted text-xs mt-1.5">{s.teamNote}</p>
        <p className="text-wambs-muted text-xs mt-0.5">{LINKS.address}</p>
      </div>
    </div>
  );
}
