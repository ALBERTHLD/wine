# Vinlager Manager

MVP til personligt vinlager med login, registrering, redigering og smagningshistorik.

## Sider

- `/login` Simpel login-side
- `/` Dashboard med lager-værdi og fordeling på Vinlager/Kælder
- `/wines` Alle vine + filtrering/sortering/eksport
- `/wines/:id` Vin-detalje + redigering + smagningshistorik
- `/tastings/:id` Detaljeside for en specifik smagning
- `/new` Opret vin + første køb i samme flow + import/bulk upload

## Nøglefunktioner

- Små landeflag vises på vinkort og detaljeside.
- Hvis land, region eller drue ikke findes i dropdown, kan man vælge “Andet (skriv selv)”.
- Datofelter bruger `type=date`, år felter bruger `type=number`.
- Automatisk flaskestatus: købte minus drukkede flasker.
- Dashboard viser samlet lager værdi og værdi opdelt på Vinlager og Kælder.
- Dashboard viser antal vine opdelt på Vinlager og Kælder.
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
