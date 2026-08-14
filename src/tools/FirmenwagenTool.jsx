/* ============================================================================
 * Vehicule de fonction : forfait de 1 % contre carnet de bord.
 * Le chiffre qui interesse le salarie n'est pas l'avantage en nature mais ce
 * que la voiture lui coute reellement chaque mois sur sa fiche de paie.
 * ========================================================================== */
import { useMemo, useState } from 'react';
import { calculerFirmenwagen, MOTORISATIONS } from '../calculators/firmenwagen';
import { STEUERKLASSEN } from '../calculators/bruttoNetto';
import { BUNDESLAENDER, STAND, ANNEE_DEFAUT } from '../calculators/parameter';
import { euro, pourcent, nombre, interpoler } from '../lib/format';
import {
  Section, Curseur, Choix, Bascule, ChampNombre,
  ResultatPrincipal, LigneDetail, Alerte, BlocCta, Avertissement,
} from '../components/shared/UI';

const ETAT_INITIAL = {
  bruttolistenpreis: 50000,
  motorisation: 'elektro',
  anschaffungRecente: true,
  distanceTravail: 20,
  joursTravailles: 220,
  bruttoAnnuel: 60000,
  klasse: 'I',
  bundesland: 'BE',
  kirchenmitglied: false,
  carnetActif: false,
  coutAnnuelVehicule: 9000,
  kmTotal: 30000,
  kmPrives: 5000,
  annee: ANNEE_DEFAUT,
};

export default function FirmenwagenTool({ t, langue }) {
  const s = t.firmenwagen;
  const [etat, setEtat] = useState(ETAT_INITIAL);

  const maj = (champ, valeur) => setEtat((prev) => ({ ...prev, [champ]: valeur }));

  const r = useMemo(() => calculerFirmenwagen({
    bruttolistenpreis: etat.bruttolistenpreis,
    motorisation: etat.motorisation,
    anschaffungRecente: etat.anschaffungRecente,
    distanceTravail: etat.distanceTravail,
    joursTravailles: etat.joursTravailles,
    bruttoAnnuel: etat.bruttoAnnuel,
    klasse: etat.klasse,
    bundesland: etat.bundesland,
    kirchenmitglied: etat.kirchenmitglied,
    coutAnnuelVehicule: etat.carnetActif ? etat.coutAnnuelVehicule : 0,
    kmTotal: etat.carnetActif ? etat.kmTotal : 0,
    kmPrives: etat.carnetActif ? etat.kmPrives : 0,
    annee: etat.annee,
  }), [etat]);

  const retenue = r.meilleureMethode === 'carnet' ? r.carnet : r.forfait;
  const accent = r.meilleureMethode === 'carnet' ? '#A855F7' : '#FB923C';

  return (
    <div className="step-enter space-y-5 sm:space-y-6">
      <header>
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient">{s.titre}</h2>
        <p className="text-xs sm:text-sm text-wambs-muted mt-1">{s.sousTitre}</p>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* ------------------------------ Saisie ------------------------------ */}
        <div className="space-y-4">
          <Section titre={s.sectionVehicule} indice={s.sectionVehiculeIndice}>
            <Curseur
              label={s.bruttolistenpreis}
              valeur={etat.bruttolistenpreis}
              onChange={(v) => maj('bruttolistenpreis', v)}
              min={10000}
              max={200000}
              pas={1000}
              langue={langue}
            />
            <Choix
              label={s.motorisation}
              options={MOTORISATIONS.map((m) => ({
                valeur: m,
                label: s.motorisations[m].titre,
                indice: s.motorisations[m].description,
              }))}
              valeur={etat.motorisation}
              onChange={(v) => maj('motorisation', v)}
              colonnes={3}
            />
            {etat.motorisation === 'elektro' && (
              <Bascule
                label={s.anschaffungRecente}
                indice={s.anschaffungRecenteIndice}
                valeur={etat.anschaffungRecente}
                onChange={(v) => maj('anschaffungRecente', v)}
                libelleOui={s.oui}
                libelleNon={s.non}
              />
            )}
          </Section>

          <Section titre={s.sectionTrajets}>
            <ChampNombre
              label={s.distanceTravail}
              indice={s.distanceTravailIndice}
              valeur={etat.distanceTravail}
              onChange={(v) => maj('distanceTravail', Math.max(0, v))}
              unite="km"
              pas={1}
            />
            <ChampNombre
              label={s.joursTravailles}
              indice={s.joursTravaillesIndice}
              valeur={etat.joursTravailles}
              onChange={(v) => maj('joursTravailles', Math.max(0, Math.min(365, v)))}
              unite=""
              pas={5}
            />
          </Section>

          <Section titre={s.sectionSalaire} indice={s.sectionSalaireIndice}>
            <Curseur
              label={s.bruttoAnnuel}
              valeur={etat.bruttoAnnuel}
              onChange={(v) => maj('bruttoAnnuel', v)}
              min={15000}
              max={200000}
              pas={1000}
              langue={langue}
            />
            <Choix
              label={s.steuerklasse}
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
                  <option key={code} value={code}>{t.bn.laender[code] || code}</option>
                ))}
              </select>
            </div>
            <Bascule
              label={s.kirchensteuer}
              valeur={etat.kirchenmitglied}
              onChange={(v) => maj('kirchenmitglied', v)}
              libelleOui={s.oui}
              libelleNon={s.non}
            />
          </Section>

          <Section titre={s.sectionCarnet} indice={s.sectionCarnetIndice}>
            <Bascule
              label={s.carnetActif}
              indice={s.carnetActifIndice}
              valeur={etat.carnetActif}
              onChange={(v) => maj('carnetActif', v)}
              libelleOui={s.oui}
              libelleNon={s.non}
            />
            {etat.carnetActif && (
              <>
                <ChampNombre
                  label={s.coutAnnuelVehicule}
                  indice={s.coutAnnuelVehiculeIndice}
                  valeur={etat.coutAnnuelVehicule}
                  onChange={(v) => maj('coutAnnuelVehicule', Math.max(0, v))}
                  pas={500}
                />
                <ChampNombre
                  label={s.kmTotal}
                  valeur={etat.kmTotal}
                  onChange={(v) => maj('kmTotal', Math.max(0, v))}
                  unite="km"
                  pas={1000}
                />
                <ChampNombre
                  label={s.kmPrives}
                  indice={s.kmPrivesIndice}
                  valeur={etat.kmPrives}
                  onChange={(v) => maj('kmPrives', Math.max(0, v))}
                  unite="km"
                  pas={500}
                />
              </>
            )}
          </Section>
        </div>

        {/* ----------------------------- Resultat ----------------------------- */}
        <div className="space-y-4">
          <ResultatPrincipal
            etiquette={s.resultatEtiquette}
            montant={euro(retenue.coutMensuel, langue)}
            sousTexte={interpoler(s.resultatSousTexte, {
              annuel: euro(retenue.coutAnnuel, langue),
              methode: s.methodes[r.meilleureMethode],
            })}
            accent={accent}
          />

          {/* Les deux methodes cote a cote */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { cle: 'forfait', donnees: r.forfait, couleur: '#FB923C', actif: true },
              { cle: 'carnet', donnees: r.carnet, couleur: '#A855F7', actif: r.carnetExploitable },
            ].map(({ cle, donnees, couleur, actif }) => (
              <div
                key={cle}
                className={`bg-wambs-panel border rounded-lg p-3 sm:p-4 ${
                  actif && r.meilleureMethode === cle ? 'selected-card' : 'border-wambs-border'
                } ${actif ? '' : 'opacity-50'}`}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: couleur }}>
                  {s.methodes[cle]}
                </p>
                {actif ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between gap-1">
                      <span className="text-wambs-muted">{s.avantageEnNature}</span>
                      <span className="font-data text-wambs-text">{euro(donnees.avantage.total, langue)}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-wambs-muted">{s.impotsEtCotisations}</span>
                      <span className="font-data text-wambs-text">{euro(donnees.coutAnnuel, langue)}</span>
                    </div>
                    <div className="flex justify-between gap-1 pt-1.5 mt-1.5 border-t border-wambs-border">
                      <span className="text-wambs-text font-medium">{s.parMois}</span>
                      <span className="font-data font-semibold" style={{ color: couleur }}>
                        {euro(donnees.coutMensuel, langue)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-wambs-muted leading-relaxed">{s.carnetInactif}</p>
                )}
              </div>
            ))}
          </div>

          <Section titre={s.detailTitre}>
            <LigneDetail
              label={s.assiette}
              indice={interpoler(s.assietteIndice, { part: pourcent(r.base.part, langue, 0) })}
              valeur={euro(r.base.assiette, langue)}
            />
            <LigneDetail label={s.usagePrive} valeur={euro(r.forfait.avantage.usagePrive, langue)} />
            <LigneDetail
              label={s.trajetsTravail}
              indice={interpoler(s.trajetsTravailIndice, { km: nombre(etat.distanceTravail, langue) })}
              valeur={euro(r.forfait.avantage.trajetsTravail, langue)}
            />
            <LigneDetail label={s.avantageTotal} valeur={euro(r.forfait.avantage.total, langue)} total />
            <div className="mt-2 pt-2 border-t border-wambs-border">
              <LigneDetail label={s.impotsSupplementaires} valeur={euro(r.forfait.impotsSupplementaires, langue)} negatif />
              <LigneDetail label={s.cotisationsSupplementaires} valeur={euro(r.forfait.cotisationsSupplementaires, langue)} negatif />
              <LigneDetail
                label={s.coutReel}
                indice={interpoler(s.coutReelIndice, { taux: pourcent(r.forfait.tauxCharge, langue) })}
                valeur={euro(r.forfait.coutAnnuel, langue)}
                total
                accent="#FB923C"
              />
            </div>
          </Section>

          {r.comparaisonThermique && r.comparaisonThermique.economie > 0 && (
            <Alerte
              niveau="positif"
              titre={interpoler(s.economieElectrique.titre, {
                montant: euro(r.comparaisonThermique.economie, langue),
              })}
              texte={interpoler(s.economieElectrique.texte, {
                thermique: euro(r.comparaisonThermique.coutAnnuel / 12, langue),
                actuel: euro(r.forfait.coutMensuel, langue),
              })}
              reference="§ 6 Abs. 1 Nr. 4 EStG"
            />
          )}

          {/* Points de vigilance */}
          <div className="space-y-2.5">
            {r.alertes.map((alerte) => {
              const modele = s.alertes[alerte.cle];
              if (!modele) return null;
              const valeurs = {
                ...alerte.params,
                montant: alerte.params.montant !== undefined ? euro(alerte.params.montant, langue) : '',
                plafond: alerte.params.plafond !== undefined ? euro(alerte.params.plafond, langue) : '',
                jours: alerte.params.jours,
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
              prixCatalogue: etat.bruttolistenpreis,
              motorisation: etat.motorisation,
              methodeRetenue: r.meilleureMethode,
              coutMensuel: Math.round(retenue.coutMensuel),
              economieElectrique: Math.round(r.comparaisonThermique?.economie || 0),
            }}
          />
        </div>
      </div>

      <Avertissement texte={s.avertissement} stand={interpoler(t.bn.stand, { date: STAND, annee: etat.annee })} />
    </div>
  );
}
