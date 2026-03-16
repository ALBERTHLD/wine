# Vinlager Manager

Vinlager Manager er en SPA med tydelig datamodel (`Wine`, `Purchase`, `InventoryEvent`) og fokus på hurtig oprettelse, korrekt købshåndtering og stærkere dashboard-analyser.

## Datamodel

- **Wine**: stamdata for unik vin (producent, navn, årgang m.m.).
- **Purchase**: transaktioner knyttet til eksisterende vin.
- **InventoryEvent**: lagerhændelser (`purchase`, `add`, `remove`, `archive`, `reactivate`).

## Auth og roller

- Standard admin: `AdminAlbert` / `Start123`.
- Admin bruges primært til brugerstyring på `/admin`.
- Nye brugere oprettes med email og skal verificere email før login.

## Sider

- `/login` login + registrering + email-verifikation
- `/` dashboard og analyser
- `/wines` alle vine med filtre/sortering
- `/wines/:id` detaljeside
- `/wines/:id/edit` dedikeret redigeringsside med lagerregulering
- `/tastings/:id` smagningsdetaljer
- `/new` opret vin + første køb + scan etiket + import preview
- `/profile` profilopdatering
- `/admin` brugerstyring

## Centrale funktioner

- Dedup på `producent + vinens navn + årgang` ved nyt køb.
- Flere køb af samme vin opretter nyt køb (ikke ny vinpost).
- Lagerregulering (tilføj/fjern) med validering + historik.
- Soft-delete via status (`aktiv`/`ude`) med reaktivering.
- Drikkevindue-regelmotor (intern, transparent) med forslag direkte i formular.
- “Scan etiket” via provider-adapterlag (valgfri integration, non-blocking fallback).
- Nye felter: `flaskevolumen_ml`, `emballagestatus`.
- Dashboard med analyser:
  - flasker pr. vintype
  - flasker pr. land
  - værdi pr. placering
  - statusbar (klar nu / for tidlig / over vindue / ukendt)
  - flasker pr. volumen
  - vine pr. emballage
  - klar til at drikke nu/løbende
  - lav beholdning
  - seneste køb
- Import preview med validering, fejlrapport og resumetal.
- Eksport af aktive/alle vine i CSV og XLSX-kompatibel fil.

## Importkolonner (template)

`producent, vinens_navn, årgang, land, region, appellation, primær_drue, vintype, antal_flasker, pris_per_flaske, placering, drikkevindue_fra, drikkevindue_til, købsdato, valuta, forhandler, flaskevolumen_ml, emballagestatus, blend, generelle_noter, status`

## Kør lokalt

```bash
npm run dev
```

## Checks

```bash
npm run check
npm run build
```
