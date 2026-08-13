/* Selecteur de langue DE | FR | EN */
const langues = [
  { code: 'de', label: 'DE', nom: 'Deutsch' },
  { code: 'fr', label: 'FR', nom: 'Français' },
  { code: 'en', label: 'EN', nom: 'English' },
];

export default function LanguageSelector({ langue, setLangue }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Sprache / Langue / Language">
      {langues.map(({ code, label, nom }) => (
        <button
          key={code}
          onClick={() => setLangue(code)}
          lang={code}
          aria-pressed={langue === code}
          title={nom}
          className={`px-2.5 sm:px-3 py-1 rounded text-sm font-medium transition-all cursor-pointer ${
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
