/* Etape 0 — Page d'accueil avec trust signals — Style Neon Aurora */
import { COMPANY } from '../config/links';

const trustIcons = [
  /* Mandate international */
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>,
  /* Kanzlei Berlin */
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
  </svg>,
  /* Dreisprachig */
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
  </svg>,
  /* Digital mit TaxDome */
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
  </svg>,
];

export default function StepWelcome({ onStart, t }) {
  const w = t.welcome;

  const trustItems = [w.trust1, w.trust2, w.trust3, w.trust4];

  return (
    <div className="step-enter flex flex-col items-center text-center py-4">
      {/* Logo et headline */}
      <div className="mb-8">
        <img src="/logo-wambs.png" alt={COMPANY.name} className="h-20 w-20 object-contain mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-4 leading-tight">
          {w.headline}
        </h1>
        <p className="text-wambs-muted text-lg max-w-md mx-auto leading-relaxed">
          {w.subline}
        </p>
      </div>

      {/* CTA principal */}
      <button
        onClick={onStart}
        className="btn-gradient text-white text-lg font-semibold px-10 py-4 rounded-xl mb-8 cursor-pointer transition-transform hover:scale-105"
      >
        {w.cta}
      </button>

      {/* Trust signals */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {trustItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-wambs-panel border border-wambs-border rounded-lg px-4 py-3"
          >
            <span className="text-wambs-cyan flex-shrink-0">{trustIcons[i]}</span>
            <span className="text-wambs-text text-sm text-left">{item}</span>
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <div className="flex items-center gap-2 text-wambs-muted text-xs">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <span>{w.privacy}</span>
      </div>
    </div>
  );
}
