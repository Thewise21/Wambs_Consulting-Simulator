/* ============================================================================
 * Simulateur expatriation Allemagne — arrivee, depart, frontaliers.
 * Positionnement : aucun cabinet ne propose cet outil en francais pour
 * l'Allemagne. Le parcours guide en 4 etapes, car les notions (assujettissement
 * mixte, Progressionsvorbehalt, § 1a) demandent un accompagnement.
 * ========================================================================== */
import { useMemo, useState } from 'react';
import { analyserExpatriation, PAYS, SITUATIONS } from '../calculators/expat';
import { STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, interpoler } from '../lib/format';
import {
  Section, Choix, Curseur, ChampNombre, Bascule,
  ResultatPrincipal, LigneDetail, Alerte, BlocCta, Avertissement,
} from '../components/shared/UI';

const ETAT_INITIAL = {
  situation: 'arrivee',
  paysOrigine: 'FR',
  moisArrivee: 7,
  revenuAllemand: 45000,
  revenuEtranger: 20000,
  statut: 'celibataire',
  conjointResteAlEtranger: false,
  revenuConjoint: 0,
  enfants: 0,
  annee: ANNEE_DEFAUT,
};

const TOTAL_ETAPES = 4;

export default function ExpatTool({ t, langue }) {
  const s = t.expat;
  const [etape, setEtape] = useState(0);
  const [etat, setEtat] = useState(ETAT_INITIAL);

  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const analyse = useMemo(() => analyserExpatriation(etat), [etat]);

  const estFrontalier = etat.situation === 'grenzgaenger';
  const estMarie = etat.statut === 'marie';

  const peutContinuer = () => {
    if (etape === 1) return etat.revenuAllemand > 0;
    return true;
  };

  /* --- Etape 1 : situation ------------------------------------------------ */
  const rendreSituation = () => (
    <div className="space-y-4">
      <Section titre={s.q1Titre} indice={s.q1Indice}>
        <Choix
          options={SITUATIONS.map((v) => ({
            valeur: v,
            label: s.situations[v].titre,
            indice: s.situations[v].description,
          }))}
          valeur={etat.situation}
          onChange={(v) => maj('situation', v)}
          colonnes={2}
        />
      </Section>

      <Section titre={s.q2Titre} indice={s.q2Indice}>
        <Choix
          options={PAYS.map((p) => ({ valeur: p, label: s.pays[p] }))}
          valeur={etat.paysOrigine}
          onChange={(v) => maj('paysOrigine', v)}
          colonnes={4}
        />
      </Section>
    </div>
  );

  /* --- Etape 2 : periode et revenus -------------------------------------- */
  const rendrePeriode = () => (
    <div className="space-y-4">
      {(etat.situation === 'arrivee' || etat.situation === 'depart') && (
        <Section
          titre={etat.situation === 'arrivee' ? s.q3TitreArrivee : s.q3TitreDepart}
          indice={s.q3Indice}
        >
          <Curseur
            label={etat.situation === 'arrivee' ? s.moisArrivee : s.moisDepart}
            valeur={etat.moisArrivee}
            onChange={(v) => maj('moisArrivee', v)}
            min={1}
            max={12}
            pas={1}
            langue={langue}
            formatteur={(v) => s.mois[v - 1]}
          />
          <p className="text-xs text-wambs-muted leading-relaxed">
            {interpoler(s.moisResume, { mois: analyse.moisEnAllemagne })}
          </p>
        </Section>
      )}

      <Section titre={s.q4Titre} indice={estFrontalier ? s.q4IndiceFrontalier : s.q4Indice}>
        <ChampNombre
          label={s.revenuAllemand}
          indice={s.revenuAllemandIndice}
          valeur={etat.revenuAllemand}
          onChange={(v) => maj('revenuAllemand', Math.max(0, v))}
          pas={1000}
        />
        {!estFrontalier && (
          <ChampNombre
            label={s.revenuEtranger}
            indice={s.revenuEtrangerIndice}
            valeur={etat.revenuEtranger}
            onChange={(v) => maj('revenuEtranger', Math.max(0, v))}
            pas={1000}
          />
        )}
      </Section>
    </div>
  );

  /* --- Etape 3 : famille -------------------------------------------------- */
  const rendreFamille = () => (
    <div className="space-y-4">
      <Section titre={s.q5Titre}>
        <Choix
          options={[
            { valeur: 'celibataire', label: s.celibataire },
            { valeur: 'marie', label: s.marie },
          ]}
          valeur={etat.statut}
          onChange={(v) => maj('statut', v)}
          colonnes={2}
        />
        {estMarie && (
          <>
            <Bascule
              label={s.conjointAlEtranger}
              indice={s.conjointAlEtrangerIndice}
              valeur={etat.conjointResteAlEtranger}
              onChange={(v) => maj('conjointResteAlEtranger', v)}
              libelleOui={s.oui}
              libelleNon={s.non}
            />
            <ChampNombre
              label={s.revenuConjoint}
              indice={s.revenuConjointIndice}
              valeur={etat.revenuConjoint}
              onChange={(v) => maj('revenuConjoint', Math.max(0, v))}
              pas={1000}
            />
          </>
        )}
        <ChampNombre
          label={s.enfants}
          indice={s.enfantsIndice}
          valeur={etat.enfants}
          onChange={(v) => maj('enfants', Math.max(0, Math.min(10, Math.round(v))))}
          unite=""
          pas={1}
          max={10}
        />
      </Section>
    </div>
  );

  /* --- Etape 4 : resultat -------------------------------------------------- */
  const rendreResultat = () => {
    const a = analyse;
    const montantVedette = a.economiePotentielle > 0
      ? a.economiePotentielle
      : a.progression.supplement;
    const modeEconomie = a.economiePotentielle > 0;

    return (
      <div className="space-y-4 sm:space-y-5">
        <ResultatPrincipal
          etiquette={modeEconomie ? s.resEconomieEtiquette : s.resSurcoutEtiquette}
          montant={euro(montantVedette, langue)}
          sousTexte={modeEconomie ? s.resEconomieSousTexte : s.resSurcoutSousTexte}
          accent={modeEconomie ? '#06F5F5' : '#FB923C'}
        />

        {/* Statut fiscal */}
        <Section titre={s.resStatutTitre}>
          <LigneDetail
            label={s.resAssujettissement}
            valeur={s.assujettissements[a.typeAssujettissement]}
            accent="#A855F7"
          />
          <LigneDetail
            label={s.resMoisAllemagne}
            valeur={interpoler(s.resMoisValeur, { mois: a.moisEnAllemagne })}
          />
          <LigneDetail label={s.resSteuerklasse} valeur={a.steuerklasseRecommandee} accent="#06F5F5" />
          <LigneDetail
            label={s.resDeclaration}
            valeur={a.obligationDeclaration ? s.oui : s.non}
            accent={a.obligationDeclaration ? '#EC4899' : undefined}
          />
        </Section>

        {/* Chiffrage */}
        <Section titre={s.resChiffrageTitre} indice={s.resChiffrageIndice}>
          <LigneDetail label={s.resRevenuImposable} valeur={euro(a.zvE, langue)} />
          {a.progression.supplement > 0 && (
            <>
              <LigneDetail
                label={s.resImpotSansProgression}
                valeur={euro(a.progression.impotSans, langue)}
              />
              <LigneDetail
                label={s.resImpotAvecProgression}
                indice={interpoler(s.resTauxSpecial, {
                  normal: pourcent(a.progression.tauxNormal, langue),
                  special: pourcent(a.progression.tauxSpecial, langue),
                })}
                valeur={euro(a.progression.impotAvec, langue)}
                accent="#FB923C"
              />
            </>
          )}
          {a.splittingPossible && a.gainSplitting > 0 && (
            <LigneDetail
              label={s.resAvecSplitting}
              indice={s.resAvecSplittingIndice}
              valeur={euro(a.impotAvecSplitting, langue)}
              accent="#06F5F5"
            />
          )}
          {a.soli > 0 && <LigneDetail label={s.resSoli} valeur={euro(a.soli, langue)} negatif />}
          <LigneDetail
            label={s.resChargeTotale}
            indice={interpoler(s.resTauxEffectif, { taux: pourcent(a.tauxEffectif, langue) })}
            valeur={euro(a.chargeTotale, langue)}
            total
          />
        </Section>

        {/* Points de vigilance */}
        {a.alertes.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-wambs-cyan">{s.resAlertesTitre}</h3>
            {a.alertes.map((alerte) => {
              const modele = s.alertes[alerte.cle];
              if (!modele) return null;
              const valeurs = {
                ...alerte.params,
                montant: alerte.params.montant !== undefined ? euro(alerte.params.montant, langue) : '',
                taux: alerte.params.taux !== undefined ? pourcent(alerte.params.taux, langue) : '',
                part: alerte.params.part !== undefined ? pourcent(alerte.params.part, langue) : '',
                pays: alerte.params.pays ? s.pays[alerte.params.pays] : '',
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
        )}

        {/* Checklist */}
        {a.checklist.length > 0 && (
          <Section titre={s.resChecklistTitre} indice={s.resChecklistIndice}>
            <ul className="space-y-2">
              {a.checklist.map((cle) => (
                <li key={cle} className="flex items-start gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-wambs-purple flex-shrink-0" />
                  <span className="text-sm text-wambs-text leading-relaxed">{s.checklist[cle] || cle}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <BlocCta
          titre={s.ctaEtiquette}
          sousTitre={s.ctaTexte}
          libelleBouton={s.ctaBouton}
          note={t.step6.ctaFreeNote}
          t={t}
          resume={{
            situation: etat.situation,
            paysOrigine: etat.paysOrigine,
            assujettissement: a.typeAssujettissement,
            chargeTotale: Math.round(a.chargeTotale),
            economiePotentielle: Math.round(a.economiePotentielle),
          }}
        />

        <button
          type="button"
          onClick={() => { setEtat(ETAT_INITIAL); setEtape(0); }}
          className="block w-full py-3 text-center text-wambs-muted text-sm
                     hover:text-wambs-cyan transition-colors cursor-pointer"
        >
          &#8635; {t.step6.restart}
        </button>
      </div>
    );
  };

  const etapes = [rendreSituation, rendrePeriode, rendreFamille, rendreResultat];

  return (
    <div className="step-enter space-y-5">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      {/* Progression */}
      <div>
        <div className="flex justify-between text-xs text-wambs-muted mb-1.5">
          <span>{s.etapes[etape]}</span>
          <span className="font-data">{etape + 1} / {TOTAL_ETAPES}</span>
        </div>
        <div className="h-1.5 rounded-full bg-wambs-surface overflow-hidden">
          <div
            className="h-full progress-gradient transition-all duration-500"
            style={{ width: `${((etape + 1) / TOTAL_ETAPES) * 100}%` }}
          />
        </div>
      </div>

      <div key={etape}>{etapes[etape]()}</div>

      {etape < TOTAL_ETAPES - 1 && (
        <div className="flex gap-2 sm:gap-3 pt-1">
          {etape > 0 && (
            <button
              type="button"
              onClick={() => setEtape(etape - 1)}
              className="btn-outline-gradient flex-1 py-3 rounded-xl cursor-pointer font-medium
                         text-sm sm:text-base min-h-[48px]"
            >
              {t.back}
            </button>
          )}
          <button
            type="button"
            onClick={() => peutContinuer() && setEtape(etape + 1)}
            disabled={!peutContinuer()}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base min-h-[48px] ${
              peutContinuer()
                ? 'btn-gradient text-white cursor-pointer'
                : 'bg-wambs-surface text-wambs-muted cursor-not-allowed'
            }`}
          >
            {etape === TOTAL_ETAPES - 2 ? s.voirResultat : t.next}
          </button>
        </div>
      )}

      <Avertissement texte={s.avertissement} stand={interpoler(s.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
