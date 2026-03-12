# Vinlager Manager

MVP til personligt vinlager med fokus på hurtig registrering, redigering og smagningshistorik.

## Sider

- `/` Dashboard
- `/wines` Alle vine + filtrering/sortering/eksport
- `/wines/:id` Vin-detalje + redigering + smagningshistorik
- `/new` Opret vin + første køb i samme flow + import/bulk upload

## Nøglefunktioner

- De fleste felter er dropdowns (undtagen navn, producent, appellation, blend og noter).
- Datofelter bruger `type=date`, år felter bruger `type=number`.
- Automatisk flaskestatus: købte minus drukne flasker.
- Smagningsnoter med WSET-inspirerede dropdowns.
- Felt for madparring: Ja/Nej + fritekst ved Ja.
- Bulk upload via importfil + download af importark.
- CSV-eksport af lager fra siden “Alle vine”.
- Land vises med lille rund flagmarkør.

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
