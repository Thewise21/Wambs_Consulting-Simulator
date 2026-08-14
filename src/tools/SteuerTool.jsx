/* ============================================================================
 * Simulateur d'impot sur le revenu — parcours historique en 6 etapes.
 * Extrait tel quel de l'ancien App.jsx lors du passage a la suite d'outils :
 * la logique metier et les composants d'etape sont inchanges.
 * ========================================================================== */
import { useEffect, useState } from 'react';
import ProgressBar from '../components/ProgressBar';
import StepWelcome from '../components/StepWelcome';
import Step1Profil from '../components/Step1Profil';
import Step2Revenus from '../components/Step2Revenus';
import Step3Famille from '../components/Step3Famille';
import Step4Deductions from '../components/Step4Deductions';
import Step5Calcul from '../components/Step5Calcul';
import Step6Resultat from '../components/Step6Resultat';

const TOTAL_ETAPES = 6;
const CLE_STOCKAGE = 'wambs-simulator';

const donneesInitiales = {
  profil: null,
  revenu: 40000,
  retraiteContrib: 0,
  fraisProActif: null,
  fraisPro: 0,
  chargesActif: null,
  charges: 0,
  statut: null,
  steuerklasse: null,
  enfants: null,
  kindergeld: null,
  deductions: [],
  resultat: null,
};

function chargerSession() {
  try {
    const sauvegarde = localStorage.getItem(CLE_STOCKAGE);
    if (sauvegarde) return JSON.parse(sauvegarde);
  } catch { /* ignore */ }
  return null;
}

export default function SteuerTool({ t, langue }) {
  const session = chargerSession();
  const [etape, setEtape] = useState(session?.etape || 0);
  const [data, setData] = useState(session?.data || { ...donneesInitiales });

  useEffect(() => {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify({ etape, data }));
  }, [etape, data]);

  const peutContinuer = () => {
    switch (etape) {
      case 0: return true;
      case 1: return !!data.profil;
      case 2: return data.revenu > 0;
      case 3: return !!data.statut && !!data.steuerklasse && data.enfants !== null;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const suivant = () => {
    if (etape < TOTAL_ETAPES && peutContinuer()) setEtape(etape + 1);
  };
  const retour = () => {
    if (etape > 1) setEtape(etape - 1);
  };
  const recommencer = () => {
    setData({ ...donneesInitiales });
    setEtape(0);
    localStorage.removeItem(CLE_STOCKAGE);
  };

  const rendreEtape = () => {
    switch (etape) {
      case 0: return <StepWelcome onStart={() => setEtape(1)} t={t} />;
      case 1: return <Step1Profil data={data} setData={setData} t={t} />;
      case 2: return <Step2Revenus data={data} setData={setData} t={t} />;
      case 3: return <Step3Famille data={data} setData={setData} t={t} />;
      case 4: return <Step4Deductions data={data} setData={setData} t={t} />;
      case 5: return <Step5Calcul data={data} setData={setData} t={t} />;
      case 6: return <Step6Resultat data={data} t={t} langue={langue} onRestart={recommencer} />;
      default: return null;
    }
  };

  return (
    <>
      {etape >= 1 && etape <= 6 && <ProgressBar etape={etape} total={TOTAL_ETAPES} t={t} />}
      <div key={etape}>{rendreEtape()}</div>

      {etape >= 1 && etape <= 5 && (
        <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-8 mb-4 max-w-2xl mx-auto">
          {etape > 1 && (
            <button
              type="button"
              onClick={retour}
              className="btn-outline-gradient flex-1 py-3 rounded-xl cursor-pointer font-medium
                         text-sm sm:text-base min-h-[48px]"
            >
              {t.back}
            </button>
          )}
          <button
            type="button"
            onClick={suivant}
            disabled={!peutContinuer()}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base min-h-[48px] ${
              peutContinuer()
                ? 'btn-gradient text-white cursor-pointer'
                : 'bg-wambs-surface text-wambs-muted cursor-not-allowed'
            }`}
          >
            {t.next}
          </button>
        </div>
      )}
    </>
  );
}
