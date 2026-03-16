# Vinlager Manager

Vinlager Manager er en SPA med tydelig datamodel (`Wine`, `Purchase`, `InventoryEvent`) og fokus på hurtig manuel oprettelse, korrekt købshåndtering og beslutningsstøtte på dashboard.

## Datamodel

- **Wine**: stamdata for unik vin (producent, navn, årgang m.m.).
- **Purchase**: transaktioner knyttet til eksisterende vin.
- **InventoryEvent**: lagerhændelser (`purchase`, `add`, `remove`, `archive`, `reactivate`).

## Login og roller

- Standard admin: `AdminAlbert` / `Start123`.
- Admin bruges til brugerstyring på `/admin`.
- Nye brugere oprettes med email og skal verificere email før login.

## Sider

- `/login` login + registrering + email-verifikation
- `/` dashboard og analyser
- `/wines` alle vine med filtre/sortering
- `/wines/:id` detaljeside
- `/wines/:id/edit` dedikeret redigeringsside med lagerregulering
- `/tastings/:id` smagningsdetaljer
- `/new` opret vin + første køb + import/eksport
- `/profile` profilopdatering
- `/admin` brugerstyring

## Centrale funktioner

- Dedup på `producent + vinens navn + årgang` ved nyt køb.
- Flere køb af samme vin opretter nyt køb (ikke ny vinpost).
- Lagerregulering (tilføj/fjern) med validering + historik.
- Soft-delete via status (`aktiv`/`ude`) med reaktivering.
- Intern drikkevindue-regelmotor med 1.5x skalerede regler.
- WSET Level 2-orienteret smagning:
  - quality, sweetness, acidity, tannin, alcohol, body, aroma intensity, flavour intensity, finish
  - development level
  - descriptor-struktur: primær/sekundær/tertiær
- Dashboard-analyser inkl. “Klar til at drikke nu/løbende” og “Seneste smagning”.
- Import preview med validering, fejlrapport og resumetal.
- CSV/XLSX template + import og eksport (fra opret/import-sektionen).

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
