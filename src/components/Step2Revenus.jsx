/* Etape 2 — Revenus & charges — Style Neon Aurora */
/* Tranches de revenu adaptees a la base client reelle WAMB'S (390+ mandants actifs) */
const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

/* Parametres adaptes par profil — bases sur la clientele reelle */
const REVENU_CONFIG = {
  salarie:  { min: 0, max: 150000, step: 1000, default: 35000 },
  freelance: { min: 0, max: 300000, step: 2000, default: 50000 },
  gerant:   { min: 0, max: 500000, step: 5000, default: 80000 },
  retraite: { min: 0, max: 80000,  step: 500,  default: 18000 },
  double:   { min: 0, max: 200000, step: 1000, default: 45000 },
};

const CHARGES_CONFIG = {
  freelance: { max: 150000, step: 1000 },
  gerant:    { max: 300000, step: 5000 },
  double:    { max: 80000,  step: 1000 },
};

export default function Step2Revenus({ data, setData, t }) {
  const s = t.step2;
  const profil = data.profil || 'salarie';
  const isFreelance = profil === 'freelance' || profil === 'gerant' || profil === 'double';
  const rc = REVENU_CONFIG[profil] || REVENU_CONFIG.salarie;
  const cc = CHARGES_CONFIG[profil] || { max: 80000, step: 1000 };
  const update = (champ, valeur) => setData({ ...data, [champ]: valeur });

  return (
    <div className="step-enter space-y-6">
      <h2 className="text-2xl font-semibold text-gradient mb-6">{s.title}</h2>

      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-1">{s.revenu}</label>
        <span className="text-sm text-wambs-muted">{s.revenu_de}</span>
        <div className="mt-3">
          <input type="range" min={rc.min} max={rc.max} step={rc.step} value={data.revenu || rc.default} onChange={(e) => update('revenu', Number(e.target.value))} />
          <div className="text-right text-wambs-orange font-semibold text-lg mt-1 font-data">{fmt(data.revenu || rc.default)}</div>
        </div>
      </div>

      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-1">{s.retraiteContrib}</label>
        <span className="text-sm text-wambs-muted">{s.retraiteContrib_de}</span>
        <div className="mt-3">
          <input type="range" min="0" max="25000" step="500" value={data.retraiteContrib || 0} onChange={(e) => update('retraiteContrib', Number(e.target.value))} />
          <div className="text-right text-wambs-orange font-semibold text-lg mt-1 font-data">{fmt(data.retraiteContrib || 0)}</div>
        </div>
      </div>

      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-1">{s.fraisPro}</label>
        <span className="text-sm text-wambs-muted">{s.fraisPro_de}</span>
        <div className="flex gap-4 mt-3">
          <button onClick={() => update('fraisProActif', true)} className={`px-4 py-2 rounded border cursor-pointer transition-all ${data.fraisProActif === true ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}>{s.oui}</button>
          <button onClick={() => update('fraisProActif', false)} className={`px-4 py-2 rounded border cursor-pointer transition-all ${data.fraisProActif === false ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}>{s.non}</button>
        </div>
        {data.fraisProActif && (
          <div className="mt-3">
            <input type="range" min="0" max="30000" step="500" value={data.fraisPro || 0} onChange={(e) => update('fraisPro', Number(e.target.value))} />
            <div className="text-right text-wambs-orange font-semibold text-lg mt-1 font-data">{fmt(data.fraisPro || 0)}</div>
          </div>
        )}
      </div>

      {s.hint && (
        <div className="hint p-3 text-xs text-wambs-muted">
          <span className="font-medium">💡</span> {s.hint}
        </div>
      )}

      {isFreelance && (
        <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 card-hover">
          <label className="block text-wambs-text font-medium mb-1">{s.charges}</label>
          <span className="text-sm text-wambs-muted">{s.charges_de}</span>
          <div className="flex gap-4 mt-3">
            <button onClick={() => update('chargesActif', true)} className={`px-4 py-2 rounded border cursor-pointer transition-all ${data.chargesActif === true ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}>{s.oui}</button>
            <button onClick={() => update('chargesActif', false)} className={`px-4 py-2 rounded border cursor-pointer transition-all ${data.chargesActif === false ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}>{s.non}</button>
          </div>
          {data.chargesActif && (
            <div className="mt-3">
              <input type="range" min="0" max={cc.max} step={cc.step} value={data.charges || 0} onChange={(e) => update('charges', Number(e.target.value))} />
              <div className="text-right text-wambs-orange font-semibold text-lg mt-1 font-data">{fmt(data.charges || 0)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
