/* Retour au pays : rembourser ses cotisations ou conserver ses droits (§ 210 SGB VI). */
import { useMemo, useState } from 'react';
import { analyserRentenerstattung } from '../calculators/rentenerstattung';
import { RENTE, STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ETAT_INITIAL = {
  moisCotises: 120,
  salaireMoyenAnnuel: 45000,
  age: 40,
  moisDepuisDepart: 24,
  ressortissantUE: false,
  annee: ANNEE_DEFAUT,
};

export default function RentenerstattungTool({ t, langue }) {
  const s = t.rentenerstattung;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserRentenerstattung(etat), [etat]);
  const conserver = r.recommandation === 'conserver';

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionCarriere} indice={s.sectionCarriereIndice}>
            <Curseur label={s.moisCotises} valeur={etat.moisCotises}
              onChange={(v) => maj('moisCotises', v)} min={0} max={480} pas={6} langue={langue}
              formatteur={(v) => interpoler(s.moisFormat, {
                mois: nombre(v, langue), ans: nombre(v / 12, langue, 1),
              })} />
            <Curseur label={s.salaireMoyenAnnuel} valeur={etat.salaireMoyenAnnuel}
              onChange={(v) => maj('salaireMoyenAnnuel', v)} min={0} max={120000} pas={1000} langue={langue} />
            <p className="text-xs text-wambs-muted leading-relaxed">{s.salaireMoyenIndice}</p>
          </Section>

          <Section titre={s.sectionSituation}>
            <Curseur label={s.age} valeur={etat.age} onChange={(v) => maj('age', v)}
              min={18} max={66} pas={1} langue={langue} formatteur={(v) => nombre(v, langue)} />
            <ChampNombre label={s.moisDepuisDepart} indice={s.moisDepuisDepartIndice}
              valeur={etat.moisDepuisDepart}
              onChange={(v) => maj('moisDepuisDepart', Math.max(0, Math.round(v)))} unite="" pas={1} />
            <Bascule label={s.ressortissantUE} indice={s.ressortissantUEIndice}
              valeur={etat.ressortissantUE} onChange={(v) => maj('ressortissantUE', v)}
              libelleOui={s.oui} libelleNon={s.non} />
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={s.recommandations[r.recommandation]}
            sousTexte={conserver
              ? interpoler(s.resultatConserver, {
                pension: euro(r.pensionMensuelle, langue),
                remboursement: euro(r.remboursement, langue),
              })
              : interpoler(s.resultatRembourser, { remboursement: euro(r.remboursement, langue) })}
            accent={conserver ? '#06F5F5' : '#FB923C'}
          />

          <div className="grid grid-cols-2 gap-3">
            {[
              { cle: 'conserver', principal: euro(r.pensionMensuelle, langue),
                secondaire: interpoler(s.parMois, {}), couleur: '#06F5F5', actif: conserver },
              { cle: 'rembourser', principal: euro(r.remboursement, langue),
                secondaire: s.uneFois, couleur: '#FB923C', actif: !conserver },
            ].map(({ cle, principal, secondaire, couleur, actif }) => (
              <div key={cle} className={`bg-wambs-panel border rounded-lg p-3 sm:p-4 ${
                actif ? 'selected-card' : 'border-wambs-border'
              }`}>
                <p className="text-xs font-semibold mb-2" style={{ color: couleur }}>{s.voies[cle].titre}</p>
                <p className="font-data text-base font-semibold" style={{ color: couleur }}>{principal}</p>
                <p className="text-[13px] text-wambs-muted">{secondaire}</p>
                <p className="text-[13px] text-wambs-muted mt-1.5 leading-relaxed">{s.voies[cle].description}</p>
              </div>
            ))}
          </div>

          <Section titre={s.detailTitre}>
            <LigneDetail label={s.periodeCotisee}
              valeur={interpoler(s.moisFormat, {
                mois: nombre(r.moisCotises, langue), ans: nombre(r.anneesCotisees, langue, 1),
              })} />
            <LigneDetail label={s.wartezeit} indice={s.wartezeitIndice}
              valeur={r.wartezeitAtteinte ? s.oui : s.non}
              accent={r.wartezeitAtteinte ? '#06F5F5' : '#EC4899'} />
            <LigneDetail label={s.points} indice={s.pointsIndice}
              valeur={nombre(r.points, langue, 2)} />
            <LigneDetail label={s.pensionMensuelle}
              indice={interpoler(s.pensionIndice, { valeur: euro(RENTE[etat.annee]?.rentenwert ?? 0, langue, 2) })}
              valeur={euro(r.pensionMensuelle, langue)} accent="#06F5F5" />
            <div className="mt-2 pt-2 border-t border-wambs-border">
              <LigneDetail label={s.cotisationsTotales} valeur={euro(r.cotisationsTotales, langue)} />
              <LigneDetail label={s.remboursement} indice={s.remboursementIndice}
                valeur={euro(r.remboursement, langue)} accent="#FB923C" />
              <LigneDetail label={s.partPerdue} indice={s.partPerdueIndice}
                valeur={euro(r.partPerdue, langue)} negatif />
            </div>
            {r.anneesPourEgaler !== null && (
              <div className="mt-2 pt-2 border-t border-wambs-border">
                <LigneDetail label={s.pointEquilibre} indice={s.pointEquilibreIndice}
                  valeur={interpoler(s.ansFormat, { ans: nombre(r.anneesPourEgaler, langue, 1) })} />
                <LigneDetail
                  label={interpoler(s.pensionCumulee, { ans: nombre(r.anneesPerceptionReference, langue) })}
                  indice={s.pensionCumuleeIndice}
                  valeur={euro(r.pensionCumulee, langue)} total
                  accent={r.avantagePension > 0 ? '#06F5F5' : '#FB923C'} />
              </div>
            )}
          </Section>

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              moisCotises: r.moisCotises,
              pensionMensuelle: Math.round(r.pensionMensuelle),
              remboursement: Math.round(r.remboursement),
              recommandation: r.recommandation,
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(s.stand, { date: STAND })} />
    </div>
  );
}
