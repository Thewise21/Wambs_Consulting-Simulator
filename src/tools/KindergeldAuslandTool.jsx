/* Allocations familiales et abattement pour enfants vivant a l'etranger. */
import { useMemo, useState } from 'react';
import { analyserKindergeldAusland, REGIMES } from '../calculators/kindergeldAusland';
import { LAENDERGRUPPEN, STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Choix, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ETAT_INITIAL = {
  enfants: 2,
  regime: 'drittstaat',
  laendergruppe: 4,
  activiteCotisante: true,
  prestationsEtranger: 0,
  revenuImposable: 45000,
  splitting: false,
  annee: ANNEE_DEFAUT,
};

export default function KindergeldAuslandTool({ t, langue }) {
  const s = t.kindergeldAusland;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserKindergeldAusland(etat), [etat]);

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionResidence} indice={s.sectionResidenceIndice}>
            <Choix options={REGIMES.map((v) => ({
              valeur: v, label: s.regimes[v].titre, indice: s.regimes[v].description,
            }))} valeur={etat.regime} onChange={(v) => maj('regime', v)} colonnes={3} />
            {etat.regime === 'abkommen' && (
              <Bascule label={s.activiteCotisante} indice={s.activiteCotisanteIndice}
                valeur={etat.activiteCotisante} onChange={(v) => maj('activiteCotisante', v)}
                libelleOui={s.oui} libelleNon={s.non} />
            )}
            {etat.regime === 'ue' && (
              <ChampNombre label={s.prestationsEtranger} indice={s.prestationsEtrangerIndice}
                valeur={etat.prestationsEtranger}
                onChange={(v) => maj('prestationsEtranger', Math.max(0, v))} pas={100} />
            )}
          </Section>

          <Section titre={s.sectionGroupe} indice={s.sectionGroupeIndice}>
            <Choix options={Object.keys(LAENDERGRUPPEN).map((g) => ({
              valeur: Number(g), label: s.groupes[g].titre, indice: s.groupes[g].description,
            }))} valeur={etat.laendergruppe} onChange={(v) => maj('laendergruppe', v)} colonnes={2} />
          </Section>

          <Section titre={s.sectionFamille}>
            <ChampNombre label={s.enfants} valeur={etat.enfants}
              onChange={(v) => maj('enfants', Math.max(0, Math.round(v)))} unite="" pas={1} />
            <ChampNombre label={s.revenuImposable} indice={s.revenuImposableIndice}
              valeur={etat.revenuImposable}
              onChange={(v) => maj('revenuImposable', Math.max(0, v))} pas={1000} />
            <Bascule label={s.splitting} valeur={etat.splitting}
              onChange={(v) => maj('splitting', v)} libelleOui={s.oui} libelleNon={s.non} />
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={euro(r.avantageRetenu, langue)}
            sousTexte={r.droitAllocations
              ? interpoler(s.resultatSousTexte, { mensuel: euro(r.allocationMensuelle, langue) })
              : s.resultatSansAllocation}
            accent={r.droitAllocations ? '#06F5F5' : '#FB923C'}
          />

          <div className="grid grid-cols-2 gap-3">
            {[
              { cle: 'allocations', montant: r.allocationVersee, couleur: '#06F5F5',
                actif: r.droitAllocations && !r.abattementPlusFavorable },
              { cle: 'abattement', montant: r.economieAbattement, couleur: '#A855F7',
                actif: r.abattementPlusFavorable },
            ].map(({ cle, montant, couleur, actif }) => (
              <div key={cle} className={`bg-wambs-panel border rounded-lg p-3 sm:p-4 ${
                actif ? 'selected-card' : 'border-wambs-border'
              }`}>
                <p className="text-xs font-semibold mb-2" style={{ color: couleur }}>{s.voies[cle].titre}</p>
                <p className="font-data text-base font-semibold" style={{ color: couleur }}>
                  {euro(montant, langue)}
                </p>
                <p className="text-[13px] text-wambs-muted mt-1 leading-relaxed">{s.voies[cle].description}</p>
              </div>
            ))}
          </div>

          <Section titre={s.detailTitre} indice={s.detailIndice}>
            <LigneDetail label={s.allocationPleine}
              indice={interpoler(s.allocationPleineIndice, { enfants: nombre(r.enfants, langue) })}
              valeur={euro(r.allocationPleine, langue)} />
            <LigneDetail label={s.allocationVersee} valeur={euro(r.allocationVersee, langue)}
              accent={r.droitAllocations ? '#06F5F5' : '#EC4899'} />
            <div className="mt-2 pt-2 border-t border-wambs-border">
              <LigneDetail label={s.abattementPlein} valeur={euro(r.abattementPlein, langue)} />
              <LigneDetail label={s.abattementReduit}
                indice={interpoler(s.abattementReduitIndice, {
                  groupe: nombre(r.groupe, langue), part: pourcent(r.fraction, langue, 0),
                })}
                valeur={euro(r.abattementReduit, langue)} />
              <LigneDetail label={s.economieAbattement} valeur={euro(r.economieAbattement, langue)} accent="#A855F7" />
            </div>
            <LigneDetail label={s.avantageRetenu} indice={s.avantageRetenuIndice}
              valeur={euro(r.avantageRetenu, langue)} total accent="#06F5F5" />
            {r.ecartAvecAllemagne > 0 && (
              <LigneDetail label={s.ecartAllemagne} indice={s.ecartAllemagneIndice}
                valeur={euro(r.ecartAvecAllemagne, langue)} accent="#EC4899" />
            )}
          </Section>

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              enfants: r.enfants,
              regime: r.regime,
              groupePays: r.groupe,
              droitAllocations: r.droitAllocations,
              avantageAnnuel: Math.round(r.avantageRetenu),
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(t.bn.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
