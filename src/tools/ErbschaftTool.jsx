/* Droits de succession et de donation : abattements, classes, regle des dix ans. */
import { useMemo, useState } from 'react';
import { analyserSuccession, LIENS } from '../calculators/erbschaft';
import { STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, Choix, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, BlocCta, Avertissement,
} from '../components/shared/UI';
import ListeAlertes from '../components/shared/ListeAlertes';

const ETAT_INITIAL = {
  patrimoine: 600000,
  lien: 'enfant',
  beneficiaires: 1,
  donation: false,
  annee: ANNEE_DEFAUT,
};

export default function ErbschaftTool({ t, langue }) {
  const s = t.erbschaft;
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => analyserSuccession(etat), [etat]);

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Section titre={s.sectionTransmission}>
            <Bascule label={s.donation} indice={s.donationIndice} valeur={etat.donation}
              onChange={(v) => maj('donation', v)} libelleOui={s.oui} libelleNon={s.non} />
            <Curseur label={s.patrimoine} valeur={etat.patrimoine}
              onChange={(v) => maj('patrimoine', v)} min={0} max={5000000} pas={25000} langue={langue} />
            <ChampNombre label={s.beneficiaires} indice={s.beneficiairesIndice}
              valeur={etat.beneficiaires}
              onChange={(v) => maj('beneficiaires', Math.max(1, Math.round(v)))} unite="" pas={1} />
          </Section>

          <Section titre={s.sectionLien} indice={s.sectionLienIndice}>
            <Choix options={Object.keys(LIENS).map((cle) => ({
              valeur: cle, label: s.liens[cle].titre, indice: s.liens[cle].description,
            }))} valeur={etat.lien} onChange={(v) => maj('lien', v)} colonnes={2} />
          </Section>
        </div>

        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={euro(r.impotTotal, langue)}
            sousTexte={interpoler(s.resultatSousTexte, {
              taux: pourcent(r.tauxEffectif, langue),
              net: euro(r.netTotal, langue),
            })}
            accent={r.impotTotal === 0 ? '#06F5F5' : '#EC4899'}
          />

          <Section titre={s.detailTitre} indice={s.detailIndice}>
            <LigneDetail label={s.partParBeneficiaire}
              indice={interpoler(s.partParBeneficiaireIndice, {
                nombre: nombre(r.beneficiaires, langue),
              })}
              valeur={euro(r.partParBeneficiaire, langue)} />
            <LigneDetail label={s.abattement}
              indice={interpoler(s.abattementIndice, { classe: r.classe })}
              valeur={euro(r.abattementBase, langue)} negatif />
            {r.versorgung > 0 && (
              <LigneDetail label={s.versorgung} indice={s.versorgungIndice}
                valeur={euro(r.versorgung, langue)} negatif />
            )}
            <LigneDetail label={s.baseTaxable} valeur={euro(r.baseTaxableParPart, langue)} total />
            <LigneDetail label={s.taux}
              indice={interpoler(s.tauxIndice, { classe: r.classe })}
              valeur={pourcent(r.taux, langue, 0)} />
            <LigneDetail label={s.impotParPart} valeur={euro(r.impotParPart, langue)} negatif />
            <LigneDetail label={s.netParBeneficiaire} valeur={euro(r.netParBeneficiaire, langue)}
              total accent="#06F5F5" />
          </Section>

          {r.gainEtalement > 0 && (
            <Section titre={s.etalementTitre} indice={interpoler(s.etalementIndice, {
              ans: nombre(r.delaiRenouvellement, langue),
            })}>
              <LigneDetail label={s.etalementSans} valeur={euro(r.impotTotal, langue)} />
              <LigneDetail label={s.etalementAvec} valeur={euro(r.impotEtale, langue)} accent="#06F5F5" />
              <LigneDetail label={s.etalementGain} valeur={euro(r.gainEtalement, langue)}
                total accent="#06F5F5" />
            </Section>
          )}

          <ListeAlertes alertes={r.alertes} textes={s.alertes} langue={langue} titre={s.alertesTitre} />

          <BlocCta titre={s.ctaEtiquette} sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton} note={t.step6.ctaFreeNote} t={t}
            resume={{
              patrimoine: etat.patrimoine,
              lien: r.lien,
              donation: r.donation,
              impot: Math.round(r.impotTotal),
              gainEtalement: Math.round(r.gainEtalement),
            }} />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(s.stand, { date: STAND })} />
    </div>
  );
}
