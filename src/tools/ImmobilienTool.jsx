/* Immobilier locatif : rendement apres impot, amortissement, deficit foncier. */
import { useMemo, useState } from 'react';
import { analyserImmobilier, TYPES_AMORTISSEMENT } from '../calculators/immobilien';
import { BUNDESLAENDER, STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, Choix, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ETAT_INITIAL = {
  prix: 300000,
  partTerrainPct: 20,
  bundesland: 'BE',
  courtier: true,
  typeAmortissement: 'habitationDepuis1925',
  loyerAnnuel: 14400,
  chargesAnnuelles: 2400,
  interetsAnnuels: 7500,
  remboursementCapital: 4500,
  autresRevenus: 70000,
  splitting: false,
  annee: ANNEE_DEFAUT,
};

export default function ImmobilienTool({ t, langue }) {
  const s = t.immobilien;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserImmobilier({
    ...etat, partTerrain: etat.partTerrainPct / 100,
  }), [etat]);

  const positif = r.fluxApresImpot >= 0;

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionBien} indice={s.sectionBienIndice}>
            <Curseur label={s.prix} valeur={etat.prix} onChange={(v) => maj('prix', v)}
              min={50000} max={2000000} pas={10000} langue={langue} />
            <Curseur label={s.partTerrain} valeur={etat.partTerrainPct}
              onChange={(v) => maj('partTerrainPct', v)} min={0} max={60} pas={5} langue={langue}
              formatteur={(v) => `${nombre(v, langue)} %`} />
            <p className="text-xs text-wambs-muted leading-relaxed">{s.partTerrainIndice}</p>
            <div>
              <span className="block text-sm text-wambs-text mb-2">{s.bundesland}</span>
              <select value={etat.bundesland} onChange={(e) => maj('bundesland', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-wambs-surface border border-wambs-border
                           text-wambs-text text-sm min-h-[44px] cursor-pointer
                           focus:outline-none focus:border-wambs-purple/60">
                {BUNDESLAENDER.map((c) => <option key={c} value={c}>{t.bn.laender[c] || c}</option>)}
              </select>
            </div>
            <Bascule label={s.courtier} valeur={etat.courtier} onChange={(v) => maj('courtier', v)}
              libelleOui={s.oui} libelleNon={s.non} />
          </Section>

          <Section titre={s.sectionAmortissement} indice={s.sectionAmortissementIndice}>
            <Choix options={TYPES_AMORTISSEMENT.map((v) => ({
              valeur: v, label: s.amortissements[v].titre, indice: s.amortissements[v].description,
            }))} valeur={etat.typeAmortissement} onChange={(v) => maj('typeAmortissement', v)} colonnes={2} />
          </Section>

          <Section titre={s.sectionExploitation}>
            <ChampNombre label={s.loyerAnnuel} indice={s.loyerAnnuelIndice} valeur={etat.loyerAnnuel}
              onChange={(v) => maj('loyerAnnuel', Math.max(0, v))} pas={600} />
            <ChampNombre label={s.chargesAnnuelles} indice={s.chargesAnnuellesIndice}
              valeur={etat.chargesAnnuelles} onChange={(v) => maj('chargesAnnuelles', Math.max(0, v))} pas={200} />
            <ChampNombre label={s.interetsAnnuels} indice={s.interetsAnnuelsIndice}
              valeur={etat.interetsAnnuels} onChange={(v) => maj('interetsAnnuels', Math.max(0, v))} pas={500} />
            <ChampNombre label={s.remboursementCapital} indice={s.remboursementCapitalIndice}
              valeur={etat.remboursementCapital} onChange={(v) => maj('remboursementCapital', Math.max(0, v))} pas={500} />
          </Section>

          <Section titre={s.sectionFiscalite} indice={s.sectionFiscaliteIndice}>
            <ChampNombre label={s.autresRevenus} valeur={etat.autresRevenus}
              onChange={(v) => maj('autresRevenus', Math.max(0, v))} pas={1000} />
            <Bascule label={s.splitting} valeur={etat.splitting} onChange={(v) => maj('splitting', v)}
              libelleOui={s.oui} libelleNon={s.non} />
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={euro(r.fluxMensuelApresImpot, langue)}
            sousTexte={interpoler(s.resultatSousTexte, {
              annuel: euro(r.fluxApresImpot, langue),
              rendement: pourcent(r.rendementApresImpot, langue),
            })}
            accent={positif ? '#06F5F5' : '#EC4899'}
          />

          <Section titre={s.detailAcquisitionTitre}>
            <LigneDetail label={s.prixAchat} valeur={euro(etat.prix, langue)} />
            <LigneDetail label={s.mutation}
              indice={interpoler(s.mutationIndice, { taux: pourcent(r.frais.tauxMutation, langue) })}
              valeur={euro(r.frais.mutation, langue)} negatif />
            <LigneDetail label={s.notaire} valeur={euro(r.frais.notaire + r.frais.registre, langue)} negatif />
            {r.frais.commission > 0 && (
              <LigneDetail label={s.commission} valeur={euro(r.frais.commission, langue)} negatif />
            )}
            <LigneDetail label={s.coutTotal} valeur={euro(r.frais.coutTotal, langue)} total />
          </Section>

          <Section titre={s.detailFiscalTitre} indice={s.detailFiscalIndice}>
            <LigneDetail label={s.loyerAnnuel} valeur={euro(etat.loyerAnnuel, langue)} />
            <LigneDetail label={s.chargesAnnuelles} valeur={euro(etat.chargesAnnuelles, langue)} negatif />
            <LigneDetail label={s.interetsAnnuels} valeur={euro(etat.interetsAnnuels, langue)} negatif />
            <LigneDetail label={s.amortissement}
              indice={interpoler(s.amortissementIndice, {
                taux: pourcent(r.tauxAmortissement, langue),
                base: euro(r.baseAmortissable, langue),
              })}
              valeur={euro(r.amortissementAnnuel, langue)} negatif />
            <LigneDetail label={s.resultatFiscal} valeur={euro(r.resultatFiscal, langue)} total
              accent={r.resultatFiscal < 0 ? '#06F5F5' : undefined} />
            <LigneDetail label={s.effetImpot}
              indice={interpoler(s.effetImpotIndice, { taux: pourcent(r.tauxMarginalApplicable, langue) })}
              valeur={euro(Math.abs(r.effetImpot), langue)}
              accent={r.effetImpot < 0 ? '#06F5F5' : '#EC4899'} />
          </Section>

          <Section titre={s.rendementsTitre}>
            <LigneDetail label={s.rendementBrut} valeur={pourcent(r.rendementBrut, langue, 2)} />
            <LigneDetail label={s.rendementNet} indice={s.rendementNetIndice}
              valeur={pourcent(r.rendementNet, langue, 2)} />
            <LigneDetail label={s.rendementApresImpot} valeur={pourcent(r.rendementApresImpot, langue, 2)}
              total accent="#FB923C" />
          </Section>

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              prix: etat.prix,
              bundesland: etat.bundesland,
              fluxMensuel: Math.round(r.fluxMensuelApresImpot),
              rendementApresImpot: Math.round(r.rendementApresImpot * 10000) / 100,
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(t.bn.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
