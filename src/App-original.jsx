/* Application principale — Wambs Simulator */
import { useState, useEffect } from 'react';
import LanguageSelector from './components/LanguageSelector';
import ProgressBar from './components/ProgressBar';
import Step1Profil from './components/Step1Profil';
import Step2Revenus from './components/Step2Revenus';
import Step3Famille from './components/Step3Famille';
import Step4Deductions from './components/Step4Deductions';
import Step5Calcul from './components/Step5Calcul';
import Step6Resultat from './components/Step6Resultat';

import frJson from './i18n/fr.json';
import deJson from './i18n/de.json';
import enJson from './i18n/en.json';

const traductions = { fr: frJson, de: deJson, en: enJson };
const TOTAL_ETAPES = 6;
const STORAGE_KEY = 'wambs-simulator';

/* Donnees initiales par defaut */
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

/* Charger la session sauvegardee depuis localStorage */
function chargerSession() {
  try {
    const sauvegarde = localStorage.getItem(STORAGE_KEY);
    if (sauvegarde) return JSON.parse(sauvegarde);
  } catch { /* ignore */ }
  return null;
}

export default function App() {
  const session = chargerSession();
  const [langue, setLangue] = useState(session?.langue || 'de');
  const [etape, setEtape] = useState(session?.etape || 1);
  const [data, setData] = useState(session?.data || { ...donneesInitiales });

  const t = traductions[langue];

  /* Sauvegarder la session dans localStorage a chaque changement */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ langue, etape, data }));
  }, [langue, etape, data]);

  /* Verification : peut-on passer a l'etape suivante ? */
  const peutContinuer = () => {
    switch (etape) {
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
    setEtape(1);
    localStorage.removeItem(STORAGE_KEY);
  };

  /* Rendu de l'etape courante */
  const renderEtape = () => {
    switch (etape) {
      case 1: return <Step1Profil data={data} setData={setData} t={t} />;
      case 2: return <Step2Revenus data={data} setData={setData} t={t} />;
      case 3: return <Step3Famille data={data} setData={setData} t={t} />;
      case 4: return <Step4Deductions data={data} setData={setData} t={t} />;
      case 5: return <Step5Calcul data={data} setData={setData} t={t} />;
      case 6: return <Step6Resultat data={data} t={t} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-wambs-dark">
      {/* En-tete avec ligne gradient en bas */}
      <header className="sticky top-0 z-10 bg-wambs-dark/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-wambs.png" alt="WAMB'S Consulting" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gradient tracking-wide">WAMB'S</h1>
              <p className="text-xs text-wambs-muted">{t.title}</p>
            </div>
          </div>
          <LanguageSelector langue={langue} setLangue={setLangue} />
        </div>
        <div className="line-gradient" />
      </header>

      {/* Contenu principal */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Sous-titre */}
        <p className="text-center text-wambs-muted text-sm mb-6">{t.subtitle}</p>

        {/* Barre de progression */}
        <ProgressBar etape={etape} total={TOTAL_ETAPES} t={t} />

        {/* Etape courante */}
        <div key={etape}>
          {renderEtape()}
        </div>

        {/* Navigation bas */}
        <div className="flex gap-3 mt-8 mb-4">
          {etape > 1 && etape < 6 && (
            <button
              onClick={retour}
              className="btn-outline-gradient flex-1 py-3 rounded-lg cursor-pointer font-medium"
            >
              {t.back}
            </button>
          )}
          {etape < TOTAL_ETAPES && (
            <button
              onClick={suivant}
              disabled={!peutContinuer()}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
                peutContinuer()
                  ? 'btn-gradient text-white'
                  : 'bg-wambs-surface text-wambs-muted cursor-not-allowed'
              }`}
            >
              {t.next}
            </button>
          )}
          {etape === 6 && (
            <button
              onClick={recommencer}
              className="btn-outline-gradient flex-1 py-3 rounded-lg cursor-pointer font-medium"
            >
              {t.back}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
