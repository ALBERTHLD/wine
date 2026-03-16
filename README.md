# Vinlager Manager

MVP til personligt vinlager med login, email-verifikation, brugerstyring, registrering, redigering og smagningshistorik.

## Login og roller

- Standard admin-bruger:
  - Brugernavn: `AdminAlbert`
  - Kodeord: `Start123`
- Admin-kontoen er dedikeret til brugerstyring på `/admin`.
- Nye brugere oprettes med email, og email skal verificeres før login.

## Sider

- `/login` Login + opret bruger + email-verifikation
- `/` Dashboard (for almindelige brugere)
- `/wines` Alle vine + filtrering/sortering/eksport
- `/wines/:id` Vin-detalje + redigering + smagningshistorik
- `/tastings/:id` Detaljeside for en specifik smagning
- `/new` Opret vin + første køb i samme flow + import/bulk upload
- `/profile` Opdater brugernavn, email og kodeord
- `/admin` Brugerstyring (kun admin)

## Nøglefunktioner

- Rollebaseret login med users/session i localStorage.
- Små landeflag vises på vinkort og detaljeside.
- Hvis land, region eller drue ikke findes i dropdown, kan man vælge “Andet (skriv selv)”.
- Datofelter bruger `type=date`, år felter bruger `type=number`.
- Dashboard KPI:
  - Flasker i Vinlager
  - Flasker i Kælder
  - Flasker tilbage = sum af de to ovenfor
- “Flasker der snart bør drikkes” med markering:
  - `Drik nu` (rød)
  - `Drik løbende` (orange)
  - `For ung` (grøn)
- Smagningshistorik kan klikkes, så hver smagning åbnes på egen detaljeside.
- Bulk upload via importfil + download af importark.
- CSV-eksport af lager fra siden “Alle vine”.

## Kør lokalt

```bash
npm run dev
```

Åbn derefter `http://localhost:4173`.

## Checks

```bash
npm run check
npm run build
```
