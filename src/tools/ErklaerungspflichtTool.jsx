/* Suis-je oblige de declarer, et pour quand ? (§ 46 EStG et § 149 AO) */
import { useMemo, useState } from 'react';
import { analyserErklaerungspflicht, MOTIFS, MOTIFS_VOLONTAIRES } from '../calculators/erklaerungspflicht';
import { STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, nombre, locale, interpoler } from '../lib/format';
import {
  Section, Choix, Bascule, CaseAcocher, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ANNEES_FISCALES = [ANNEE_DEFAUT - 1, ANNEE_DEFAUT - 2, ANNEE_DEFAUT - 3];

const ETAT_INITIAL = {
  anneeFiscale: ANNEE_DEFAUT - 1,
  motifs: ['classeVouFacteur'],
  volontaires: ['fraisEleves'],
  revenusAnnexesMontant: 1000,
  avecConseil: false,
};

export default function ErklaerungspflichtTool({ t, langue }) {
  const s = t.erklaerungspflicht;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const basculer = (liste, cle) => setEtat((prev) => ({
    ...prev,
    [liste]: prev[liste].includes(cle)
      ? prev[liste].filter((x) => x !== cle)
      : [...prev[liste], cle],
  }));

  const r = useMemo(() => analyserErklaerungspflicht(etat), [etat]);

  const formaterDate = (date) => new Intl.DateTimeFormat(locale(langue), {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionAnnee}>
            <Choix options={ANNEES_FISCALES.map((a) => ({ valeur: a, label: String(a) }))}
              valeur={etat.anneeFiscale} onChange={(v) => maj('anneeFiscale', v)} colonnes={3} />
            <Bascule label={s.avecConseil} indice={s.avecConseilIndice} valeur={etat.avecConseil}
              onChange={(v) => maj('avecConseil', v)} libelleOui={s.oui} libelleNon={s.non} />
          </Section>

          <Section titre={s.sectionMotifs} indice={s.sectionMotifsIndice}>
            <div className="space-y-2">
              {MOTIFS.map((cle) => (
                <CaseAcocher key={cle} label={s.motifs[cle].titre} indice={s.motifs[cle].description}
                  coche={etat.motifs.includes(cle)} onChange={() => basculer('motifs', cle)} />
              ))}
            </div>
            {etat.motifs.includes('revenusAnnexes') && (
              <ChampNombre label={s.revenusAnnexesMontant}
                indice={interpoler(s.revenusAnnexesIndice, {
                  seuil: euro(r.seuilRevenusAnnexes, langue),
                })}
                valeur={etat.revenusAnnexesMontant}
                onChange={(v) => maj('revenusAnnexesMontant', Math.max(0, v))} pas={100} />
            )}
          </Section>

          <Section titre={s.sectionVolontaires} indice={s.sectionVolontairesIndice}>
            <div className="space-y-2">
              {MOTIFS_VOLONTAIRES.map((cle) => (
                <CaseAcocher key={cle} label={s.volontaires[cle].titre}
                  indice={s.volontaires[cle].description}
                  coche={etat.volontaires.includes(cle)} onChange={() => basculer('volontaires', cle)} />
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={r.obligatoire ? s.resultatObligatoire : s.resultatFacultatif}
            montant={formaterDate(r.echeance)}
            sousTexte={r.obligatoire
              ? interpoler(s.resultatSousTexte, { annee: nombre(r.anneeFiscale, langue) })
              : interpoler(s.resultatSousTexteFacultatif, {
                date: formaterDate(r.echeanceVolontaire),
              })}
            accent={r.obligatoire ? '#EC4899' : '#06F5F5'}
          />

          <Section titre={s.delaisTitre} indice={s.delaisIndice}>
            <LigneDetail label={s.delaiSansConseil} valeur={formaterDate(r.echeanceSansConseil)}
              accent={!etat.avecConseil ? '#FB923C' : undefined} />
            <LigneDetail label={s.delaiAvecConseil}
              indice={interpoler(s.delaiAvecConseilIndice, { jours: nombre(r.joursSupplementaires, langue) })}
              valeur={formaterDate(r.echeanceAvecConseil)}
              accent={etat.avecConseil ? '#06F5F5' : undefined} />
            {!r.obligatoire && (
              <LigneDetail label={s.delaiVolontaire} indice={s.delaiVolontaireIndice}
                valeur={formaterDate(r.echeanceVolontaire)} />
            )}
          </Section>

          {r.motifsRetenus.length > 0 && (
            <Section titre={s.motifsRetenusTitre}>
              <ul className="space-y-2">
                {r.motifsRetenus.map((cle) => (
                  <li key={cle} className="flex items-start gap-2.5">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-wambs-magenta flex-shrink-0" />
                    <span className="text-sm text-wambs-text leading-relaxed">{s.motifs[cle].titre}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              anneeFiscale: r.anneeFiscale,
              obligatoire: r.obligatoire,
              motifs: r.motifsRetenus,
              echeance: r.echeance.toISOString().slice(0, 10),
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(s.stand, { date: STAND })} />
    </div>
  );
}
