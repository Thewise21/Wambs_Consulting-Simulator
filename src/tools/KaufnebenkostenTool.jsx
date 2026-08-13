/* Frais annexes d'acquisition : ce que la banque ne prete jamais. */
import { useMemo, useState } from 'react';
import { analyserKaufnebenkosten } from '../calculators/immobilien';
import { BUNDESLAENDER, GRUNDERWERBSTEUER, STAND } from '../calculators/parameter';
import { euro, pourcent, interpoler } from '../lib/format';
import {
  Section, Curseur, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ETAT_INITIAL = { prix: 400000, bundesland: 'BE', courtier: true, apport: 60000 };

export default function KaufnebenkostenTool({ t, langue }) {
  const s = t.kaufnebenkosten;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserKaufnebenkosten(etat), [etat]);

  /* Classement des Lands, pour montrer ou se situe le sien */
  const classement = useMemo(() => Object.entries(GRUNDERWERBSTEUER)
    .sort((a, b) => a[1] - b[1]), []);

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionAchat}>
            <Curseur label={s.prix} valeur={etat.prix} onChange={(v) => maj('prix', v)}
              min={50000} max={2000000} pas={10000} langue={langue} />
            <div>
              <span className="block text-sm text-wambs-text mb-2">{s.bundesland}</span>
              <select value={etat.bundesland} onChange={(e) => maj('bundesland', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-wambs-surface border border-wambs-border
                           text-wambs-text text-sm min-h-[44px] cursor-pointer
                           focus:outline-none focus:border-wambs-purple/60">
                {BUNDESLAENDER.map((c) => (
                  <option key={c} value={c}>
                    {t.bn.laender[c] || c} — {(GRUNDERWERBSTEUER[c] * 100).toFixed(1).replace('.', ',')} %
                  </option>
                ))}
              </select>
            </div>
            <Bascule label={s.courtier} indice={s.courtierIndice} valeur={etat.courtier}
              onChange={(v) => maj('courtier', v)} libelleOui={s.oui} libelleNon={s.non} />
            <ChampNombre label={s.apport} indice={s.apportIndice} valeur={etat.apport}
              onChange={(v) => maj('apport', Math.max(0, v))} pas={5000} />
          </Section>

          <Section titre={s.classementTitre} indice={s.classementIndice}>
            <div className="space-y-1">
              {classement.map(([code, taux]) => (
                <div key={code} className={`flex items-center justify-between text-xs py-1 px-2 rounded ${
                  code === etat.bundesland ? 'selected-card' : ''
                }`}>
                  <span className="text-wambs-text truncate">{t.bn.laender[code] || code}</span>
                  <span className="font-data text-wambs-muted flex-shrink-0">{pourcent(taux, langue, 1)}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={euro(r.frais.total, langue)}
            sousTexte={interpoler(s.resultatSousTexte, {
              part: pourcent(r.frais.part, langue),
              total: euro(r.frais.coutTotal, langue),
            })}
            accent="#EC4899"
          />

          <Section titre={s.detailTitre}>
            <LigneDetail label={s.prixAchat} valeur={euro(r.prix, langue)} />
            <LigneDetail label={s.mutation}
              indice={interpoler(s.mutationIndice, { taux: pourcent(r.frais.tauxMutation, langue) })}
              valeur={euro(r.frais.mutation, langue)} negatif />
            <LigneDetail label={s.notaire} indice={s.notaireIndice}
              valeur={euro(r.frais.notaire, langue)} negatif />
            <LigneDetail label={s.registre} valeur={euro(r.frais.registre, langue)} negatif />
            {r.frais.commission > 0 && (
              <LigneDetail label={s.commission} indice={s.commissionIndice}
                valeur={euro(r.frais.commission, langue)} negatif />
            )}
            <LigneDetail label={s.fraisTotal} valeur={euro(r.frais.total, langue)} total accent="#EC4899" />
            <div className="mt-2 pt-2 border-t border-wambs-border">
              <LigneDetail label={s.coutTotal} valeur={euro(r.frais.coutTotal, langue)} />
              <LigneDetail label={s.apport} valeur={euro(r.apport, langue)} />
              <LigneDetail label={s.emprunt} indice={interpoler(s.empruntIndice, {
                part: pourcent(r.partFinancee, langue),
              })} valeur={euro(r.empruntNecessaire, langue)} total />
            </div>
          </Section>

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              prix: r.prix,
              bundesland: etat.bundesland,
              fraisAnnexes: Math.round(r.frais.total),
              apportSuffisant: r.apportSuffisant,
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(s.stand, { date: STAND })} />
    </div>
  );
}
