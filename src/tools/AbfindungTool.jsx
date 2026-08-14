/* Indemnite de depart et regle du cinquieme (§ 34 EStG). */
import { useMemo, useState } from 'react';
import { analyserAbfindung } from '../calculators/abfindung';
import { STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, interpoler } from '../lib/format';
import {
  Section, Curseur, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ETAT_INITIAL = {
  indemnite: 60000,
  revenuRestant: 45000,
  versementAnneeSuivante: false,
  revenuAnneeSuivante: 12000,
  splitting: false,
  annee: ANNEE_DEFAUT,
};

export default function AbfindungTool({ t, langue }) {
  const s = t.abfindung;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserAbfindung(etat), [etat]);

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionIndemnite}>
            <Curseur label={s.indemnite} valeur={etat.indemnite} onChange={(v) => maj('indemnite', v)}
              min={0} max={500000} pas={5000} langue={langue} />
            <ChampNombre label={s.revenuRestant} indice={s.revenuRestantIndice}
              valeur={etat.revenuRestant} onChange={(v) => maj('revenuRestant', Math.max(0, v))} pas={1000} />
            <Bascule label={s.splitting} valeur={etat.splitting} onChange={(v) => maj('splitting', v)}
              libelleOui={s.oui} libelleNon={s.non} />
          </Section>

          <Section titre={s.sectionTiming} indice={s.sectionTimingIndice}>
            <Bascule label={s.versementAnneeSuivante} indice={s.versementAnneeSuivanteIndice}
              valeur={etat.versementAnneeSuivante} onChange={(v) => maj('versementAnneeSuivante', v)}
              libelleOui={s.oui} libelleNon={s.non} />
            <ChampNombre label={s.revenuAnneeSuivante} indice={s.revenuAnneeSuivanteIndice}
              valeur={etat.revenuAnneeSuivante}
              onChange={(v) => maj('revenuAnneeSuivante', Math.max(0, v))} pas={1000} />
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={euro(r.netIndemnite, langue)}
            sousTexte={interpoler(s.resultatSousTexte, {
              charge: euro(r.chargeTotale, langue),
              taux: pourcent(r.tauxEffectif, langue),
            })}
            accent="#06F5F5"
          />

          <div className="grid grid-cols-2 gap-3">
            {[
              { cle: 'ordinaire', montant: r.chargeOrdinaire, couleur: '#EC4899', actif: r.economie <= 0 },
              { cle: 'cinquieme', montant: r.chargeCinquieme, couleur: '#06F5F5', actif: r.economie > 0 },
            ].map(({ cle, montant, couleur, actif }) => (
              <div key={cle} className={`bg-wambs-panel border rounded-lg p-3 sm:p-4 ${
                actif ? 'selected-card' : 'border-wambs-border'
              }`}>
                <p className="text-xs font-semibold mb-2" style={{ color: couleur }}>{s.methodes[cle]}</p>
                <p className="font-data text-base font-semibold" style={{ color: couleur }}>
                  {euro(montant, langue)}
                </p>
                <p className="text-[11px] text-wambs-muted mt-1 leading-relaxed">{s.methodesIndice[cle]}</p>
              </div>
            ))}
          </div>

          <Section titre={s.detailTitre}>
            <LigneDetail label={s.indemniteBrute} valeur={euro(r.indemnite, langue)} />
            <LigneDetail label={s.revenuBase} indice={s.revenuBaseIndice} valeur={euro(r.base, langue)} />
            <LigneDetail label={s.impotSansRegle} valeur={euro(r.chargeOrdinaire, langue)} negatif />
            <LigneDetail label={s.impotAvecRegle} valeur={euro(r.chargeCinquieme, langue)}
              accent={r.economie > 0 ? '#06F5F5' : undefined} />
            <LigneDetail label={s.economie} indice={s.economieIndice}
              valeur={euro(r.economie, langue)} accent="#06F5F5" />
            {r.soliRetenu > 0 && <LigneDetail label={s.soli} valeur={euro(r.soliRetenu, langue)} negatif />}
            <LigneDetail label={s.netVerse} valeur={euro(r.netIndemnite, langue)} total accent="#06F5F5" />
          </Section>

          {!etat.versementAnneeSuivante && r.gainDecalage > 0 && (
            <Section titre={s.decalageTitre} indice={s.decalageIndice}>
              <LigneDetail label={s.decalageActuel} valeur={euro(r.chargeRetenue, langue)} />
              <LigneDetail label={s.decalageReporte} valeur={euro(r.chargeDecalee, langue)} accent="#06F5F5" />
              <LigneDetail label={s.decalageGain} valeur={euro(r.gainDecalage, langue)} total accent="#06F5F5" />
            </Section>
          )}

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              indemnite: r.indemnite,
              netApresImpot: Math.round(r.netIndemnite),
              economieCinquieme: Math.round(r.economie),
              gainDecalage: Math.round(r.gainDecalage),
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(t.bn.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
