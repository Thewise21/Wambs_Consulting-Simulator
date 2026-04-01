/* Etape 4 — Deductions speciales — Style Neon Aurora */
/* Deductions enrichies selon la clientele reelle WAMB'S : internationale, couples, familles */
const DEDUCTIONS = [
  'homeoffice', 'doppelte', 'fortbildung', 'kinderbetreuung',
  'spenden', 'handwerker', 'umzug',
  'crypto', 'vermietung', 'medical',
];

export default function Step4Deductions({ data, setData, t }) {
  const s = t.step4;
  const selected = data.deductions || [];

  const toggle = (key) => {
    const next = selected.includes(key) ? selected.filter((d) => d !== key) : [...selected, key];
    setData({ ...data, deductions: next });
  };

  return (
    <div className="step-enter">
      <h2 className="text-2xl font-semibold text-gradient mb-2">{s.title}</h2>
      {s.subtitle && <p className="text-wambs-muted text-sm mb-6">{s.subtitle}</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {DEDUCTIONS.map((key) => (
          <label key={key}
            className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all card-hover ${
              selected.includes(key) ? 'border-wambs-cyan/50 bg-wambs-cyan/5 selected-card' : 'border-wambs-border bg-wambs-panel'
            }`}>
            <input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} className="shrink-0" />
            <div>
              <div className="text-wambs-text font-medium">{s[key]}</div>
              <div className="text-sm text-wambs-muted">{s[`${key}_de`]}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
