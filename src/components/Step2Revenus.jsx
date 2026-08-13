/* Etape 2 — Revenus & charges — Mobile-first + nouveaux profils */
const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const REVENU_CONFIG = {
  salarie:    { min: 0, max: 150000, step: 1000, default: 35000 },
  freelance:  { min: 0, max: 300000, step: 2000, default: 50000 },
  gerant:     { min: 0, max: 500000, step: 5000, default: 80000 },
  retraite:   { min: 0, max: 80000,  step: 500,  default: 18000 },
  double:     { min: 0, max: 200000, step: 1000, default: 45000 },
  beamte:     { min: 0, max: 150000, step: 1000, default: 42000 },
  etudiant:   { min: 0, max: 30000,  step: 500,  default: 8000  },
  elternzeit: { min: 0, max: 60000,  step: 500,  default: 12000 },
  arbeitslos: { min: 0, max: 40000,  step: 500,  default: 8000  },
  autre:      { min: 0, max: 100000, step: 1000, default: 30000 },
};

const CHARGES_CONFIG = {
  freelance: { max: 150000, step: 1000 },
  gerant:    { max: 300000, step: 5000 },
  double:    { max: 80000,  step: 1000 },
};

/* Profils ayant potentiellement des charges deductibles */
const PROFILS_AVEC_CHARGES = ['freelance', 'gerant', 'double'];

export default function Step2Revenus({ data, setData, t }) {
  const s = t.step2;
  const profil = data.profil || 'salarie';
  const hasCharges = PROFILS_AVEC_CHARGES.includes(profil);
  const rc = REVENU_CONFIG[profil] || REVENU_CONFIG.salarie;
  const cc = CHARGES_CONFIG[profil] || { max: 80000, step: 1000 };
  const update = (champ, valeur) => setData({ ...data, [champ]: valeur });

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-gradient mb-4 sm:mb-6">{s.title}</h2>

      {/* Jahreseinkommen */}
      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-1 text-sm sm:text-base">{s.revenu}</label>
        <span className="text-xs sm:text-sm text-wambs-muted">{s.revenu_de}</span>
        <div className="mt-3">
          <input type="range" min={rc.min} max={rc.max} step={rc.step} value={data.revenu || rc.default} onChange={(e) => update('revenu', Number(e.target.value))} className="w-full" />
          <div className="text-right text-wambs-orange font-semibold text-base sm:text-lg mt-1 font-data">{fmt(data.revenu || rc.default)}</div>
        </div>
      </div>

      {/* Altersvorsorge */}
      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-1 text-sm sm:text-base">{s.retraiteContrib}</label>
        <span className="text-xs sm:text-sm text-wambs-muted">{s.retraiteContrib_de}</span>
        <div className="mt-3">
          <input type="range" min="0" max="25000" step="500" value={data.retraiteContrib || 0} onChange={(e) => update('retraiteContrib', Number(e.target.value))} className="w-full" />
          <div className="text-right text-wambs-orange font-semibold text-base sm:text-lg mt-1 font-data">{fmt(data.retraiteContrib || 0)}</div>
        </div>
      </div>

      {/* Werbungskosten */}
      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-1 text-sm sm:text-base">{s.fraisPro}</label>
        <span className="text-xs sm:text-sm text-wambs-muted">{s.fraisPro_de}</span>
        <div className="flex gap-3 mt-3">
          <button onClick={() => update('fraisProActif', true)} className={`flex-1 px-4 py-2.5 rounded border cursor-pointer transition-all text-sm min-h-[44px] ${data.fraisProActif === true ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}>{s.oui}</button>
          <button onClick={() => update('fraisProActif', false)} className={`flex-1 px-4 py-2.5 rounded border cursor-pointer transition-all text-sm min-h-[44px] ${data.fraisProActif === false ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}>{s.non}</button>
        </div>
        {data.fraisProActif && (
          <div className="mt-3">
            <input type="range" min="0" max="30000" step="500" value={data.fraisPro || 0} onChange={(e) => update('fraisPro', Number(e.target.value))} className="w-full" />
            <div className="text-right text-wambs-orange font-semibold text-base sm:text-lg mt-1 font-data">{fmt(data.fraisPro || 0)}</div>
          </div>
        )}
      </div>

      {s.hint && (
        <div className="hint p-3 text-xs text-wambs-muted">
          <span className="font-medium">💡</span> {s.hint}
        </div>
      )}

      {hasCharges && (
        <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5 card-hover">
          <label className="block text-wambs-text font-medium mb-1 text-sm sm:text-base">{s.charges}</label>
          <span className="text-xs sm:text-sm text-wambs-muted">{s.charges_de}</span>
          <div className="flex gap-3 mt-3">
            <button onClick={() => update('chargesActif', true)} className={`flex-1 px-4 py-2.5 rounded border cursor-pointer transition-all text-sm min-h-[44px] ${data.chargesActif === true ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}>{s.oui}</button>
            <button onClick={() => update('chargesActif', false)} className={`flex-1 px-4 py-2.5 rounded border cursor-pointer transition-all text-sm min-h-[44px] ${data.chargesActif === false ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}>{s.non}</button>
          </div>
          {data.chargesActif && (
            <div className="mt-3">
              <input type="range" min="0" max={cc.max} step={cc.step} value={data.charges || 0} onChange={(e) => update('charges', Number(e.target.value))} className="w-full" />
              <div className="text-right text-wambs-orange font-semibold text-base sm:text-lg mt-1 font-data">{fmt(data.charges || 0)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
