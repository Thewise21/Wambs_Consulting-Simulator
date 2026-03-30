/* Etape 6 — Resultat final + CTA + Services — Style Neon Aurora */
import { useState } from 'react';
import { LINKS, SERVICES } from '../config/links';

const profilMsgKey = { salarie: 'msgSalarie', freelance: 'msgFreelance', gerant: 'msgGerant', retraite: 'msgRetraite', double: 'msgDouble' };

export default function Step6Resultat({ data, t, onRestart }) {
  const s = t.step6;
  const [showForm, setShowForm] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');

  const resultat = data.resultat || { montant: 0, niveau: 'low' };
  const msgKey = profilMsgKey[data.profil] || 'msgSalarie';
  const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const niveauConfig = {
    low:    { color: '#06F5F5', bg: 'rgba(6, 245, 245, 0.1)' },
    medium: { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)' },
    high:   { color: '#FB923C', bg: 'rgba(251, 146, 60, 0.1)' },
  };

  /* Services recommandes selon le profil */
  const profilServices = SERVICES[data.profil] || SERVICES.salarie;

  const handleSubmit = (e) => { e.preventDefault(); setEnvoye(true); };

  /* Lien WhatsApp pre-rempli */
  const whatsappMsg = encodeURIComponent(`Bonjour, j'ai utilise le simulateur fiscal WAMB'S. Mon potentiel estime : ${fmt(resultat.montant)}. Je souhaite prendre rendez-vous.`);
  const whatsappLink = `https://wa.me/4930123456?text=${whatsappMsg}`;

  return (
    <div className="step-enter space-y-6">
      <h2 className="text-2xl font-semibold text-gradient mb-2">{s.title}</h2>

      {/* Resume principal */}
      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-6 text-center">
        <p className="text-wambs-muted text-sm mb-4">{s.summary}</p>
        <div className="text-4xl font-bold text-wambs-orange mb-2 font-data">{fmt(resultat.montant)}</div>
        <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4"
          style={{ color: niveauConfig[resultat.niveau].color, backgroundColor: niveauConfig[resultat.niveau].bg }}>
          {t.step5.potential} : {t.step5[resultat.niveau]}
        </span>
        <p className="text-wambs-text leading-relaxed max-w-lg mx-auto">{s[msgKey]}</p>
      </div>

      {/* Services recommandes */}
      {s.services && (
        <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5">
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

      {/* CTA principal — Calendly */}
      <a href={LINKS.calendly} target="_blank" rel="noopener noreferrer"
        className="block w-full py-4 btn-gradient font-semibold text-center rounded-xl text-lg text-white">
        {s.ctaPrimary}
      </a>

      {/* CTA WhatsApp */}
      {s.ctaWhatsapp && (
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {s.ctaWhatsapp}
        </a>
      )}

      {/* CTA email */}
      {!showForm && !envoye && (
        <button onClick={() => setShowForm(true)}
          className="btn-outline-gradient block w-full py-3 font-medium text-center rounded-xl cursor-pointer">
          {s.ctaSecondary}
        </button>
      )}

      {showForm && !envoye && (
        <form onSubmit={handleSubmit} className="bg-wambs-panel border border-wambs-border rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-wambs-text text-sm mb-1">{s.nom}</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required
              className="w-full px-4 py-2 bg-wambs-dark border border-wambs-border rounded text-wambs-text focus:border-wambs-cyan focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-wambs-text text-sm mb-1">{s.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-2 bg-wambs-dark border border-wambs-border rounded text-wambs-text focus:border-wambs-cyan focus:outline-none transition-colors" />
          </div>
          <button type="submit" className="w-full py-3 btn-gradient font-semibold rounded text-white cursor-pointer">{s.envoyer}</button>
        </form>
      )}

      {envoye && (
        <div className="rounded-lg p-4 text-center text-wambs-cyan" style={{ backgroundColor: 'rgba(6, 245, 245, 0.08)', border: '1px solid rgba(6, 245, 245, 0.3)' }}>
          {s.merci}
        </div>
      )}

      {/* Restart */}
      {s.restart && onRestart && (
        <button onClick={onRestart}
          className="block w-full py-2 text-center text-wambs-muted text-sm hover:text-wambs-cyan transition-colors cursor-pointer">
          ↻ {s.restart}
        </button>
      )}

      {/* Footer signature */}
      <div className="text-center pt-4 border-t border-wambs-border">
        <p className="text-gradient font-semibold text-lg">WAMB'S</p>
        <p className="text-wambs-muted text-sm">{s.signature}</p>
        <p className="text-wambs-muted text-xs mt-1">{s.teamNote}</p>
        <p className="text-wambs-muted text-xs mt-0.5">Knesebeckstr. 63, 10719 Berlin</p>
      </div>
    </div>
  );
}
