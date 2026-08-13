/* Etape 5 — Calcul estimatif avec animation phasee + breakdown */
/* Moteur de calcul avec baremes 2025, Zusammenveranlagung et nouveaux profils */
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { interpoler } from '../lib/format';

/* Profils sans revenu impose ou avec revenu reduit */
const PROFIL_REVENU_REDUIT = ['etudiant', 'elternzeit', 'arbeitslos'];

function calculerPotentiel(data) {
  const revenu = data.revenu || 0;
  const profil = data.profil || 'salarie';
  if (revenu === 0) return { montant: 0, pourcentage: 0, niveau: 'low', breakdown: [] };

  const breakdown = [];
  const pauschbetrag = 1230;
  let totalDeductions = 0;

  /* Altersvorsorge — deductible a 100% depuis 2023 */
  if (data.retraiteContrib > 0) {
    totalDeductions += data.retraiteContrib;
    breakdown.push({ label: 'Altersvorsorge', value: data.retraiteContrib });
  }

  /* Werbungskosten reels vs Pauschbetrag */
  const fraisReel = data.fraisProActif ? (data.fraisPro || 0) : 0;
  if (fraisReel > pauschbetrag) {
    const surplus = fraisReel - pauschbetrag;
    totalDeductions += surplus;
    breakdown.push({ label: 'Werbungskosten (über Pauschbetrag)', value: surplus });
  } else if (profil === 'salarie' || profil === 'beamte' || profil === 'double' || profil === 'etudiant') {
    /* Arbeitnehmer-Pauschbetrag wird automatisch berücksichtigt */
    breakdown.push({ label: 'Arbeitnehmer-Pauschbetrag', value: pauschbetrag });
    totalDeductions += pauschbetrag;
  }

  /* Betriebsausgaben pour profils independants */
  if (data.chargesActif && data.charges > 0) {
    totalDeductions += data.charges;
    breakdown.push({ label: 'Betriebsausgaben', value: data.charges });
  }

  /* Deductions speciales */
  const deductionsValues = {
    homeoffice: 1260,
    doppelte: 6000,
    fortbildung: 2000,
    kinderbetreuung: 4000,
    spenden: 1500,
    handwerker: 1200,
    umzug: 1500,
    crypto: 800,
    vermietung: 5000,
    medical: 2000,
  };
  const deductionLabels = {
    homeoffice: 'Homeoffice-Pauschale',
    doppelte: 'Doppelte Haushaltsführung',
    fortbildung: 'Fortbildung',
    kinderbetreuung: 'Kinderbetreuung',
    spenden: 'Spenden',
    handwerker: 'Handwerkerleistungen',
    umzug: 'Umzugskosten',
    crypto: 'Krypto-Verluste',
    vermietung: 'Vermietung',
    medical: 'Außergewöhnliche Belastungen',
  };
  (data.deductions || []).forEach((key) => {
    const v = deductionsValues[key] || 0;
    if (v > 0) {
      totalDeductions += v;
      breakdown.push({ label: deductionLabels[key] || key, value: v });
    }
  });

  /* Zusammenveranlagung */
  const isCouple = data.statut === 'marie' || data.statut === 'pacse';
  if (isCouple) {
    totalDeductions += 2500;
    breakdown.push({ label: 'Splittingvorteil (Ehegatten)', value: 2500 });
  }

  /* Steuerklasse-Vorteile */
  if (data.steuerklasse === 'III') {
    totalDeductions += 3000;
    breakdown.push({ label: 'Steuerklasse III Vorteil', value: 3000 });
  }
  if (data.steuerklasse === 'II') {
    totalDeductions += 4260;
    breakdown.push({ label: 'Alleinerziehenden-Entlastung', value: 4260 });
  }

  /* Kindergeld / Kinderfreibetrag */
  const enfants = data.enfants === '3+' ? 3 : (data.enfants || 0);
  if (enfants > 0 && !data.kindergeld) {
    const v = enfants * 6384;
    totalDeductions += v;
    breakdown.push({ label: `Kinderfreibetrag (${enfants} Kind${enfants > 1 ? 'er' : ''})`, value: v });
  }

  /* Taux marginal d'imposition 2025 */
  let taux;
  const zvE = isCouple ? revenu / 2 : revenu;
  if (zvE <= 11784) taux = 0;
  else if (zvE <= 17005) taux = 0.14;
  else if (zvE <= 66760) taux = 0.24;
  else if (zvE <= 277825) taux = 0.35;
  else taux = 0.42;

  if (isCouple && revenu > 23568) {
    taux = Math.max(taux - 0.04, 0.10);
  }

  /* Profils avec revenu reduit/non impose → potentiel limite */
  let montant = Math.round(totalDeductions * taux);
  if (PROFIL_REVENU_REDUIT.includes(profil)) {
    /* Pour etudiants/arbeitslos/elternzeit: souvent Verlustvortrag → max 800-1500€ realiste */
    montant = Math.min(montant, 1500);
  }

  const pourcentage = revenu > 0 ? Math.min(100, Math.round((montant / revenu) * 100 * 10)) : 0;

  let niveau = 'low';
  if (montant > 1500) niveau = 'medium';
  if (montant > 10000) niveau = 'high';

  return { montant, pourcentage: Math.min(pourcentage, 95), niveau, breakdown };
}

/* Animation phasee avec textes sequentiels */
function LoadingAnimation({ s, phase }) {
  const phases = [s.phase1, s.phase2, s.phase3, s.phase4];
  return (
    <div className="step-enter flex flex-col items-center justify-center py-12 sm:py-16 px-4">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full animate-spin mb-6"
        style={{ border: '4px solid #1C2640', borderTopColor: '#06F5F5', borderRightColor: '#A855F7' }} />
      <div className="w-full max-w-sm space-y-2">
        {phases.map((text, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 transition-all duration-500 ${
              i === phase ? 'opacity-100' : i < phase ? 'opacity-60' : 'opacity-20'
            }`}
          >
            {i < phase ? (
              <svg className="w-4 h-4 text-wambs-cyan flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            ) : i === phase ? (
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-wambs-cyan animate-pulse" />
              </div>
            ) : (
              <div className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm sm:text-base text-wambs-text">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Step5Calcul({ data, setData, t }) {
  const s = t.step5;
  const [phase, setPhase] = useState(0);
  const [afficher, setAfficher] = useState(false);
  const [breakdownOuvert, setBreakdownOuvert] = useState(false);
  const resultat = calculerPotentiel(data);

  useEffect(() => {
    setData((prev) => ({ ...prev, resultat }));
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2100);
    const t4 = setTimeout(() => setAfficher(true), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pieData = [
    { name: s.optimized, value: resultat.pourcentage },
    { name: s.notOptimized, value: 100 - resultat.pourcentage },
  ];

  const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const niveauConfig = {
    low:    { color: '#06F5F5', bg: 'rgba(6, 245, 245, 0.1)' },
    medium: { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)' },
    high:   { color: '#FB923C', bg: 'rgba(251, 146, 60, 0.1)' },
  };

  if (!afficher) return <LoadingAnimation s={s} phase={phase} />;

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-gradient mb-4 sm:mb-6">{s.title}</h2>

      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-6">
        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
          <div className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="#A855F7" />
                  <Cell fill="#1C2640" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start flex-wrap">
              <span className="text-xs sm:text-sm text-wambs-muted">{s.potential} :</span>
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                style={{ color: niveauConfig[resultat.niveau].color, backgroundColor: niveauConfig[resultat.niveau].bg }}>
                {s[resultat.niveau]}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-wambs-orange mb-2 font-data">{fmt(resultat.montant)}</div>
            <p className="text-xs sm:text-sm text-wambs-muted">{s.estimated}</p>
          </div>
        </div>
        <div className="flex gap-4 sm:gap-6 justify-center mt-4 pt-4 border-t border-wambs-border flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-wambs-purple" />
            <span className="text-xs sm:text-sm text-wambs-text">{s.optimized}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-wambs-border" />
            <span className="text-xs sm:text-sm text-wambs-text">{s.notOptimized}</span>
          </div>
        </div>
      </div>

      {/* Breakdown — Aufschlüsselung der Berechnung */}
      {resultat.breakdown && resultat.breakdown.length > 0 && (
        <div className="bg-wambs-panel border border-wambs-border rounded-lg">
          <button
            onClick={() => setBreakdownOuvert(!breakdownOuvert)}
            className="w-full flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-wambs-cyan/5 transition-colors rounded-lg"
          >
            <span className="text-sm font-semibold text-wambs-cyan">
              {interpoler(s.breakdownTitel, { n: resultat.breakdown.length })}
            </span>
            <svg
              className={`w-4 h-4 text-wambs-cyan transition-transform ${breakdownOuvert ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {breakdownOuvert && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2 border-t border-wambs-border pt-3">
              {resultat.breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-wambs-text">{item.label}</span>
                  <span className="text-wambs-muted font-data">{fmt(item.value)}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-wambs-border flex items-center justify-between text-xs italic text-wambs-muted">
                <span>{s.breakdownHinweis}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {s.disclaimer && (
        <p className="text-wambs-muted text-xs text-center italic px-2">{s.disclaimer}</p>
      )}
    </div>
  );
}
