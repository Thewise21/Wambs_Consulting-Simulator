/* Etape 4 — Deductions speciales — Mobile-first */
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
      <h2 className="text-xl sm:text-2xl font-semibold text-gradient mb-2">{s.title}</h2>
      {s.subtitle && <p className="text-wambs-muted text-xs sm:text-sm mb-4 sm:mb-6">{s.subtitle}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        {DEDUCTIONS.map((key) => (
          <label key={key}
            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border cursor-pointer transition-all card-hover min-h-[64px] ${
              selected.includes(key) ? 'border-wambs-cyan/50 bg-wambs-cyan/5 selected-card' : 'border-wambs-border bg-wambs-panel'
            }`}>
            <input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} className="shrink-0 w-5 h-5" />
            <div className="min-w-0">
              <div className="text-wambs-text font-medium text-sm sm:text-base">{s[key]}</div>
              <div className="text-xs sm:text-sm text-wambs-muted">{s[`${key}_de`]}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
