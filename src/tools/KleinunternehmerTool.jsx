/* ============================================================================
 * Kleinunternehmerregelung (§ 19 UStG) contre regime normal.
 * La question n° 1 des independants qui demarrent : le simulateur donne un
 * chiffre, puis explique a partir de quelle part de clientele l'arbitrage
 * bascule.
 * ========================================================================== */
import { useMemo, useState } from 'react';
import { analyserKleinunternehmer } from '../calculators/kleinunternehmer';
import { STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, Alerte, BlocCta, Avertissement,
} from '../components/shared/UI';

const ETAT_INITIAL = {
  umsatz: 40000,
  vorjahresumsatz: 20000,
  premiereAnnee: false,
  partParticuliersPct: 50,
  achats: 8000,
  investissement: 0,
  satzReduit: false,
  annee: ANNEE_DEFAUT,
};

export default function KleinunternehmerTool({ t, langue }) {
  const s = t.kleinunternehmer;
  const [etat, setEtat] = useState(ETAT_INITIAL);

  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserKleinunternehmer({
    umsatz: etat.umsatz,
    vorjahresumsatz: etat.vorjahresumsatz,
    premiereAnnee: etat.premiereAnnee,
    partParticuliers: etat.partParticuliersPct / 100,
    achats: etat.achats,
    investissement: etat.investissement,
    satzReduit: etat.satzReduit,
    annee: etat.annee,
  }), [etat]);

  const gagnant = r.recommandation;
  const ecart = Math.abs(r.difference);
  const accent = gagnant === 'kleinunternehmer' ? '#06F5F5' : '#FB923C';

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* ------------------------------ Saisie ------------------------------ */}
        <div className="space-y-4">
          <Section titre={s.sectionChiffreAffaires} indice={s.sectionChiffreAffairesIndice}>
            <Curseur
              label={s.umsatz}
              valeur={etat.umsatz}
              onChange={(v) => maj('umsatz', v)}
              min={0}
              max={150000}
              pas={1000}
              langue={langue}
            />
            <Bascule
              label={s.premiereAnnee}
              indice={s.premiereAnneeIndice}
              valeur={etat.premiereAnnee}
              onChange={(v) => maj('premiereAnnee', v)}
              libelleOui={s.oui}
              libelleNon={s.non}
            />
            {!etat.premiereAnnee && (
              <ChampNombre
                label={s.vorjahresumsatz}
                indice={interpoler(s.vorjahresumsatzIndice, {
                  limite: euro(r.limites.vorjahr, langue),
                })}
                valeur={etat.vorjahresumsatz}
                onChange={(v) => maj('vorjahresumsatz', Math.max(0, v))}
                pas={1000}
              />
            )}
          </Section>

          <Section titre={s.sectionClientele} indice={s.sectionClienteleIndice}>
            <Curseur
              label={s.partParticuliers}
              valeur={etat.partParticuliersPct}
              onChange={(v) => maj('partParticuliersPct', v)}
              min={0}
              max={100}
              pas={5}
              langue={langue}
              formatteur={(v) => `${nombre(v, langue)} %`}
            />
            <p className="text-xs text-wambs-muted leading-relaxed">{s.partParticuliersIndice}</p>
          </Section>

          <Section titre={s.sectionDepenses} indice={s.sectionDepensesIndice}>
            <ChampNombre
              label={s.achats}
              indice={s.achatsIndice}
              valeur={etat.achats}
              onChange={(v) => maj('achats', Math.max(0, v))}
              pas={500}
            />
            <ChampNombre
              label={s.investissement}
              indice={s.investissementIndice}
              valeur={etat.investissement}
              onChange={(v) => maj('investissement', Math.max(0, v))}
              pas={1000}
            />
            <Bascule
              label={s.satzReduit}
              indice={s.satzReduitIndice}
              valeur={etat.satzReduit}
              onChange={(v) => maj('satzReduit', v)}
              libelleOui={s.oui}
              libelleNon={s.non}
            />
          </Section>
        </div>

        {/* ----------------------------- Resultat ----------------------------- */}
        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={r.eligible ? s.resultatEtiquette : s.resultatNonEligible}
            montant={r.eligible ? s.options[gagnant] : s.regimeObligatoire}
            sousTexte={r.eligible
              ? interpoler(s.resultatSousTexte, { montant: euro(ecart, langue) })
              : s.resultatNonEligibleTexte}
            accent={r.eligible ? accent : '#EC4899'}
          />

          {/* Les deux regimes cote a cote */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { cle: 'kleinunternehmer', donnees: r.kleinunternehmer, couleur: '#06F5F5' },
              { cle: 'regelbesteuerung', donnees: r.regimeNormal, couleur: '#FB923C' },
            ].map(({ cle, donnees, couleur }) => (
              <div
                key={cle}
                className={`bg-wambs-panel border rounded-lg p-3 sm:p-4 ${
                  r.eligible && gagnant === cle ? 'selected-card' : 'border-wambs-border'
                }`}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: couleur }}>
                  {s.options[cle]}
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between gap-1">
                    <span className="text-wambs-muted">{s.recettes}</span>
                    <span className="font-data text-wambs-text">{euro(donnees.recettes, langue)}</span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-wambs-muted">{s.depenses}</span>
                    <span className="font-data text-wambs-text">{euro(donnees.depenses, langue)}</span>
                  </div>
                  <div className="flex justify-between gap-1 pt-1.5 mt-1.5 border-t border-wambs-border">
                    <span className="text-wambs-text font-medium">{s.resultat}</span>
                    <span className="font-data font-semibold" style={{ color: couleur }}>
                      {euro(donnees.resultat, langue)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Section titre={s.detailTitre}>
            <LigneDetail
              label={s.tvaNonFacturee}
              indice={s.tvaNonFactureeIndice}
              valeur={euro(r.regimeNormal.tvaReversee, langue)}
              accent="#06F5F5"
            />
            <LigneDetail
              label={s.vorsteuerPerdue}
              indice={s.vorsteuerPerdueIndice}
              valeur={euro(r.vorsteuerPerdue, langue)}
              accent="#EC4899"
            />
            <LigneDetail
              label={s.difference}
              valeur={euro(ecart, langue)}
              indice={interpoler(s.differenceIndice, { regime: s.options[gagnant] })}
              total
              accent={accent}
            />
            {r.seuilBascule !== null && (
              <LigneDetail
                label={s.seuilBascule}
                indice={s.seuilBasculeIndice}
                valeur={pourcent(r.seuilBascule, langue, 0)}
              />
            )}
          </Section>

          {/* Points de vigilance */}
          <div className="space-y-2.5">
            {r.alertes.map((alerte) => {
              const modele = s.alertes[alerte.cle];
              if (!modele) return null;
              const valeurs = {
                ...alerte.params,
                montant: alerte.params.montant !== undefined ? euro(alerte.params.montant, langue) : '',
                limite: alerte.params.limite !== undefined ? euro(alerte.params.limite, langue) : '',
                annees: alerte.params.annees,
              };
              return (
                <Alerte
                  key={alerte.cle}
                  niveau={alerte.niveau}
                  titre={interpoler(modele.titre, valeurs)}
                  texte={interpoler(modele.texte, valeurs)}
                  reference={modele.reference}
                />
              );
            })}
          </div>

          <BlocCta
            titre={s.ctaEtiquette}
            sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton}
            note={t.step6.ctaFreeNote}
            t={t}
            resume={{
              umsatz: etat.umsatz,
              partParticuliers: etat.partParticuliersPct,
              eligible: r.eligible,
              recommandation: r.recommandation,
              ecartAnnuel: Math.round(ecart),
            }}
          />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(t.bn.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
