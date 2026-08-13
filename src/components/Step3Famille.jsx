/* Etape 3 — Situation familiale — Style Neon Aurora */
const STATUTS = ['celibataire', 'marie', 'pacse', 'veuf'];
const STEUERKLASSEN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const ENFANTS_OPTIONS = [0, 1, 2, '3+'];

export default function Step3Famille({ data, setData, t }) {
  const s = t.step3;
  const update = (champ, valeur) => setData({ ...data, [champ]: valeur });

  return (
    <div className="step-enter space-y-6">
      <h2 className="text-2xl font-semibold text-gradient mb-6">{s.title}</h2>

      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-3">{s.statut}</label>
        <div className="grid grid-cols-2 gap-2">
          {STATUTS.map((statut) => (
            <button key={statut} onClick={() => update('statut', statut)}
              className={`px-4 py-2.5 rounded border text-sm cursor-pointer transition-all ${
                data.statut === statut ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'
              }`}>{s[statut]}</button>
          ))}
        </div>
      </div>

      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-3">
          {s.steuerklasse} <span className="text-wambs-muted text-sm">(Steuerklasse)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {STEUERKLASSEN.map((klasse) => (
            <button key={klasse} onClick={() => update('steuerklasse', klasse)}
              className={`w-12 h-12 rounded border text-sm font-medium cursor-pointer transition-all ${
                data.steuerklasse === klasse ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'
              }`}>{klasse}</button>
          ))}
        </div>
      </div>

      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-3">
          {s.enfants} <span className="text-wambs-muted text-sm">(Kinder)</span>
        </label>
        <div className="flex gap-2">
          {ENFANTS_OPTIONS.map((n) => (
            <button key={n} onClick={() => update('enfants', n)}
              className={`w-14 h-12 rounded border text-sm font-medium cursor-pointer transition-all ${
                data.enfants === n ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'
              }`}>{n}</button>
          ))}
        </div>
      </div>

      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-1">
          {s.kindergeld} <span className="text-wambs-muted text-sm">({s.kindergeld_de})</span>
        </label>
        <div className="flex gap-4 mt-3">
          <button onClick={() => update('kindergeld', true)}
            className={`px-4 py-2 rounded border cursor-pointer transition-all ${data.kindergeld === true ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}
          >{t.step2.oui}</button>
          <button onClick={() => update('kindergeld', false)}
            className={`px-4 py-2 rounded border cursor-pointer transition-all ${data.kindergeld === false ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}
          >{t.step2.non}</button>
        </div>
      </div>
      {s.hint && (
        <div className="hint p-3 text-xs text-wambs-muted">
          <span className="font-medium">💡</span> {s.hint}
        </div>
      )}
    </div>
  );
}
