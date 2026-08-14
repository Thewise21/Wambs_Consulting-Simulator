/* ============================================================================
 * Estimateur d'honoraires selon la StBVV.
 * Argument de conversion : le prospect connait le prix AVANT de prendre
 * rendez-vous, et voit que chaque poste repose sur un texte reglementaire.
 * ========================================================================== */
import { useMemo, useState } from 'react';
import { calculerHonoraire, PRESTATIONS, PROFILS_HONORAIRE } from '../calculators/stbvv';
import { STAND } from '../calculators/parameter';
import { euro, pourcent, interpoler } from '../lib/format';
import {
  Section, Choix, ChampNombre, CaseAcocher,
  ResultatPrincipal, LigneDetail, Alerte, BlocCta, Avertissement,
} from '../components/shared/UI';

/* Champ de saisie requis par chaque prestation */
const CHAMPS_REQUIS = {
  einkommensteuer: ['sommeEinkuenfte'],
  anlageV: ['mieteinnahmen'],
  euer: ['jahresumsatz', 'betriebsausgaben'],
  jahresabschluss: ['bilanzsumme', 'jahresumsatz'],
  buchfuehrung: ['jahresumsatz', 'betriebsausgaben'],
  ustVoranmeldung: ['jahresumsatz', 'ustPeriodicite'],
  ustJahreserklaerung: ['jahresumsatz'],
  gewerbesteuer: ['gewerbeertrag'],
  koerperschaftsteuer: ['einkommenKoerperschaft'],
  lohnbuchhaltung: ['nombreSalaries'],
};

const ETAT_INITIAL = {
  profil: 'freiberufler',
  prestations: PROFILS_HONORAIRE.freiberufler,
  sommeEinkuenfte: 60000,
  mieteinnahmen: 12000,
  jahresumsatz: 150000,
  betriebsausgaben: 60000,
  bilanzsumme: 250000,
  gewerbeertrag: 45000,
  einkommenKoerperschaft: 40000,
  nombreSalaries: 3,
  ustPeriodicite: 12,
};

export default function HonorarTool({ t, langue }) {
  const s = t.honorar;
  const [etat, setEtat] = useState(ETAT_INITIAL);

  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const choisirProfil = (profil) => setEtat((prev) => ({
    ...prev,
    profil,
    prestations: PROFILS_HONORAIRE[profil] || [],
  }));

  const basculerPrestation = (cle) => setEtat((prev) => ({
    ...prev,
    prestations: prev.prestations.includes(cle)
      ? prev.prestations.filter((p) => p !== cle)
      : [...prev.prestations, cle],
  }));

  const devis = useMemo(() => calculerHonoraire(etat), [etat]);

  /* Champs a afficher : union des champs requis par les prestations cochees */
  const champsVisibles = useMemo(() => {
    const requis = new Set();
    etat.prestations.forEach((cle) => (CHAMPS_REQUIS[cle] || []).forEach((c) => requis.add(c)));
    return requis;
  }, [etat.prestations]);

  /* Prix par ligne, pour l'afficher directement sur la case a cocher */
  const prixParPrestation = useMemo(() => {
    const table = {};
    Object.keys(PRESTATIONS).forEach((cle) => {
      const d = calculerHonoraire({ ...etat, prestations: [cle] });
      table[cle] = d.lignes[0]?.moyen || 0;
    });
    return table;
  }, [etat]);

  const champ = (nom, pas = 1000) => (
    champsVisibles.has(nom) && (
      <ChampNombre
        key={nom}
        label={s.champs[nom].label}
        indice={s.champs[nom].indice}
        valeur={etat[nom]}
        onChange={(v) => maj(nom, Math.max(0, v))}
        unite={nom === 'nombreSalaries' ? '' : '€'}
        pas={pas}
      />
    )
  );

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* ------------------------------ Saisie ------------------------------ */}
        <div className="space-y-4">
          <Section titre={s.sectionProfil} indice={s.sectionProfilIndice}>
            <Choix
              options={Object.keys(PROFILS_HONORAIRE).map((p) => ({
                valeur: p,
                label: s.profils[p].titre,
                indice: s.profils[p].description,
              }))}
              valeur={etat.profil}
              onChange={choisirProfil}
              colonnes={2}
            />
          </Section>

          <Section titre={s.sectionPrestations} indice={s.sectionPrestationsIndice}>
            <div className="space-y-2">
              {Object.keys(PRESTATIONS).map((cle) => (
                <CaseAcocher
                  key={cle}
                  label={s.prestations[cle].titre}
                  indice={`${PRESTATIONS[cle].paragraphe} · ${s.prestations[cle].description}`}
                  coche={etat.prestations.includes(cle)}
                  onChange={() => basculerPrestation(cle)}
                  marqueur={euro(prixParPrestation[cle], langue)}
                />
              ))}
            </div>
          </Section>

          {champsVisibles.size > 0 && (
            <Section titre={s.sectionChiffres} indice={s.sectionChiffresIndice}>
              {champ('sommeEinkuenfte')}
              {champ('mieteinnahmen')}
              {champ('jahresumsatz', 5000)}
              {champ('betriebsausgaben', 5000)}
              {champ('bilanzsumme', 5000)}
              {champ('gewerbeertrag')}
              {champ('einkommenKoerperschaft')}
              {champ('nombreSalaries', 1)}
              {champsVisibles.has('ustPeriodicite') && (
                <Choix
                  label={s.champs.ustPeriodicite.label}
                  indice={s.champs.ustPeriodicite.indice}
                  options={[
                    { valeur: 12, label: s.mensuelle },
                    { valeur: 4, label: s.trimestrielle },
                  ]}
                  valeur={etat.ustPeriodicite}
                  onChange={(v) => maj('ustPeriodicite', v)}
                  colonnes={2}
                />
              )}
            </Section>
          )}
        </div>

        {/* ----------------------------- Resultat ----------------------------- */}
        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={euro(devis.totaux.moyenTTC, langue)}
            sousTexte={interpoler(s.resultatSousTexte, {
              min: euro(devis.totaux.minTTC, langue),
              max: euro(devis.totaux.maxTTC, langue),
              mois: euro(devis.totaux.moyenMensuelTTC, langue),
            })}
            accent="#FB923C"
          />

          {devis.lignes.length === 0 ? (
            <Alerte niveau="info" titre={s.aucunePrestationTitre} texte={s.aucunePrestationTexte} />
          ) : (
            <Section titre={s.detailTitre} indice={s.detailIndice}>
              {devis.lignes.map((ligne) => (
                <LigneDetail
                  key={ligne.cle}
                  label={s.prestations[ligne.cle].titre}
                  indice={`${ligne.paragraphe} · ${
                    ligne.table
                      ? interpoler(s.baseCalcul, {
                        cadre: ligne.cadre,
                        table: ligne.table,
                        valeur: euro(ligne.gegenstandswert, langue),
                      })
                      : interpoler(s.baseForfait, { cadre: ligne.cadre })
                  }${ligne.mensuel ? ` · ${s.parMois}` : ''}`}
                  valeur={euro(ligne.moyen, langue)}
                />
              ))}
              <LigneDetail
                label={s.sousTotal}
                valeur={euro(devis.totaux.moyen, langue)}
                total
              />
              <LigneDetail label={s.auslagen} indice={s.auslagenIndice} valeur={euro(devis.totaux.auslagen, langue)} />
              <LigneDetail
                label={interpoler(s.tva, { taux: pourcent(devis.tauxTVA, langue, 0) })}
                valeur={euro(devis.totaux.moyenTTC - devis.totaux.moyen - devis.totaux.auslagen, langue)}
              />
              <LigneDetail
                label={s.totalTTC}
                valeur={euro(devis.totaux.moyenTTC, langue)}
                total
                accent="#FB923C"
              />
            </Section>
          )}

          <Alerte niveau="info" titre={s.explicationTitre} texte={s.explicationTexte} reference="§ 11 StBVV" />
          <Alerte niveau="positif" titre={s.pauschalTitre} texte={s.pauschalTexte} reference="§ 14 StBVV" />

          <BlocCta
            titre={s.ctaEtiquette}
            sousTitre={s.ctaTexte}
            libelleBouton={s.ctaBouton}
            note={t.step6.ctaFreeNote}
            t={t}
            resume={{
              profil: etat.profil,
              prestations: etat.prestations,
              jahresumsatz: etat.jahresumsatz,
              honoraireAnnuelTTC: Math.round(devis.totaux.moyenTTC),
            }}
          />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(s.stand, { date: STAND })} />
    </div>
  );
}
