/* Etape 5 — Calcul estimatif — Style Neon Aurora */
/* Moteur de calcul ameliore avec baremes 2025 et Zusammenveranlagung */
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

function calculerPotentiel(data) {
  const revenu = data.revenu || 0;
  if (revenu === 0) return { montant: 0, pourcentage: 0, niveau: 'low' };

  const pauschbetrag = 1230;
  let totalDeductions = 0;

  /* Altersvorsorge — deductible a 100% depuis 2023 */
  totalDeductions += (data.retraiteContrib || 0);

  /* Werbungskosten reels vs Pauschbetrag */
  const fraisReel = data.fraisProActif ? (data.fraisPro || 0) : 0;
  if (fraisReel > pauschbetrag) totalDeductions += fraisReel - pauschbetrag;

  /* Betriebsausgaben pour profils independants */
  if (data.chargesActif) totalDeductions += data.charges || 0;

  /* Deductions speciales — valeurs estimatives reelles */
  const deductionsValues = {
    homeoffice: 1260,        /* 6€/Tag, max 210 Tage */
    doppelte: 6000,          /* Zweitwohnung am Arbeitsort — tres frequent dans la clientele */
    fortbildung: 2000,       /* Kurse, Seminare, Fachliteratur */
    kinderbetreuung: 4000,   /* max 4.000€/Kind (2/3 von 6.000€) — tres pertinent pour familles */
    spenden: 1500,           /* Gemeinnuetzige Organisationen */
    handwerker: 1200,        /* 20% von max 6.000€ Handwerkerleistungen */
    umzug: 1500,             /* Umzugskostenpauschale — pertinent pour clientele internationale */
    crypto: 800,             /* Haltefrist, Verlustverrechnung */
    vermietung: 5000,        /* Mieteinnahmen, AfA, Renovierung */
    medical: 2000,           /* Krankheitskosten, Pflegekosten */
  };
  (data.deductions || []).forEach((key) => { totalDeductions += deductionsValues[key] || 0; });

  /* Zusammenveranlagung — avantage fiscal reel pour couples maries */
  const isCouple = data.statut === 'marie' || data.statut === 'pacse';
  if (isCouple) totalDeductions += 2500; /* Splittingvorteil simule */

  /* Steuerklasse III donne un avantage additionnel */
  if (data.steuerklasse === 'III') totalDeductions += 3000;
  /* Steuerklasse II (Alleinerziehendenentlastungsbetrag) */
  if (data.steuerklasse === 'II') totalDeductions += 4260;

  /* Kindergeld/Kinderfreibetrag — pertinent car 7% des clients sont Ehepaare avec enfants */
  const enfants = data.enfants === '3+' ? 3 : (data.enfants || 0);
  if (enfants > 0 && !data.kindergeld) {
    /* Kinderfreibetrag si pas de Kindergeld : 6384€/Kind (2025) */
    totalDeductions += enfants * 6384;
  }

  /* Taux marginal d'imposition 2025 — baremes actualises */
  let taux;
  const zvE = isCouple ? revenu / 2 : revenu; /* Splitting pour couples */
  if (zvE <= 11784) taux = 0;
  else if (zvE <= 17005) taux = 0.14;
  else if (zvE <= 66760) taux = 0.24;
  else if (zvE <= 277825) taux = 0.35;
  else taux = 0.42;

  /* Pour les couples : le taux effectif est plus bas grace au Splitting */
  if (isCouple && revenu > 23568) {
    taux = Math.max(taux - 0.04, 0.10);
  }

  const montant = Math.round(totalDeductions * taux);
  const pourcentage = Math.min(100, Math.round((montant / revenu) * 100 * 10));

  /* Seuils calibres sur les Bescheide reels recus par la Kanzlei :
     - < 1.500€ → Low (Arbeitnehmer simple, peu de deductions)
     - 1.500€ - 10.000€ → Medium (cas typique avec Werbungskosten, Homeoffice, etc.)
     - > 10.000€ → High (Ehepaar Zusammenveranlagung, cas complexes multi-deductions) */
  let niveau = 'low';
  if (montant > 1500) niveau = 'medium';
  if (montant > 10000) niveau = 'high';

  return { montant, pourcentage: Math.min(pourcentage, 95), niveau };
}

export default function Step5Calcul({ data, setData, t }) {
  const s = t.step5;
  const [afficher, setAfficher] = useState(false);
  const resultat = calculerPotentiel(data);

  useEffect(() => {
    setData((prev) => ({ ...prev, resultat }));
    const timer = setTimeout(() => setAfficher(true), 1200);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pieData = [
    { name: s.optimized, value: resultat.pourcentage },
    { name: s.notOptimized, value: 100 - resultat.pourcentage },
  ];

  const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);


  if (!afficher) {
    return (
      <div className="step-enter flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 rounded-full animate-spin mb-6"
          style={{ border: '2px solid var(--color-wambs-border)', borderTopColor: 'var(--color-wambs-purple)' }} />
        <p className="text-wambs-muted text-lg">{s.calculating}</p>
      </div>
    );
  }

  return (
    <div className="step-enter space-y-6">
      <h2 className="text-2xl font-semibold text-gradient mb-6">{s.title}</h2>
      <div className="bg-wambs-panel border border-wambs-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="var(--color-wambs-purple)" />
                  <Cell fill="var(--color-wambs-border)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
              <span className="text-sm text-wambs-muted">{s.potential} :</span>
              <span className={`badge badge--${resultat.niveau} px-3 py-1`}>
                {s[resultat.niveau]}
              </span>
            </div>
            <div className="text-3xl font-bold text-wambs-orange mb-2 font-data">{fmt(resultat.montant)}</div>
            <p className="text-sm text-wambs-muted">{s.estimated}</p>
          </div>
        </div>
        <div className="flex gap-6 justify-center mt-4 pt-4 border-t border-wambs-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-wambs-purple" />
            <span className="text-sm text-wambs-text">{s.optimized}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-wambs-border" />
            <span className="text-sm text-wambs-text">{s.notOptimized}</span>
          </div>
        </div>
      </div>
      {s.disclaimer && (
        <p className="text-wambs-muted text-xs text-center italic">{s.disclaimer}</p>
      )}
    </div>
  );
}
