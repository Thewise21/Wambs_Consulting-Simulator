/* ============================================================================
 * Comparateur de forme juridique — calcul en direct.
 * Le prospect voit immediatement laquelle des quatre formes lui laisse le plus,
 * et pourquoi : la ligne de charge est detaillee poste par poste.
 * ========================================================================== */
import { useMemo, useState } from 'react';
import { comparerFormesJuridiques } from '../calculators/rechtsform';
import { hebesatzNeutre } from '../calculators/gewerbesteuer';
import {
  HEBESAETZE_REFERENCE, BUNDESLAENDER, FORMES_JURIDIQUES,
  STAND, ANNEE_DEFAUT, ANNEES_DISPONIBLES,
} from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, Choix, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, Alerte, BlocCta, Avertissement,
} from '../components/shared/UI';

const ETAT_INITIAL = {
  benefice: 120000,
  remuneration: 60000,
  hebesatz: 410,
  quoteDistributionPct: 100,
  splitting: false,
  kirchenmitglied: false,
  bundesland: 'BE',
  annee: ANNEE_DEFAUT,
};

const ACCENTS = {
  freiberufler: '#06F5F5',
  einzelunternehmen: '#A855F7',
  ug: '#EC4899',
  gmbh: '#FB923C',
};

export default function RechtsformTool({ t, langue }) {
  const s = t.rechtsform;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const [detailOuvert, setDetailOuvert] = useState(null);

  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const comparaison = useMemo(() => comparerFormesJuridiques({
    benefice: etat.benefice,
    remuneration: etat.remuneration,
    hebesatz: etat.hebesatz,
    quoteDistribution: etat.quoteDistributionPct / 100,
    splitting: etat.splitting,
    kirchenmitglied: etat.kirchenmitglied,
    bundesland: etat.bundesland,
    annee: etat.annee,
  }), [etat]);

  const { resultats, valeurCreee, meilleure, ecartMaximal } = comparaison;
  const classes = [...resultats].sort((a, b) => valeurCreee(b) - valeurCreee(a));
  const neutre = hebesatzNeutre(etat.annee);

  const societeChoisie = resultats.find((r) => r.forme === 'ug');

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* ------------------------------ Saisie ------------------------------ */}
        <div className="space-y-4">
          <Section titre={s.sectionBenefice} indice={s.sectionBeneficeIndice}>
            <Curseur
              label={s.benefice}
              valeur={etat.benefice}
              onChange={(v) => maj('benefice', v)}
              min={0}
              max={500000}
              pas={5000}
              langue={langue}
            />
            <Curseur
              label={s.remuneration}
              valeur={etat.remuneration}
              onChange={(v) => maj('remuneration', v)}
              min={0}
              max={Math.max(20000, etat.benefice)}
              pas={2500}
              langue={langue}
            />
            <p className="text-xs text-wambs-muted leading-relaxed">{s.remunerationIndice}</p>
            <Curseur
              label={s.quoteDistribution}
              valeur={etat.quoteDistributionPct}
              onChange={(v) => maj('quoteDistributionPct', v)}
              min={0}
              max={100}
              pas={5}
              langue={langue}
              formatteur={(v) => `${nombre(v, langue)} %`}
            />
            <p className="text-xs text-wambs-muted leading-relaxed">{s.quoteDistributionIndice}</p>
          </Section>

          <Section titre={s.sectionCommune} indice={s.sectionCommuneIndice}>
            <ChampNombre
              label={s.hebesatz}
              indice={interpoler(s.hebesatzIndice, { neutre: nombre(neutre, langue) })}
              valeur={etat.hebesatz}
              onChange={(v) => maj('hebesatz', Math.max(200, Math.min(1000, v)))}
              unite="%"
              pas={5}
            />
            <Choix
              options={HEBESAETZE_REFERENCE.map((h) => ({
                valeur: h.hebesatz,
                label: `${s.communes[h.commune] || h.commune} ${h.hebesatz} %`,
              }))}
              valeur={etat.hebesatz}
              onChange={(v) => maj('hebesatz', v)}
            />
          </Section>

          <Section titre={s.sectionPersonnel}>
            <Bascule
              label={s.splitting}
              indice={s.splittingIndice}
              valeur={etat.splitting}
              onChange={(v) => maj('splitting', v)}
              libelleOui={s.oui}
              libelleNon={s.non}
            />
            <Bascule
              label={s.kirchensteuer}
              valeur={etat.kirchenmitglied}
              onChange={(v) => maj('kirchenmitglied', v)}
              libelleOui={s.oui}
              libelleNon={s.non}
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
                  <option key={code} value={code}>{t.bn.laender[code] || code}</option>
                ))}
              </select>
            </div>
            <Choix
              label={s.annee}
              options={ANNEES_DISPONIBLES.map((a) => ({ valeur: a, label: String(a) }))}
              valeur={etat.annee}
              onChange={(v) => maj('annee', v)}
            />
          </Section>
        </div>

        {/* ----------------------------- Resultat ----------------------------- */}
        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={s.formes[meilleure].titre}
            sousTexte={interpoler(s.resultatSousTexte, { montant: euro(ecartMaximal, langue) })}
            accent={ACCENTS[meilleure]}
          />

          {/* Classement */}
          <div className="space-y-2.5">
            {classes.map((r, rang) => {
              const ouvert = detailOuvert === r.forme;
              return (
                <div key={r.forme} className="bg-wambs-panel border border-wambs-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDetailOuvert(ouvert ? null : r.forme)}
                    className="w-full p-4 cursor-pointer hover:bg-wambs-cyan/5 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: ACCENTS[r.forme] }}
                          />
                          <span className="text-sm font-semibold text-wambs-text">
                            {s.formes[r.forme].titre}
                          </span>
                          {rang === 0 && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                              style={{ color: ACCENTS[r.forme], backgroundColor: `${ACCENTS[r.forme]}1A` }}
                            >
                              {s.meilleure}
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-wambs-muted mt-1">
                          {s.formes[r.forme].description}
                        </span>
                      </span>
                      {/* Le montant affiche doit etre celui qui sert au
                          classement : sinon l'UG apparait derniere tout en
                          montrant la charge la plus basse. */}
                      <span className="text-right flex-shrink-0">
                        <span className="block font-data text-sm font-semibold" style={{ color: ACCENTS[r.forme] }}>
                          {euro(valeurCreee(r), langue)}
                        </span>
                        <span className="block text-[11px] text-wambs-muted font-data">
                          {interpoler(s.chargeCourte, {
                            montant: euro(r.chargeTotale, langue),
                            taux: pourcent(r.tauxCharge, langue),
                          })}
                        </span>
                      </span>
                    </div>
                  </button>

                  {ouvert && (
                    <div className="px-4 pb-4 border-t border-wambs-border pt-2">
                      {r.postes.gewerbesteuer > 0 && (
                        <LigneDetail label={s.postes.gewerbesteuer} valeur={euro(r.postes.gewerbesteuer, langue)} negatif />
                      )}
                      {r.postes.anrechnungGewerbesteuer < 0 && (
                        <LigneDetail
                          label={s.postes.anrechnung}
                          indice={s.postes.anrechnungIndice}
                          valeur={euro(-r.postes.anrechnungGewerbesteuer, langue)}
                          accent="#06F5F5"
                        />
                      )}
                      {r.postes.koerperschaftsteuer > 0 && (
                        <>
                          <LigneDetail label={s.postes.koerperschaftsteuer} valeur={euro(r.postes.koerperschaftsteuer, langue)} negatif />
                          <LigneDetail label={s.postes.soliKst} valeur={euro(r.postes.soliKoerperschaftsteuer, langue)} negatif />
                        </>
                      )}
                      {r.postes.einkommensteuer > 0 && (
                        <LigneDetail
                          label={s.postes.einkommensteuer}
                          indice={r.remuneration > 0 ? interpoler(s.postes.surRemuneration, { montant: euro(r.remuneration, langue) }) : null}
                          valeur={euro(r.postes.einkommensteuer, langue)}
                          negatif
                        />
                      )}
                      {r.postes.soli > 0 && <LigneDetail label={s.postes.soli} valeur={euro(r.postes.soli, langue)} negatif />}
                      {r.postes.kirchensteuer > 0 && <LigneDetail label={s.postes.kirchensteuer} valeur={euro(r.postes.kirchensteuer, langue)} negatif />}
                      {r.postes.abgeltungsteuer > 0 && (
                        <LigneDetail
                          label={s.postes.abgeltungsteuer}
                          indice={interpoler(s.postes.surDistribution, { montant: euro(r.distribution || 0, langue) })}
                          valeur={euro(r.postes.abgeltungsteuer, langue)}
                          negatif
                        />
                      )}
                      <LigneDetail label={s.chargeTotale} valeur={euro(r.chargeTotale, langue)} total />
                      <div className="mt-2 pt-2 border-t border-wambs-border">
                        <LigneDetail label={s.revenuDisponible} valeur={euro(r.revenuDisponible, langue)} accent="#06F5F5" />
                        {r.resteDansSociete > 0 && (
                          <LigneDetail
                            label={s.resteDansSociete}
                            indice={s.resteDansSocieteIndice}
                            valeur={euro(r.resteDansSociete, langue)}
                          />
                        )}
                        <LigneDetail
                          label={s.valeurCreee}
                          indice={s.valeurCreeeIndice}
                          valeur={euro(valeurCreee(r), langue)}
                          total
                          accent={ACCENTS[r.forme]}
                        />
                        {r.reserveObligatoire > 0 && (
                          <LigneDetail
                            label={s.reserveObligatoire}
                            indice={s.reserveObligatoireIndice}
                            valeur={euro(r.reserveObligatoire, langue)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Points de vigilance */}
          <div className="space-y-2.5">
            <Alerte
              niveau="info"
              titre={s.alertes.thesaurierung.titre}
              texte={interpoler(s.alertes.thesaurierung.texte, {
                decote: pourcent(comparaison.chargeDifferee, langue, 1),
              })}
              reference="§ 32d EStG"
            />
            {etat.hebesatz > neutre && (
              <Alerte
                niveau="attention"
                titre={interpoler(s.alertes.hebesatzEleve.titre, { neutre: nombre(neutre, langue) })}
                texte={s.alertes.hebesatzEleve.texte}
                reference="§ 35 EStG"
              />
            )}
            {etat.hebesatz <= neutre && (
              <Alerte
                niveau="positif"
                titre={interpoler(s.alertes.hebesatzNeutre.titre, { neutre: nombre(neutre, langue) })}
                texte={s.alertes.hebesatzNeutre.texte}
                reference="§ 35 EStG"
              />
            )}
            <Alerte
              niveau="info"
              titre={interpoler(s.alertes.stammkapital.titre, {
                ug: euro(FORMES_JURIDIQUES.ug.stammkapitalMinimum, langue),
                gmbh: euro(FORMES_JURIDIQUES.gmbh.stammkapitalMinimum, langue),
              })}
              texte={s.alertes.stammkapital.texte}
              reference="§ 5 GmbHG, § 5a GmbHG"
            />
            {societeChoisie && societeChoisie.reserveObligatoire > 0 && (
              <Alerte
                niveau="attention"
                titre={s.alertes.ugRuecklage.titre}
                texte={s.alertes.ugRuecklage.texte}
                reference="§ 5a Abs. 3 GmbHG"
              />
            )}
            {etat.remuneration > 0 && (
              <Alerte
                niveau="attention"
                titre={s.alertes.angemessenheit.titre}
                texte={s.alertes.angemessenheit.texte}
                reference="§ 8 Abs. 3 KStG"
              />
            )}
            <Alerte niveau="info" titre={s.alertes.hypotheses.titre} texte={s.alertes.hypotheses.texte} />
          </div>

          <BlocCta
            titre={s.ctaEtiquette}
            sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton}
            note={t.step6.ctaFreeNote}
            t={t}
            resume={{
              benefice: etat.benefice,
              remuneration: etat.remuneration,
              hebesatz: etat.hebesatz,
              formeRecommandee: meilleure,
              ecartMaximal: Math.round(ecartMaximal),
            }}
          />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(t.bn.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
