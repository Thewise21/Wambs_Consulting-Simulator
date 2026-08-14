/* Coquille de l'application — theme, langue, navigation entre simulateurs.
 * Chaque simulateur vit dans src/tools/ et ne connait ni le theme ni la route.
 *
 * L'en-tete, le pied de page legal et les retours vers le site principal
 * proviennent de la revision de conformite validee le 10.08.2026 : ils ne
 * doivent pas etre alleges. */
import { useEffect, useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
import ToolHub from './components/ToolHub';
import { RetourHub } from './components/shared/UI';
import FournisseurOutil from './components/shared/FournisseurOutil';
import SteuerTool from './tools/SteuerTool';
import BruttoNettoTool from './tools/BruttoNettoTool';
import ExpatTool from './tools/ExpatTool';
import HonorarTool from './tools/HonorarTool';
import RechtsformTool from './tools/RechtsformTool';
import KleinunternehmerTool from './tools/KleinunternehmerTool';
import FirmenwagenTool from './tools/FirmenwagenTool';
import ImmobilienTool from './tools/ImmobilienTool';
import KaufnebenkostenTool from './tools/KaufnebenkostenTool';
import PhotovoltaikTool from './tools/PhotovoltaikTool';
import AbfindungTool from './tools/AbfindungTool';
import AltersvorsorgeTool from './tools/AltersvorsorgeTool';
import ErbschaftTool from './tools/ErbschaftTool';
import ErklaerungspflichtTool from './tools/ErklaerungspflichtTool';
import UnterhaltTool from './tools/UnterhaltTool';
import KindergeldAuslandTool from './tools/KindergeldAuslandTool';
import RentenerstattungTool from './tools/RentenerstattungTool';
import { HOME, SITE } from './config/links';
import { outilParRoute } from './config/tools';
import { useRoute } from './lib/router';

import frJson from './i18n/fr.json';
import deJson from './i18n/de.json';
import enJson from './i18n/en.json';
import frTools from './i18n/tools.fr.json';
import deTools from './i18n/tools.de.json';
import enTools from './i18n/tools.en.json';

const traductions = {
  fr: { ...frJson, ...frTools },
  de: { ...deJson, ...deTools },
  en: { ...enJson, ...enTools },
};

const CLE_LANGUE = 'wambs-langue';
const THEME_KEY = 'wambs-theme';

const COMPOSANTS = {
  steuer: SteuerTool,
  bruttoNetto: BruttoNettoTool,
  expat: ExpatTool,
  honorar: HonorarTool,
  rechtsform: RechtsformTool,
  kleinunternehmer: KleinunternehmerTool,
  firmenwagen: FirmenwagenTool,
  immobilien: ImmobilienTool,
  kaufnebenkosten: KaufnebenkostenTool,
  photovoltaik: PhotovoltaikTool,
  abfindung: AbfindungTool,
  altersvorsorge: AltersvorsorgeTool,
  erbschaft: ErbschaftTool,
  erklaerungspflicht: ErklaerungspflichtTool,
  unterhalt: UnterhaltTool,
  kindergeldAusland: KindergeldAuslandTool,
  rentenerstattung: RentenerstattungTool,
};

function lireStockage(cle, valeurs, defaut) {
  try {
    const enregistre = localStorage.getItem(cle);
    if (valeurs.includes(enregistre)) return enregistre;
  } catch { /* ignore */ }
  return defaut;
}

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

export default function App() {
  const [route, naviguer] = useRoute();
  const [langue, setLangue] = useState(() => lireStockage(CLE_LANGUE, ['fr', 'de', 'en'], 'de'));
  const [theme, setTheme] = useState(() => lireStockage(THEME_KEY, ['light', 'dark'], 'light'));

  const t = traductions[langue];
  const outil = outilParRoute(route);
  const Simulateur = outil ? COMPOSANTS[outil.id] : null;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    /* Papier bzw. Tinte — muss zur Stildatei passen, sonst blitzt beim
       Ueberscrollen die alte Farbe durch. */
    document.body.style.backgroundColor = theme === 'dark' ? '#0E1620' : '#F4F1EA';
    document.body.style.color = theme === 'dark' ? '#F4F1EA' : '#111A24';
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(CLE_LANGUE, langue);
  }, [langue]);

  /* Titre de l'onglet aligne sur le simulateur ouvert */
  useEffect(() => {
    const nom = outil ? t.hub.outils[outil.id]?.titre : t.hub.titreOnglet;
    document.title = nom ? `${nom} — WAMB'S Consulting` : "WAMB'S Consulting";
  }, [outil, t]);

  const basculerTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const sousTitre = outil ? t.hub.outils[outil.id]?.titre : t.title;

  return (
    <div className="min-h-screen bg-wambs-dark relative flex flex-col">
      <div className="bg-orbs" />

      <header className="sticky top-0 z-10 header-bg">
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-3
                        flex items-center justify-between gap-2">
          {/* Die Marke fuehrt zurueck zur Website — sonst ist der Simulator
              eine Sackgasse. */}
          <a href={HOME} className="flex items-center gap-3 min-w-0 group" title={t['site.back']}>
            <img src={`${import.meta.env.BASE_URL}logo-mark.png`} alt="WAMB'S Consulting"
              className="h-10 w-10 object-contain flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gradient tracking-wide">WAMB&apos;S</h1>
              {/* Untertitel erst ab Tablet — auf dem Telefon fehlt die Breite */}
              <p className="text-xs text-wambs-muted hidden sm:block truncate">{sousTitre}</p>
            </div>
          </a>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Website-Navigation ab Tablet — auf dem Telefon genuegt die Marke */}
            <nav className="hidden lg:flex items-center gap-5 mr-3">
              {SITE.map(({ key, href }) => (
                <a key={key} href={href}
                  className="text-sm text-wambs-muted hover:text-wambs-text transition-colors">
                  {t[`site.${key}`]}
                </a>
              ))}
            </nav>
            <button
              type="button"
              onClick={basculerTheme}
              className="p-2 rounded-lg border border-wambs-border text-wambs-muted hover:text-wambs-text
                         transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <LanguageSelector langue={langue} setLangue={setLangue} />
          </div>
        </div>
        <div className="line-gradient" />
      </header>

      <main className="flex-grow max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto w-full
                       px-3 sm:px-4 py-4 sm:py-6 relative z-1">
        {Simulateur ? (
          <FournisseurOutil outil={outil} langue={langue}>
            <RetourHub libelle={t.hub.retour} onRetour={() => naviguer('')} />
            <Simulateur t={t} langue={langue} />
          </FournisseurOutil>
        ) : (
          <ToolHub t={t} naviguer={naviguer} />
        )}
      </main>

      {/* Pflichtangaben & Haftungshinweis — auf jeder Ansicht sichtbar */}
      <footer className="relative z-10 mt-10 border-t border-wambs-border">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-wambs-muted text-[13px] font-semibold uppercase tracking-wider mb-1">{t.legal.legalTitle}</p>
          <p className="text-wambs-muted text-[13px] leading-relaxed">{t.legal.legalBody}</p>
          <p className="text-wambs-muted text-[13px] leading-relaxed mt-2">{t.legal.legalDisclaimer}</p>
          <p className="text-wambs-muted text-[13px] leading-relaxed mt-2 opacity-80">{t.legal.legalPrivacy}</p>

          {/* Rueckwege zur Website — hier auch auf dem Telefon erreichbar */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 mt-5 pt-4 border-t border-wambs-border">
            <a href={HOME}
              className="inline-flex items-center min-h-[44px] text-sm text-wambs-text hover:text-wambs-cyan transition-colors">
              {t['site.back']}
            </a>
            {SITE.map(({ key, href }) => (
              <a key={key} href={href}
                className="inline-flex items-center min-h-[44px] text-sm text-wambs-muted hover:text-wambs-text transition-colors">
                {t[`site.${key}`]}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
