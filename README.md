# Vinlager Manager

MVP til personligt vinlager med login, brugerstyring, registrering, redigering og smagningshistorik.

## Login

- Standard admin-bruger:
  - Brugernavn: `AdminAlbert`
  - Kodeord: `Start123`
- Admin-brugeren kan ændres via profil/admin-sider.

## Sider

- `/login` Simpel login-side
- `/` Dashboard med lager-værdi og fordeling på Vinlager/Kælder
- `/wines` Alle vine + filtrering/sortering/eksport
- `/wines/:id` Vin-detalje + redigering + smagningshistorik
- `/tastings/:id` Detaljeside for en specifik smagning
- `/new` Opret vin + første køb i samme flow + import/bulk upload
- `/profile` Opdater brugernavn, email og kodeord
- `/admin` Brugerstyring (kun admin)

## Nøglefunktioner

- Reelt login med users/session i localStorage (rollebaseret adgang).
- Små landeflag vises på vinkort og detaljeside.
- Hvis land, region eller drue ikke findes i dropdown, kan man vælge “Andet (skriv selv)”.
- Datofelter bruger `type=date`, år felter bruger `type=number`.
- Automatisk flaskestatus: købte minus drukkede flasker.
- Dashboard viser samlet lager værdi og værdi opdelt på Vinlager og Kælder.
- Dashboard viser antal vine opdelt på Vinlager og Kælder.
- Flasker tilbage følger ønsket logik: sum af antal vine i Vinlager og antal vine i Kælder.
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
