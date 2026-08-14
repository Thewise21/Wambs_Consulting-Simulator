/* Barre de progression — Step indicators + barre gradient */
export default function ProgressBar({ etape, total, t }) {
  const pourcentage = (etape / total) * 100;
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="w-full mb-6 sm:mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs sm:text-sm text-wambs-muted">
          {t.step} {etape} {t.of} {total}
        </span>
        <span className="text-xs sm:text-sm text-wambs-purple font-medium font-data">
          {Math.round(pourcentage)}%
        </span>
      </div>

      {/* Step Indicators (Mini-Map) */}
      <div className="flex items-center justify-between mb-2 px-1">
        {steps.map((step, idx) => {
          const isDone = step < etape;
          const isCurrent = step === etape;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step Dot */}
              <div
                className={`relative flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[13px] sm:text-[13.5px] font-semibold transition-all ${
                  isDone
                    ? 'bg-gradient-to-br from-wambs-cyan to-wambs-purple text-white'
                    : isCurrent
                    ? 'bg-wambs-purple text-white ring-2 ring-wambs-purple/40 ring-offset-2 ring-offset-transparent'
                    : 'bg-wambs-border text-wambs-muted'
                }`}
                aria-label={`Step ${step}${isCurrent ? ' (aktuell)' : isDone ? ' (erledigt)' : ''}`}
              >
                {isDone ? (
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors ${
                  step < etape ? 'bg-gradient-to-r from-wambs-cyan to-wambs-purple' : 'bg-wambs-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-wambs-border rounded-full overflow-hidden">
        <div
          className="h-full progress-gradient rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
    </div>
  );
}
