/* Selecteur de langue DE | FR | EN — style neon */
const langues = [
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

export default function LanguageSelector({ langue, setLangue }) {
  return (
    <div className="flex gap-1">
      {langues.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLangue(code)}
          className={`px-3 py-1 rounded text-sm font-medium transition-all cursor-pointer ${
            langue === code
              ? 'btn-gradient text-white'
              : 'bg-wambs-panel text-wambs-muted hover:text-wambs-text border border-wambs-border'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
