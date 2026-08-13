/* Selecteur de langue DE | FR | EN — Mobile optimise */
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
          className={`px-2.5 sm:px-3 py-1.5 sm:py-1 rounded text-xs sm:text-sm font-medium transition-all cursor-pointer min-w-[40px] min-h-[36px] sm:min-h-[32px] ${
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
