# Vinlager Manager

En levende MVP-webapp til personligt vinlager med disse flows:

- Dashboard (`/`)
- Alle vine (`/wines`)
- Vinside (`/wines/[id]` via client-side route `/wines/:id`)
- Opret data (`/new`)

## Understøttet i MVP

- Opret vin med centrale metadata
- Flere køb pr. vin inkl. placering (Vinlager/Kælder)
- Automatisk flaskestatus (købt minus drukket)
- Smagningslog med struktur, kvalitet, modenhed og udviklingsniveau
- Smagsnoter i tre lag: struktur, deskriptorer, fri tekst
- Druebaserede noteforslag + håndtering af ukendte druer
- Søgning i alle vine
- Dashboard med nøgletal og seneste smagninger
- Download af importskabelon i CSV/Excel-kompatibel format

## Kør lokalt

```bash
npm run dev
```

Åbn derefter `http://localhost:4173`.

## Build/check

```bash
npm run check
npm run build
```
