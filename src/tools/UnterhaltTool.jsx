/* Soutien financier aux proches restes au pays (§ 33a EStG). */
import { useMemo, useState } from 'react';
import { analyserUnterhalt } from '../calculators/unterhalt';
import { LAENDERGRUPPEN, STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, Choix, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ETAT_INITIAL = {
  montantVerse: 6000,
  laendergruppe: 4,
  nombrePersonnes: 1,
  revenusPersonne: 0,
  moisSoutien: 12,
  parVirement: true,
  conjointBeneficiaire: false,
  beneficiaireApteAuTravail: false,
  revenuNetPayeur: 30000,
  revenuImposablePayeur: 38000,
  splitting: false,
  conjointPayeur: false,
  enfantsPayeur: 0,
  annee: ANNEE_DEFAUT,
};

export default function UnterhaltTool({ t, langue }) {
  const s = t.unterhalt;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserUnterhalt(etat), [etat]);
  const bloque = r.formeInvalide || r.refuseErwerbsobliegenheit;

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionEnvois} indice={s.sectionEnvoisIndice}>
            <Curseur label={s.montantVerse} valeur={etat.montantVerse}
              onChange={(v) => maj('montantVerse', v)} min={0} max={30000} pas={250} langue={langue} />
            <ChampNombre label={s.nombrePersonnes} indice={s.nombrePersonnesIndice}
              valeur={etat.nombrePersonnes}
              onChange={(v) => maj('nombrePersonnes', Math.max(1, Math.round(v)))} unite="" pas={1} />
            <Curseur label={s.moisSoutien} valeur={etat.moisSoutien}
              onChange={(v) => maj('moisSoutien', v)} min={1} max={12} pas={1} langue={langue}
              formatteur={(v) => `${nombre(v, langue)} / 12`} />
            <Bascule label={s.parVirement} indice={s.parVirementIndice} valeur={etat.parVirement}
              onChange={(v) => maj('parVirement', v)} libelleOui={s.oui} libelleNon={s.non} />
          </Section>

          <Section titre={s.sectionPays} indice={s.sectionPaysIndice}>
            <Choix
              options={Object.keys(LAENDERGRUPPEN).map((g) => ({
                valeur: Number(g),
                label: s.groupes[g].titre,
                indice: s.groupes[g].description,
              }))}
              valeur={etat.laendergruppe}
              onChange={(v) => maj('laendergruppe', v)}
              colonnes={2}
            />
          </Section>

          <Section titre={s.sectionBeneficiaire} indice={s.sectionBeneficiaireIndice}>
            <Bascule label={s.conjointBeneficiaire} indice={s.conjointBeneficiaireIndice}
              valeur={etat.conjointBeneficiaire} onChange={(v) => maj('conjointBeneficiaire', v)}
              libelleOui={s.oui} libelleNon={s.non} />
            <Bascule label={s.beneficiaireApteAuTravail} indice={s.beneficiaireApteAuTravailIndice}
              valeur={etat.beneficiaireApteAuTravail}
              onChange={(v) => maj('beneficiaireApteAuTravail', v)} libelleOui={s.oui} libelleNon={s.non} />
            <ChampNombre label={s.revenusPersonne} indice={s.revenusPersonneIndice}
              valeur={etat.revenusPersonne}
              onChange={(v) => maj('revenusPersonne', Math.max(0, v))} pas={100} />
          </Section>

          <Section titre={s.sectionPayeur} indice={s.sectionPayeurIndice}>
            <ChampNombre label={s.revenuNetPayeur} indice={s.revenuNetPayeurIndice}
              valeur={etat.revenuNetPayeur}
              onChange={(v) => maj('revenuNetPayeur', Math.max(0, v))} pas={1000} />
            <ChampNombre label={s.revenuImposablePayeur} valeur={etat.revenuImposablePayeur}
              onChange={(v) => maj('revenuImposablePayeur', Math.max(0, v))} pas={1000} />
            <Bascule label={s.splitting} valeur={etat.splitting}
              onChange={(v) => maj('splitting', v)} libelleOui={s.oui} libelleNon={s.non} />
            <Bascule label={s.conjointPayeur} indice={s.conjointPayeurIndice} valeur={etat.conjointPayeur}
              onChange={(v) => maj('conjointPayeur', v)} libelleOui={s.oui} libelleNon={s.non} />
            <ChampNombre label={s.enfantsPayeur} indice={s.enfantsPayeurIndice} valeur={etat.enfantsPayeur}
              onChange={(v) => maj('enfantsPayeur', Math.max(0, Math.round(v)))} unite="" pas={1} />
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={bloque ? s.resultatBloque : s.resultatEtiquette}
            montant={euro(r.economie, langue)}
            sousTexte={bloque
              ? s.resultatBloqueTexte
              : interpoler(s.resultatSousTexte, {
                deductible: euro(r.deductibleTotal, langue),
                taux: pourcent(r.tauxMarginal, langue),
              })}
            accent={bloque ? '#EC4899' : '#06F5F5'}
          />

          <Section titre={s.detailTitre} indice={s.detailIndice}>
            <LigneDetail label={s.montantVerseLigne} valeur={euro(r.montantVerse, langue)} />
            <LigneDetail label={s.plafondPlein}
              indice={interpoler(s.plafondPleinIndice, {
                groupe: nombre(r.groupe, langue), part: pourcent(r.fraction, langue, 0),
              })}
              valeur={euro(r.plafondPlein, langue)} />
            {r.plafondProrata !== r.plafondPlein && (
              <LigneDetail label={s.plafondProrata} valeur={euro(r.plafondProrata, langue)} />
            )}
            {r.imputation > 0 && (
              <LigneDetail label={s.imputation} indice={s.imputationIndice}
                valeur={euro(r.imputation, langue)} negatif />
            )}
            {r.opfergrenzeApplicable && (
              <LigneDetail label={s.opfergrenzeLigne}
                indice={interpoler(s.opfergrenzeIndice, { part: pourcent(r.opfergrenze.part, langue, 0) })}
                valeur={euro(r.opfergrenze.montant, langue)}
                accent={r.limiteParOpfergrenze ? '#FB923C' : undefined} />
            )}
            <LigneDetail label={s.deductible} valeur={euro(r.deductibleTotal, langue)} total accent="#A855F7" />
            <LigneDetail label={s.economie}
              indice={interpoler(s.economieIndice, { taux: pourcent(r.tauxMarginal, langue) })}
              valeur={euro(r.economie, langue)} total accent="#06F5F5" />
            {r.partReconnue > 0 && r.partReconnue < 1 && (
              <LigneDetail label={s.partReconnue} valeur={pourcent(r.partReconnue, langue, 0)} />
            )}
          </Section>

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              montantVerse: r.montantVerse,
              groupePays: r.groupe,
              personnesSoutenues: r.nombrePersonnes,
              deductible: Math.round(r.deductibleTotal),
              economie: Math.round(r.economie),
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(t.bn.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
