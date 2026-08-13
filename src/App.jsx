/* Application principale — Wambs Simulator — Light/Dark + Responsive */
import { useState, useEffect } from 'react';
import LanguageSelector from './components/LanguageSelector';
import ProgressBar from './components/ProgressBar';
import StepWelcome from './components/StepWelcome';
import Step1Profil from './components/Step1Profil';
import Step2Revenus from './components/Step2Revenus';
import Step3Famille from './components/Step3Famille';
import Step4Deductions from './components/Step4Deductions';
import Step5Calcul from './components/Step5Calcul';
import Step6Resultat from './components/Step6Resultat';

import { LINKS, SITE } from './config/links';

import frJson from './i18n/fr.json';
import deJson from './i18n/de.json';
import enJson from './i18n/en.json';

const traductions = { fr: frJson, de: deJson, en: enJson };
const TOTAL_ETAPES = 6;
const STORAGE_KEY = 'wambs-simulator';
const THEME_KEY = 'wambs-theme';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* ignore */ }
  return 'light';
}

/* Icones soleil/lune pour le toggle */
function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

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
    const sauvegarde = localStorage.getItem(STORAGE_KEY);
    if (sauvegarde) return JSON.parse(sauvegarde);
  } catch { /* ignore */ }
  return null;
}

export default function App() {
  const session = chargerSession();
  const [langue, setLangue] = useState(session?.langue || 'de');
  const [etape, setEtape] = useState(session?.etape || 0); /* 0 = Welcome */
  const [data, setData] = useState(session?.data || { ...donneesInitiales });
  const [theme, setTheme] = useState(getInitialTheme);

  const t = traductions[langue];

  /* Appliquer le theme sur <html> */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = theme === 'dark' ? '#030712' : '#FFFFFF';
    document.body.style.color = theme === 'dark' ? '#E2E8F0' : '#1E293B';
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ langue, etape, data }));
  }, [langue, etape, data]);

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
    localStorage.removeItem(STORAGE_KEY);
  };

  const renderEtape = () => {
    switch (etape) {
      case 0: return <StepWelcome onStart={() => setEtape(1)} t={t} />;
      case 1: return <Step1Profil data={data} setData={setData} t={t} />;
      case 2: return <Step2Revenus data={data} setData={setData} t={t} />;
      case 3: return <Step3Famille data={data} setData={setData} t={t} />;
      case 4: return <Step4Deductions data={data} setData={setData} t={t} />;
      case 5: return <Step5Calcul data={data} setData={setData} t={t} />;
      case 6: return <Step6Resultat data={data} t={t} onRestart={recommencer} />;
      default: return null;
    }
  };

  /* La page Welcome n'a pas de header compact ni progress bar */
  const showHeader = etape > 0;
  const showProgress = etape >= 1 && etape <= 6;

  return (
    <div className="min-h-screen bg-wambs-dark relative">
      <div className="bg-orbs" />

      {showHeader && (
        <header className="sticky top-0 z-10 header-bg">
          <div className="max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
            {/* Die Marke fuehrt zurueck zur Website — sonst ist der
                Simulator eine Sackgasse. */}
            <a href={LINKS.website} className="flex items-center gap-3 min-w-0 group" title={t['site.back']}>
              <img src="/logo-mark.png" alt="WAMB'S Consulting" className="h-10 w-10 object-contain flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gradient tracking-wide">WAMB'S</h1>
                {/* Untertitel erst ab Tablet — auf dem Telefon fehlt die Breite */}
                <p className="text-xs text-wambs-muted hidden sm:block truncate">{t.title}</p>
              </div>
            </a>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Website-Navigation ab Tablet — auf dem Telefon fehlt die Breite,
                  dort genuegt die Marke als Rueckweg. */}
              <nav className="hidden lg:flex items-center gap-5 mr-3">
                {SITE.map(({ key, href }) => (
                  <a key={key} href={href}
                    className="text-sm text-wambs-muted hover:text-wambs-text transition-colors">
                    {t['site.' + key]}
                  </a>
                ))}
              </nav>
              <button onClick={toggleTheme}
                className="p-2 rounded-lg border border-wambs-border text-wambs-muted hover:text-wambs-text transition-colors cursor-pointer"
                aria-label="Toggle theme">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
              <LanguageSelector langue={langue} setLangue={setLangue} />
            </div>
          </div>
          <div className="line-gradient" />
        </header>
      )}

      {/* Language + theme toggle on welcome page */}
      {!showHeader && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button onClick={toggleTheme}
            className="p-2 rounded-lg border border-wambs-border text-wambs-muted hover:text-wambs-text transition-colors cursor-pointer"
            aria-label="Toggle theme">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <LanguageSelector langue={langue} setLangue={setLangue} />
        </div>
      )}

      <main className="max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 relative z-1">
        {showHeader && <p className="text-center text-wambs-muted text-sm mb-6">{t.subtitle}</p>}
        {showProgress && <ProgressBar etape={etape} total={TOTAL_ETAPES} t={t} />}
        <div key={etape}>{renderEtape()}</div>

        {/* Navigation — seulement pour les etapes 1-5 */}
        {etape >= 1 && etape <= 5 && (
          <div className="flex gap-3 mt-8 mb-4 max-w-2xl mx-auto">
            {etape > 1 && (
              <button onClick={retour} className="btn-outline-gradient flex-1 py-3 rounded-xl cursor-pointer font-medium">
                {t.back}
              </button>
            )}
            {etape < TOTAL_ETAPES && (
              <button
                onClick={suivant}
                disabled={!peutContinuer()}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all cursor-pointer ${
                  peutContinuer() ? 'btn-gradient text-white' : 'bg-wambs-surface text-wambs-muted cursor-not-allowed'
                }`}
              >
                {t.next}
              </button>
            )}
          </div>
        )}
      </main>

      {/* Pflichtangaben & Haftungshinweis — auf jeder Ansicht sichtbar */}
      <footer className="relative z-10 mt-10 border-t border-wambs-border">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-wambs-muted text-[11px] font-semibold uppercase tracking-wider mb-1">{t.legal.legalTitle}</p>
          <p className="text-wambs-muted text-[11px] leading-relaxed">{t.legal.legalBody}</p>
          <p className="text-wambs-muted text-[11px] leading-relaxed mt-2">{t.legal.legalDisclaimer}</p>
          <p className="text-wambs-muted text-[11px] leading-relaxed mt-2 opacity-80">{t.legal.legalPrivacy}</p>

          {/* Rueckwege zur Website — hier auch auf dem Telefon erreichbar */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 mt-5 pt-4 border-t border-wambs-border">
            <a href={LINKS.website}
              className="inline-flex items-center min-h-[44px] text-sm text-wambs-text hover:text-wambs-cyan transition-colors">
              {t['site.back']}
            </a>
            {SITE.map(({ key, href }) => (
              <a key={key} href={href}
                className="inline-flex items-center min-h-[44px] text-sm text-wambs-muted hover:text-wambs-text transition-colors">
                {t['site.' + key]}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
