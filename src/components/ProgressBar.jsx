/* Barre de progression des etapes — remplissage neon gradient */
export default function ProgressBar({ etape, total, t }) {
  const pourcentage = (etape / total) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-wambs-muted">
          {t.step} {etape} {t.of} {total}
        </span>
        <span className="text-sm text-wambs-purple font-medium font-data">
          {Math.round(pourcentage)}%
        </span>
      </div>
      <div className="w-full h-2 bg-wambs-border rounded-full overflow-hidden">
        <div
          className="h-full progress-gradient rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
    </div>
  );
}
