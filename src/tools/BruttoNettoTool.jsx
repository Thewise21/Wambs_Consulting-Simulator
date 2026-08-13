/* ============================================================================
 * Simulateur brut / net — calcul en direct, sans etapes.
 * C'est le point d'entree le plus recherche : l'utilisateur doit voir un
 * resultat des la premiere seconde, puis affiner.
 * ========================================================================== */
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { calculerBruttoNetto, comparerClassesCouple, STEUERKLASSEN } from '../calculators/bruttoNetto';
import { BUNDESLAENDER, SV, STAND, ANNEE_DEFAUT, ANNEES_DISPONIBLES } from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, Choix, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement, Alerte,
} from '../components/shared/UI';

const ETAT_INITIAL = {
  bruttoMensuel: 4000,
  periode: 'mois',
  klasse: 'I',
  bundesland: 'BE',
  kirchenmitglied: false,
  kinderfreibetraege: 0,
  enfantsMoins25: 0,
  sansEnfant: true,
  kvType: 'gesetzlich',
  zusatzbeitragPct: 2.9,
  primeMensuellePrivee: 650,
  rvPflichtig: true,
  annee: ANNEE_DEFAUT,
  bruttoConjointMensuel: 2000,
};

export default function BruttoNettoTool({ t, langue }) {
  const s = t.bn;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const [comparaisonOuverte, setComparaisonOuverte] = useState(false);

  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const bruttoAnnuel = etat.periode === 'mois' ? etat.bruttoMensuel * 12 : etat.bruttoMensuel;

  const entree = useMemo(() => ({
    bruttoAnnuel,
    klasse: etat.klasse,
    bundesland: etat.bundesland,
    kirchenmitglied: etat.kirchenmitglied,
    kinderfreibetraege: etat.kinderfreibetraege,
    enfantsMoins25: etat.enfantsMoins25,
    sansEnfant: etat.enfantsMoins25 === 0 && etat.sansEnfant,
    kvType: etat.kvType,
    zusatzbeitrag: etat.zusatzbeitragPct / 100,
    primeMensuellePrivee: etat.primeMensuellePrivee,
    rvPflichtig: etat.rvPflichtig,
    annee: etat.annee,
  }), [bruttoAnnuel, etat]);

  const r = useMemo(() => calculerBruttoNetto(entree), [entree]);

  /* Comparaison de toutes les classes au meme salaire */
  const comparaisonClasses = useMemo(
    () => STEUERKLASSEN.map((k) => ({
      klasse: k,
      net: calculerBruttoNetto({ ...entree, klasse: k }).netMensuel,
    })),
    [entree],
  );
  const meilleureClasse = comparaisonClasses.reduce((a, b) => (b.net > a.net ? b : a));

  /* Comparaison des combinaisons pour un couple */
  const combinaisonsCouple = useMemo(() => {
    const conjointAnnuel = etat.periode === 'mois'
      ? etat.bruttoConjointMensuel * 12
      : etat.bruttoConjointMensuel;
    if (conjointAnnuel <= 0) return [];
    const { klasse, ...commun } = entree;
    void klasse;
    return comparerClassesCouple(bruttoAnnuel, conjointAnnuel, commun);
  }, [entree, bruttoAnnuel, etat.bruttoConjointMensuel, etat.periode]);

  const gainCouple = combinaisonsCouple.length >= 2
    ? combinaisonsCouple[0].netAnnuel - combinaisonsCouple[combinaisonsCouple.length - 1].netAnnuel
    : 0;

  const sv = SV[etat.annee] || SV[ANNEE_DEFAUT];

  const donnees = [
    { nom: s.net, valeur: Math.max(0, r.netAnnuel), couleur: '#06F5F5' },
    { nom: s.impots, valeur: Math.max(0, r.totalImpots), couleur: '#EC4899' },
    { nom: s.social, valeur: Math.max(0, r.totalSocial), couleur: '#A855F7' },
  ];

  const maxCurseur = etat.periode === 'mois' ? 15000 : 180000;
  const pasCurseur = etat.periode === 'mois' ? 50 : 500;

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* ------------------------------ Saisie ------------------------------ */}
        <div className="space-y-4">
          <Section titre={s.sectionSalaire}>
            <Choix
              options={[
                { valeur: 'mois', label: s.parMois },
                { valeur: 'an', label: s.parAn },
              ]}
              valeur={etat.periode}
              onChange={(v) => setEtat((prev) => ({
                ...prev,
                periode: v,
                bruttoMensuel: v === 'an' ? prev.bruttoMensuel * 12 : Math.round(prev.bruttoMensuel / 12),
              }))}
            />
            <Curseur
              label={etat.periode === 'mois' ? s.bruttoMois : s.bruttoAn}
              valeur={etat.bruttoMensuel}
              onChange={(v) => maj('bruttoMensuel', v)}
              min={0}
              max={maxCurseur}
              pas={pasCurseur}
              langue={langue}
            />
            <Choix
              label={s.annee}
              options={ANNEES_DISPONIBLES.map((a) => ({ valeur: a, label: String(a) }))}
              valeur={etat.annee}
              onChange={(v) => maj('annee', v)}
            />
          </Section>

          <Section titre={s.sectionImposition}>
            <Choix
              label={s.steuerklasse}
              indice={s.steuerklasseIndice}
              options={STEUERKLASSEN.map((k) => ({ valeur: k, label: k }))}
              valeur={etat.klasse}
              onChange={(v) => maj('klasse', v)}
              colonnes={6}
            />
            <div>
              <span className="block text-sm text-wambs-text mb-2">{s.bundesland}</span>
              <select
                value={etat.bundesland}
                onChange={(e) => maj('bundesland', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-wambs-surface border border-wambs-border
                           text-wambs-text text-sm min-h-[44px] cursor-pointer
                           focus:outline-none focus:border-wambs-purple/60"
              >
                {BUNDESLAENDER.map((code) => (
                  <option key={code} value={code}>{s.laender[code] || code}</option>
                ))}
              </select>
            </div>
            <Bascule
              label={s.kirchensteuer}
              indice={s.kirchensteuerIndice}
              valeur={etat.kirchenmitglied}
              onChange={(v) => maj('kirchenmitglied', v)}
              libelleOui={s.oui}
              libelleNon={s.non}
            />
          </Section>

          <Section titre={s.sectionFamille}>
            <ChampNombre
              label={s.kinderfreibetraege}
              indice={s.kinderfreibetraegeIndice}
              valeur={etat.kinderfreibetraege}
              onChange={(v) => maj('kinderfreibetraege', Math.max(0, Math.min(8, v)))}
              unite=""
              pas={0.5}
              max={8}
            />
            <ChampNombre
              label={s.enfantsMoins25}
              indice={s.enfantsMoins25Indice}
              valeur={etat.enfantsMoins25}
              onChange={(v) => maj('enfantsMoins25', Math.max(0, Math.min(10, Math.round(v))))}
              unite=""
              pas={1}
              max={10}
            />
            {etat.enfantsMoins25 === 0 && (
              <Bascule
                label={s.sansEnfant}
                indice={s.sansEnfantIndice}
                valeur={etat.sansEnfant}
                onChange={(v) => maj('sansEnfant', v)}
                libelleOui={s.oui}
                libelleNon={s.non}
              />
            )}
          </Section>

          <Section titre={s.sectionAssurance}>
            <Choix
              label={s.typeAssurance}
              options={[
                { valeur: 'gesetzlich', label: s.legale },
                { valeur: 'privat', label: s.privee },
              ]}
              valeur={etat.kvType}
              onChange={(v) => maj('kvType', v)}
            />
            {etat.kvType === 'gesetzlich' ? (
              <ChampNombre
                label={s.zusatzbeitrag}
                indice={interpoler(s.zusatzbeitragIndice, { moyen: nombre(sv.zusatzbeitragMoyen * 100, langue, 1) })}
                valeur={etat.zusatzbeitragPct}
                onChange={(v) => maj('zusatzbeitragPct', Math.max(0, Math.min(5, v)))}
                unite="%"
                pas={0.1}
                max={5}
              />
            ) : (
              <ChampNombre
                label={s.primePrivee}
                indice={s.primePriveeIndice}
                valeur={etat.primeMensuellePrivee}
                onChange={(v) => maj('primeMensuellePrivee', Math.max(0, v))}
                unite="€"
                pas={10}
              />
            )}
            <Bascule
              label={s.rvPflichtig}
              indice={s.rvPflichtigIndice}
              valeur={etat.rvPflichtig}
              onChange={(v) => maj('rvPflichtig', v)}
              libelleOui={s.oui}
              libelleNon={s.non}
            />
          </Section>
        </div>

        {/* ----------------------------- Resultat ----------------------------- */}
        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={euro(r.netMensuel, langue)}
            sousTexte={interpoler(s.resultatSousTexte, {
              annuel: euro(r.netAnnuel, langue),
              part: pourcent(r.tauxNet, langue),
            })}
            accent="#06F5F5"
          />

          <div className="bg-wambs-panel border border-wambs-border rounded-lg p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donnees}
                      innerRadius={38}
                      outerRadius={62}
                      paddingAngle={3}
                      dataKey="valeur"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {donnees.map((d) => <Cell key={d.nom} fill={d.couleur} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-1.5">
                {donnees.map((d) => (
                  <div key={d.nom} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.couleur }} />
                      <span className="text-xs sm:text-sm text-wambs-text truncate">{d.nom}</span>
                    </span>
                    <span className="text-xs sm:text-sm font-data text-wambs-muted flex-shrink-0">
                      {euro(d.valeur / 12, langue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decomposition detaillee */}
          <div className="bg-wambs-panel border border-wambs-border rounded-lg">
            <button
              type="button"
              onClick={() => setDetailOuvert(!detailOuvert)}
              className="w-full flex items-center justify-between p-4 cursor-pointer rounded-lg
                         hover:bg-wambs-cyan/5 transition-colors"
            >
              <span className="text-sm font-semibold text-wambs-cyan">{s.detailTitre}</span>
              <svg
                className={`w-4 h-4 text-wambs-cyan transition-transform ${detailOuvert ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {detailOuvert && (
              <div className="px-4 pb-4 border-t border-wambs-border pt-2">
                <LigneDetail label={s.brut} valeur={euro(r.bruttoMensuel, langue)} />
                <LigneDetail label={s.lohnsteuer} valeur={euro(r.postes.lohnsteuer / 12, langue)} negatif />
                {r.postes.soli > 0 && (
                  <LigneDetail label={s.soli} valeur={euro(r.postes.soli / 12, langue)} negatif />
                )}
                {r.postes.kirchensteuer > 0 && (
                  <LigneDetail label={s.kirchensteuerLigne} valeur={euro(r.postes.kirchensteuer / 12, langue)} negatif />
                )}
                <LigneDetail
                  label={s.rentenversicherung}
                  indice={r.detailsTechniques.assietteRVPlafonnee ? s.plafonne : null}
                  valeur={euro(r.postes.rentenversicherung / 12, langue)}
                  negatif
                />
                <LigneDetail label={s.arbeitslosenversicherung} valeur={euro(r.postes.arbeitslosenversicherung / 12, langue)} negatif />
                <LigneDetail
                  label={s.krankenversicherung}
                  indice={r.detailsTechniques.assietteKVPlafonnee ? s.plafonne : null}
                  valeur={euro(r.postes.krankenversicherung / 12, langue)}
                  negatif
                />
                {r.postes.pflegeversicherung > 0 && (
                  <LigneDetail label={s.pflegeversicherung} valeur={euro(r.postes.pflegeversicherung / 12, langue)} negatif />
                )}
                <LigneDetail label={s.net} valeur={euro(r.netMensuel, langue)} total accent="#06F5F5" />
                <div className="mt-3 pt-3 border-t border-wambs-border">
                  <LigneDetail
                    label={s.coutEmployeur}
                    indice={s.coutEmployeurIndice}
                    valeur={euro(r.coutEmployeurMensuel, langue)}
                  />
                  <LigneDetail label={s.revenuImposable} indice={s.revenuImposableIndice} valeur={euro(r.zvE, langue)} />
                </div>
              </div>
            )}
          </div>

          {/* Comparaison des classes d'imposition */}
          <div className="bg-wambs-panel border border-wambs-border rounded-lg">
            <button
              type="button"
              onClick={() => setComparaisonOuverte(!comparaisonOuverte)}
              className="w-full flex items-center justify-between p-4 cursor-pointer rounded-lg
                         hover:bg-wambs-cyan/5 transition-colors"
            >
              <span className="text-sm font-semibold text-wambs-cyan">{s.comparaisonTitre}</span>
              <svg
                className={`w-4 h-4 text-wambs-cyan transition-transform ${comparaisonOuverte ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {comparaisonOuverte && (
              <div className="px-4 pb-4 border-t border-wambs-border pt-3 space-y-3">
                <div className="space-y-1">
                  {comparaisonClasses.map((c) => (
                    <LigneDetail
                      key={c.klasse}
                      label={`${s.klasseCourt} ${c.klasse}`}
                      valeur={euro(c.net, langue)}
                      accent={c.klasse === etat.klasse ? '#06F5F5' : undefined}
                      indice={c.klasse === meilleureClasse.klasse ? s.meilleureOption : null}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-wambs-muted italic leading-relaxed">{s.comparaisonNote}</p>

                <div className="pt-3 border-t border-wambs-border space-y-3">
                  <p className="text-sm font-semibold text-wambs-purple">{s.coupleTitre}</p>
                  <ChampNombre
                    label={etat.periode === 'mois' ? s.salaireConjointMois : s.salaireConjointAn}
                    valeur={etat.bruttoConjointMensuel}
                    onChange={(v) => maj('bruttoConjointMensuel', Math.max(0, v))}
                    pas={etat.periode === 'mois' ? 50 : 500}
                  />
                  {combinaisonsCouple.map((c, i) => (
                    <LigneDetail
                      key={c.cle}
                      label={`${c.klasseA} / ${c.klasseB}`}
                      indice={i === 0 ? s.meilleureOption : null}
                      valeur={euro(c.netMensuel, langue)}
                      accent={i === 0 ? '#06F5F5' : undefined}
                    />
                  ))}
                  {gainCouple > 0 && (
                    <Alerte
                      niveau="positif"
                      titre={interpoler(s.gainCoupleTitre, { montant: euro(gainCouple, langue) })}
                      texte={s.gainCoupleTexte}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {r.detailsTechniques.auDessusJAEG && etat.kvType === 'gesetzlich' && (
            <Alerte niveau="info" titre={s.alerteJAEGTitre} texte={s.alerteJAEGTexte} />
          )}
          {(etat.klasse === 'V' || etat.klasse === 'VI') && (
            <Alerte niveau="attention" titre={s.alerteKlasseVTitre} texte={s.alerteKlasseVTexte} />
          )}

          <BlocCta
            titre={s.ctaEtiquette}
            sousTitre={s.ctaTexte}
            libelleBouton={t.step6.ctaPrimary}
            note={t.step6.ctaFreeNote}
            t={t}
            resume={{
              brutAnnuel: bruttoAnnuel,
              steuerklasse: etat.klasse,
              bundesland: etat.bundesland,
              netMensuel: Math.round(r.netMensuel),
              coutEmployeurMensuel: Math.round(r.coutEmployeurMensuel),
            }}
          />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(s.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
