/* Deficit de retraite et comparaison Rurup / Riester apres impot. */
import { useMemo, useState } from 'react';
import { analyserAltersvorsorge } from '../calculators/altersvorsorge';
import { STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ETAT_INITIAL = {
  brutAnnuel: 60000,
  age: 40,
  ageRetraite: 67,
  enfants: 0,
  epargneAnnuelle: 3600,
  besoinPartPct: 80,
  rendementPct: 3,
  splitting: false,
  annee: ANNEE_DEFAUT,
};

export default function AltersvorsorgeTool({ t, langue }) {
  const s = t.altersvorsorge;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserAltersvorsorge({
    ...etat,
    besoinPart: etat.besoinPartPct / 100,
    rendement: etat.rendementPct / 100,
  }), [etat]);

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionSituation}>
            <Curseur label={s.brutAnnuel} valeur={etat.brutAnnuel} onChange={(v) => maj('brutAnnuel', v)}
              min={15000} max={200000} pas={1000} langue={langue} />
            <Curseur label={s.age} valeur={etat.age} onChange={(v) => maj('age', v)}
              min={18} max={66} pas={1} langue={langue} formatteur={(v) => `${nombre(v, langue)}`} />
            <Curseur label={s.ageRetraite} valeur={etat.ageRetraite} onChange={(v) => maj('ageRetraite', v)}
              min={Math.min(67, etat.age + 1)} max={72} pas={1} langue={langue}
              formatteur={(v) => `${nombre(v, langue)}`} />
            <ChampNombre label={s.enfants} indice={s.enfantsIndice} valeur={etat.enfants}
              onChange={(v) => maj('enfants', Math.max(0, Math.round(v)))} unite="" pas={1} />
            <Bascule label={s.splitting} valeur={etat.splitting} onChange={(v) => maj('splitting', v)}
              libelleOui={s.oui} libelleNon={s.non} />
          </Section>

          <Section titre={s.sectionBesoin} indice={s.sectionBesoinIndice}>
            <Curseur label={s.besoinPart} valeur={etat.besoinPartPct}
              onChange={(v) => maj('besoinPartPct', v)} min={40} max={100} pas={5} langue={langue}
              formatteur={(v) => `${nombre(v, langue)} %`} />
          </Section>

          <Section titre={s.sectionEpargne} indice={s.sectionEpargneIndice}>
            <Curseur label={s.epargneAnnuelle} valeur={etat.epargneAnnuelle}
              onChange={(v) => maj('epargneAnnuelle', v)} min={0} max={35000} pas={600} langue={langue} />
            <ChampNombre label={s.rendement} indice={s.rendementIndice} valeur={etat.rendementPct}
              onChange={(v) => maj('rendementPct', Math.max(0, Math.min(10, v)))} unite="%" pas={0.5} />
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={euro(r.deficitMensuel, langue)}
            sousTexte={interpoler(s.resultatSousTexte, {
              rente: euro(r.renteNetteMensuelle, langue),
              ans: nombre(r.anneesRestantes, langue),
            })}
            accent={r.deficitMensuel > 0 ? '#EC4899' : '#06F5F5'}
          />

          <Section titre={s.renteTitre} indice={s.renteIndice}>
            <LigneDetail label={s.renteBrute} valeur={euro(r.renteBruteMensuelle, langue)} />
            <LigneDetail label={s.partImposable}
              indice={interpoler(s.partImposableIndice, { annee: nombre(r.anneeDepart, langue) })}
              valeur={pourcent(r.partImposable, langue, 1)} />
            <LigneDetail label={s.impotSurRente} valeur={euro(r.impotSurRente / 12, langue)} negatif />
            <LigneDetail label={s.renteNette} valeur={euro(r.renteNetteMensuelle, langue)} total accent="#A855F7" />
            <div className="mt-2 pt-2 border-t border-wambs-border">
              <LigneDetail label={s.besoin} valeur={euro(r.besoinAnnuel / 12, langue)} />
              <LigneDetail label={s.deficit} valeur={euro(r.deficitMensuel, langue)} total accent="#EC4899" />
            </div>
          </Section>

          <div className="grid grid-cols-2 gap-3">
            {[
              { cle: 'ruerup', d: r.ruerup, couleur: '#06F5F5', avantage: r.ruerup.economie },
              { cle: 'riester', d: r.riester, couleur: '#FB923C', avantage: r.riester.avantage },
            ].map(({ cle, d, couleur, avantage }) => (
              <div key={cle} className="bg-wambs-panel border border-wambs-border rounded-lg p-3 sm:p-4">
                <p className="text-xs font-semibold mb-2" style={{ color: couleur }}>{s.enveloppes[cle].titre}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between gap-1">
                    <span className="text-wambs-muted">{s.versement}</span>
                    <span className="font-data text-wambs-text">{euro(d.versement, langue)}</span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-wambs-muted">{s.avantage}</span>
                    <span className="font-data text-wambs-text">{euro(avantage, langue)}</span>
                  </div>
                  <div className="flex justify-between gap-1 pt-1.5 mt-1.5 border-t border-wambs-border">
                    <span className="text-wambs-text font-medium">{s.effortNet}</span>
                    <span className="font-data font-semibold" style={{ color: couleur }}>
                      {euro(d.effortNet, langue)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-wambs-muted">{s.capital}</span>
                    <span className="font-data text-wambs-muted">{euro(d.capital, langue)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-wambs-muted mt-2 leading-relaxed">
                  {s.enveloppes[cle].description}
                </p>
              </div>
            ))}
          </div>

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              brutAnnuel: etat.brutAnnuel,
              age: etat.age,
              deficitMensuel: Math.round(r.deficitMensuel),
              epargneAnnuelle: etat.epargneAnnuelle,
              economieRuerup: Math.round(r.ruerup.economie),
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(t.bn.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
