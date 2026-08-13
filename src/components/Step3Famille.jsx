/* Etape 3 — Situation familiale — Avec tooltips Steuerklasse + "Ich weiß es nicht" */
import { useState } from 'react';

const STATUTS = ['celibataire', 'marie', 'pacse', 'veuf'];
const STEUERKLASSEN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const ENFANTS_OPTIONS = [0, 1, 2, '3+'];

export default function Step3Famille({ data, setData, t }) {
  const s = t.step3;
  const tip = s.tooltip || {};
  const [showTooltip, setShowTooltip] = useState(false);
  const update = (champ, valeur) => setData({ ...data, [champ]: valeur });

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-gradient mb-4 sm:mb-6">{s.title}</h2>

      {/* Familienstand */}
      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-3 text-sm sm:text-base">{s.statut}</label>
        <div className="grid grid-cols-2 gap-2">
          {STATUTS.map((statut) => (
            <button key={statut} onClick={() => update('statut', statut)}
              className={`px-3 py-2.5 rounded border text-xs sm:text-sm cursor-pointer transition-all min-h-[44px] ${
                data.statut === statut ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'
              }`}>{s[statut]}</button>
          ))}
        </div>
      </div>

      {/* Steuerklasse mit Info-Button */}
      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5 card-hover">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-wambs-text font-medium text-sm sm:text-base">
            {s.steuerklasse}
          </label>
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            aria-label={tip.title}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-wambs-cyan/40 text-wambs-cyan hover:bg-wambs-cyan/10 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>
        </div>

        {showTooltip && (
          <div className="mb-4 p-3 rounded-lg text-xs sm:text-sm space-y-1.5"
               style={{ backgroundColor: 'rgba(6, 245, 245, 0.06)', border: '1px solid rgba(6, 245, 245, 0.2)' }}>
            <p className="font-semibold text-wambs-cyan mb-2">{tip.title}</p>
            {['I', 'II', 'III', 'IV', 'V', 'VI'].map((k) => (
              <p key={k} className="text-wambs-text leading-relaxed">{tip[k]}</p>
            ))}
            <p className="text-wambs-muted text-xs italic pt-2 border-t border-wambs-cyan/20 mt-2">{tip.info}</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {STEUERKLASSEN.map((klasse) => (
            <button key={klasse} onClick={() => update('steuerklasse', klasse)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded border text-sm font-medium cursor-pointer transition-all ${
                data.steuerklasse === klasse ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'
              }`}>{klasse}</button>
          ))}
        </div>
        <button
          onClick={() => update('steuerklasse', 'unknown')}
          className={`mt-3 w-full px-3 py-2 rounded border text-xs sm:text-sm cursor-pointer transition-all ${
            data.steuerklasse === 'unknown'
              ? 'btn-gradient text-white border-transparent'
              : 'border-wambs-border text-wambs-muted hover:text-wambs-text'
          }`}
        >
          {s.steuerklasseUnknown}
        </button>
      </div>

      {/* Anzahl Kinder */}
      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-3 text-sm sm:text-base">
          {s.enfants}
        </label>
        <div className="flex gap-2">
          {ENFANTS_OPTIONS.map((n) => (
            <button key={n} onClick={() => update('enfants', n)}
              className={`flex-1 h-12 rounded border text-sm font-medium cursor-pointer transition-all ${
                data.enfants === n ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'
              }`}>{n}</button>
          ))}
        </div>
      </div>

      {/* Kindergeld */}
      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5 card-hover">
        <label className="block text-wambs-text font-medium mb-1 text-sm sm:text-base">
          {s.kindergeld} <span className="text-wambs-muted text-xs sm:text-sm">({s.kindergeld_de})</span>
        </label>
        <div className="flex gap-3 mt-3">
          <button onClick={() => update('kindergeld', true)}
            className={`flex-1 px-4 py-2.5 rounded border cursor-pointer transition-all text-sm min-h-[44px] ${data.kindergeld === true ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}
          >{t.step2.oui}</button>
          <button onClick={() => update('kindergeld', false)}
            className={`flex-1 px-4 py-2.5 rounded border cursor-pointer transition-all text-sm min-h-[44px] ${data.kindergeld === false ? 'btn-gradient text-white border-transparent' : 'border-wambs-border text-wambs-muted hover:text-wambs-text'}`}
          >{t.step2.non}</button>
        </div>
      </div>

      {s.hint && (
        <div className="rounded-lg p-3 text-xs text-wambs-cyan" style={{ backgroundColor: 'rgba(6, 245, 245, 0.06)', border: '1px solid rgba(6, 245, 245, 0.15)' }}>
          <span className="font-medium">💡</span> {s.hint}
        </div>
      )}
    </div>
  );
}
