/* Photovoltaique : exoneration § 3 Nr. 72 EStG et taux zero de TVA. */
import { useMemo, useState } from 'react';
import { analyserPhotovoltaique } from '../calculators/photovoltaik';
import { PHOTOVOLTAIQUE, STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ETAT_INITIAL = {
  puissanceKwp: 12,
  unites: 1,
  autresInstallationsKwp: 0,
  investissement: 18000,
  productionParKwp: PHOTOVOLTAIQUE.productionParKwpDefaut,
  partAutoconsommationPct: 30,
  tarifInjection: 0.08,
  prixElectricite: 0.35,
  tauxMarginalPct: 30,
  annee: ANNEE_DEFAUT,
};

export default function PhotovoltaikTool({ t, langue }) {
  const s = t.photovoltaik;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserPhotovoltaique({
    ...etat,
    partAutoconsommation: etat.partAutoconsommationPct / 100,
    tauxMarginal: etat.tauxMarginalPct / 100,
  }), [etat]);

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionInstallation} indice={s.sectionInstallationIndice}>
            <Curseur label={s.puissance} valeur={etat.puissanceKwp}
              onChange={(v) => maj('puissanceKwp', v)} min={1} max={120} pas={1} langue={langue}
              formatteur={(v) => `${nombre(v, langue)} kWp`} />
            <ChampNombre label={s.unites} indice={s.unitesIndice} valeur={etat.unites}
              onChange={(v) => maj('unites', Math.max(1, Math.round(v)))} unite="" pas={1} />
            <ChampNombre label={s.autresInstallations} indice={s.autresInstallationsIndice}
              valeur={etat.autresInstallationsKwp}
              onChange={(v) => maj('autresInstallationsKwp', Math.max(0, v))} unite="kWp" pas={1} />
            <ChampNombre label={s.investissement} indice={s.investissementIndice}
              valeur={etat.investissement} onChange={(v) => maj('investissement', Math.max(0, v))} pas={1000} />
          </Section>

          <Section titre={s.sectionRendement} indice={s.sectionRendementIndice}>
            <ChampNombre label={s.productionParKwp} valeur={etat.productionParKwp}
              onChange={(v) => maj('productionParKwp', Math.max(0, v))} unite="kWh" pas={50} />
            <Curseur label={s.partAutoconsommation} valeur={etat.partAutoconsommationPct}
              onChange={(v) => maj('partAutoconsommationPct', v)} min={0} max={100} pas={5} langue={langue}
              formatteur={(v) => `${nombre(v, langue)} %`} />
            <ChampNombre label={s.tarifInjection} indice={s.tarifInjectionIndice}
              valeur={etat.tarifInjection} onChange={(v) => maj('tarifInjection', Math.max(0, v))}
              unite="€" pas={0.01} />
            <ChampNombre label={s.prixElectricite} valeur={etat.prixElectricite}
              onChange={(v) => maj('prixElectricite', Math.max(0, v))} unite="€" pas={0.01} />
            <ChampNombre label={s.tauxMarginal} indice={s.tauxMarginalIndice}
              valeur={etat.tauxMarginalPct} onChange={(v) => maj('tauxMarginalPct', Math.max(0, Math.min(45, v)))}
              unite="%" pas={1} />
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={r.exonere ? s.resultatEtiquette : s.resultatImposable}
            montant={euro(r.beneficeApresImpot, langue)}
            sousTexte={r.amortissementAnnees
              ? interpoler(s.resultatSousTexte, { ans: nombre(r.amortissementAnnees, langue, 1) })
              : s.resultatSansAmortissement}
            accent={r.exonere ? '#06F5F5' : '#FB923C'}
          />

          <Section titre={s.detailTitre}>
            <LigneDetail label={s.production}
              indice={interpoler(s.productionIndice, { puissance: nombre(r.puissance, langue) })}
              valeur={`${nombre(r.production, langue)} kWh`} />
            <LigneDetail label={s.injection}
              indice={interpoler(s.injectionIndice, { kwh: nombre(r.kwhInjectes, langue) })}
              valeur={euro(r.recettesInjection, langue)} />
            <LigneDetail label={s.autoconsommation}
              indice={interpoler(s.autoconsommationIndice, { kwh: nombre(r.kwhAutoconsommes, langue) })}
              valeur={euro(r.economieElectricite, langue)} />
            <LigneDetail label={s.beneficeAnnuel} valeur={euro(r.beneficeAnnuel, langue)} total />
            {r.impotSiImposable > 0 && (
              <LigneDetail label={s.impot}
                indice={interpoler(s.impotIndice, { taux: pourcent(etat.tauxMarginalPct / 100, langue) })}
                valeur={euro(r.impotSiImposable, langue)} negatif />
            )}
          </Section>

          <Section titre={s.limitesTitre} indice={s.limitesIndice}>
            <LigneDetail label={s.limiteObjet}
              indice={interpoler(s.limiteObjetIndice, { unites: nombre(etat.unites, langue) })}
              valeur={`${nombre(r.plafondObjet, langue)} kWp`}
              accent={r.respecteObjet ? '#06F5F5' : '#EC4899'} />
            <LigneDetail label={s.limiteContribuable}
              valeur={`${nombre(r.totalContribuable, langue)} / ${nombre(PHOTOVOLTAIQUE.limiteParContribuableKwp, langue)} kWp`}
              accent={r.respecteContribuable ? '#06F5F5' : '#EC4899'} />
          </Section>

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              puissanceKwp: r.puissance,
              exonere: r.exonere,
              investissement: etat.investissement,
              beneficeAnnuel: Math.round(r.beneficeAnnuel),
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(t.bn.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
