const STORAGE_KEY = 'winecellar.v3';

const OPTIONS = {
  countries: ['Danmark', 'Frankrig', 'Italien', 'Spanien', 'Tyskland', 'USA', 'Argentina', 'Chile', 'Australien', 'Østrig'],
  regions: ['Bordeaux', 'Bourgogne', 'Toscana', 'Piemonte', 'Rioja', 'Mosel', 'Napa Valley', 'Mendoza', 'Barossa Valley', 'Andet'],
  grapes: ['Pinot Noir', 'Syrah', 'Cabernet Sauvignon', 'Merlot', 'Riesling', 'Sauvignon Blanc', 'Chardonnay', 'Nebbiolo', 'Sangiovese', 'Tempranillo'],
  wineTypes: ['Rød', 'Hvid', 'Rosé', 'Mousserende', 'Dessert', 'Orange'],
  locations: ['Vinlager', 'Kælder'],
  currency: ['DKK', 'EUR', 'USD'],
  quality: ['Poor', 'Acceptable', 'Good', 'Very good', 'Outstanding'],
  readiness: ['Too young', 'Ready to drink', 'Past its best'],
  developmentLevel: ['Youthful', 'Developing', 'Fully developed', 'Tired'],
  sweetness: ['Dry', 'Off-dry', 'Medium', 'Sweet'],
  acidity: ['Low', 'Medium', 'High'],
  tannin: ['Low', 'Medium', 'High'],
  body: ['Light', 'Medium', 'Full'],
  aromaIntensity: ['Light', 'Medium', 'Pronounced'],
  flavourIntensity: ['Light', 'Medium', 'Pronounced']
};

const descriptors = [
  ['Rød frugt', 'Frugt'], ['Mørk frugt', 'Frugt'], ['Citrus', 'Frugt'], ['Stenfrugt', 'Frugt'], ['Tørret frugt', 'Frugt'],
  ['Violet', 'Blomst'], ['Roser', 'Blomst'], ['Hvide blomster', 'Blomst'],
  ['Sort peber', 'Krydderi'], ['Kanel', 'Krydderi'], ['Lakrids', 'Krydderi'], ['Urter', 'Krydderi'],
  ['Vanilje', 'Fad'], ['Ristet kaffe', 'Fad'], ['Røg', 'Fad'],
  ['Skovbund', 'Tertiær udvikling'], ['Svamp', 'Tertiær udvikling'], ['Læder', 'Tertiær udvikling'], ['Tobak', 'Tertiær udvikling'], ['Nødder', 'Tertiær udvikling']
].map(([name, category], i) => ({ id: `d${i + 1}`, name, category }));

const countryFlags = {
  Danmark: '🇩🇰', Frankrig: '🇫🇷', Italien: '🇮🇹', Spanien: '🇪🇸', Tyskland: '🇩🇪', USA: '🇺🇸', Argentina: '🇦🇷', Chile: '🇨🇱', Australien: '🇦🇺', Østrig: '🇦🇹'
};

const seed = { wines: [], purchases: [], drinkLogs: [] };
const uid = () => Math.random().toString(36).slice(2, 10);
const byDateDesc = (a, b) => new Date(b.date || b.purchaseDate || 0) - new Date(a.date || a.purchaseDate || 0);

const store = () => {
  try {
    return { ...seed, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return seed;
  }
};
const save = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

function label(text, field) {
  return `<label><span>${text}</span>${field}</label>`;
}
function select(name, options, value = '', required = false) {
  return `<select class="input" name="${name}" ${required ? 'required' : ''}><option value="">Vælg...</option>${options.map((o) => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
}
function input(name, type = 'text', value = '', required = false, min = '') {
  return `<input class="input" name="${name}" type="${type}" value="${value || ''}" ${required ? 'required' : ''} ${min !== '' ? `min="${min}"` : ''}/>`;
}

function pill(path, labelText, active) {
  return `<a href="${path}" class="pill ${active === path ? 'active' : ''}" data-link>${labelText}</a>`;
}
function shell(content, active = '/') {
  return `
    <header class="topbar"><div class="container top-row"><h1>Vinlager Manager</h1><nav>${pill('/', 'Dashboard', active)}${pill('/wines', 'Alle vine', active)}${pill('/new', 'Tilføj data', active)}</nav></div></header>
    <main class="container">${content}</main>
  `;
}

function navigate(path) { history.pushState({}, '', path); render(); }
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-link]');
  if (!a) return;
  e.preventDefault();
  navigate(a.getAttribute('href'));
});
window.addEventListener('popstate', render);

function getWineStats(s, wineId) {
  const purchases = s.purchases.filter((p) => p.wineId === wineId);
  const logs = s.drinkLogs.filter((d) => d.wineId === wineId);
  const bought = purchases.reduce((n, p) => n + Number(p.quantity || 0), 0);
  const consumed = logs.reduce((n, l) => n + Number(l.bottlesConsumed || 0), 0);
  const avgPrice = purchases.length ? purchases.reduce((n, p) => n + Number(p.price || 0), 0) / purchases.length : 0;
  return { bought, consumed, left: bought - consumed, avgPrice };
}

function dashboard(s) {
  const value = s.purchases.reduce((n, p) => n + Number(p.quantity || 0) * Number(p.price || 0), 0);
  const bottlesLeft = s.purchases.reduce((n, p) => n + Number(p.quantity || 0), 0) - s.drinkLogs.reduce((n, l) => n + Number(l.bottlesConsumed || 0), 0);
  const latest = [...s.drinkLogs].sort(byDateDesc).slice(0, 5).map((log) => {
    const w = s.wines.find((wine) => wine.id === log.wineId);
    return `<p>${log.date} · <b>${w ? `${w.producer} ${w.wineName}` : 'Ukendt vin'}</b> · ${log.quality || 'Ingen kvalitet'}</p>`;
  }).join('') || '<p>Ingen smagninger endnu.</p>';

  return shell(`
    <section class="hero card"><h2>Dit personlige vinlager 🍷</h2><p>Overblik over flasker, værdi og smagningsudvikling.</p></section>
    <section class="grid cols3"><article class="card"><small>Antal vine</small><h3>${s.wines.length}</h3></article><article class="card"><small>Flasker tilbage</small><h3>${bottlesLeft}</h3></article><article class="card"><small>Samlet købsværdi</small><h3>${value.toFixed(2)} DKK</h3></article></section>
    <section class="grid cols2"><article class="card"><h3>Seneste smagninger</h3>${latest}</article><article class="card"><h3>Hurtig navigation</h3><a class="btn dark" href="/wines" data-link>Gå til alle vine</a><a class="btn" href="/new" data-link>Opret vin + køb</a></article></section>
  `, '/');
}

function wineCard(s, wine) {
  const stat = getWineStats(s, wine.id);
  const flag = countryFlags[wine.country] || '🏳️';
  return `<a class="card wine-card" href="/wines/${wine.id}" data-link>
    <h3>${wine.producer} · ${wine.wineName}</h3>
    <p><span class="flag">${flag}</span> ${wine.country} · ${wine.region}</p>
    <p>${wine.vintage} · ${wine.wineType} · ${wine.primaryGrape}</p>
    <p>Flasker tilbage: <b>${stat.left}</b></p>
  </a>`;
}

function winesPage() {
  return shell(`
    <section class="card"><h2>Alle vine</h2>
      <div class="grid cols3">
        ${label('Søgning', input('search', 'text'))}
        ${label('Placering', select('location', OPTIONS.locations))}
        ${label('Land', select('country', OPTIONS.countries))}
        ${label('Type', select('wineType', OPTIONS.wineTypes))}
        ${label('Sortering', select('sortBy', ['Årgang stigende', 'Årgang faldende', 'Pris stigende', 'Pris faldende']))}
      </div>
      <div class="row-gap"><button id="exportInventory" class="btn">Eksportér lager (CSV)</button></div>
    </section>
    <section id="wine-list" class="grid cols3"></section>
    <p id="empty" class="muted" style="display:none">Ingen vine matcher filtrene.</p>
  `, '/wines');
}

function tastingPath(logs) {
  return `<div class="timeline-wrap">${logs.map((log, i) => `
    <div class="timeline-item ${i % 2 ? 'right' : 'left'}">
      <div class="dot"></div>
      <div class="timeline-card">
        <h4>Smagning ${i + 1}</h4>
        <p><b>Dato:</b> ${log.date}</p>
        <p><b>Kvalitet:</b> ${log.quality || '-'}</p>
        <p><b>Noter:</b> ${log.notes || '-'}</p>
      </div>
    </div>`).join('')}</div>`;
}

function tastingForm() {
  const dropdownFields = [
    ['quality', 'Kvalitet', OPTIONS.quality], ['readiness', 'Drikkemodenhed', OPTIONS.readiness], ['developmentLevel', 'Udviklingsniveau', OPTIONS.developmentLevel],
    ['sweetness', 'Sødhed', OPTIONS.sweetness], ['acidity', 'Syre', OPTIONS.acidity], ['tannin', 'Tannin', OPTIONS.tannin],
    ['body', 'Krop', OPTIONS.body], ['aromaIntensity', 'Aroma intensitet', OPTIONS.aromaIntensity], ['flavourIntensity', 'Smags intensitet', OPTIONS.flavourIntensity]
  ];
  const byCat = descriptors.reduce((acc, d) => ({ ...acc, [d.category]: [...(acc[d.category] || []), d] }), {});

  return `<form id="logForm" class="card">
    <h3>Log smagning / åbning</h3>
    <div class="grid cols3">
      ${label('Dato', input('date', 'date', new Date().toISOString().slice(0, 10), true))}
      ${label('Antal flasker åbnet', input('bottlesConsumed', 'number', 1, true, 1))}
      ${dropdownFields.map(([name, text, opts]) => label(text, select(name, opts, '', true))).join('')}
    </div>
    ${label('Blev den drukket sammen med mad?', select('withFood', ['Ja', 'Nej'], 'Nej', true))}
    <div id="foodPairingWrap" style="display:none">${label('Hvilket mad var det og hvordan var oplevelsen i sammenspillet?', input('foodPairing', 'text'))}</div>
    <h4>Smagsdeskriptorer</h4>
    ${Object.entries(byCat).map(([cat, list]) => `<div><b>${cat}</b><div class="chips">${list.map((d) => `<label class="chip check-chip"><input type="checkbox" name="descriptors" value="${d.id}"/> ${d.name}</label>`).join('')}</div></div>`).join('')}
    ${label('Frie smagsnoter', `<textarea class="input" name="notes" rows="3"></textarea>`)}
    <button class="btn" type="submit">Gem smagning</button>
  </form>`;
}

function wineDetail(s, id) {
  const wine = s.wines.find((w) => w.id === id);
  if (!wine) return shell('<p>Vin ikke fundet.</p>', '/wines');
  const purchases = s.purchases.filter((p) => p.wineId === id).sort(byDateDesc);
  const logs = s.drinkLogs.filter((l) => l.wineId === id).sort((a, b) => new Date(a.date) - new Date(b.date));
  const stat = getWineStats(s, id);
  const flag = countryFlags[wine.country] || '🏳️';

  return shell(`
    <article class="card"><h2>${wine.producer} — ${wine.wineName}</h2>
      <p><span class="flag">${flag}</span> ${wine.vintage} · ${wine.appellation || 'Ingen appellation'} · ${wine.region}, ${wine.country}</p>
      <p>Vintype: ${wine.wineType} · Primær drue: ${wine.primaryGrape}</p>
      <p>Drikkevindue: ${wine.drinkFrom || '-'} til ${wine.drinkTo || '-'}</p>
      <p>Automatisk flaskestatus: Købt ${stat.bought} · Drukket ${stat.consumed} · <b>Tilbage ${stat.left}</b></p>
      <button class="btn" id="toggleEdit">Redigér vin</button>
      <form id="editWineForm" class="mt" style="display:none">
        <div class="grid cols2">
          ${label('Producent', input('producer', 'text', wine.producer, true))}
          ${label('Vinens navn', input('wineName', 'text', wine.wineName, true))}
          ${label('Årgang', input('vintage', 'number', wine.vintage, true, 1900))}
          ${label('Land', select('country', OPTIONS.countries, wine.country, true))}
          ${label('Region', select('region', OPTIONS.regions, wine.region, true))}
          ${label('Appellation', input('appellation', 'text', wine.appellation || ''))}
          ${label('Primær drue', select('primaryGrape', OPTIONS.grapes, wine.primaryGrape, true))}
          ${label('Vintype', select('wineType', OPTIONS.wineTypes, wine.wineType, true))}
          ${label('Drikkevindue fra', input('drinkFrom', 'number', wine.drinkFrom, false, 1900))}
          ${label('Drikkevindue til', input('drinkTo', 'number', wine.drinkTo, false, 1900))}
        </div>
        ${label('Blend', `<textarea class="input" name="blend" rows="2">${wine.blend || ''}</textarea>`)}
        ${label('Noter', `<textarea class="input" name="notes" rows="3">${wine.notes || ''}</textarea>`)}
        <button class="btn" type="submit">Gem ændringer</button>
      </form>
    </article>

    <section class="grid cols2">
      <article class="card"><h3>Køb & placering</h3>${purchases.length ? purchases.map((p) => `<p>${p.purchaseDate} · ${p.quantity} flasker · ${p.location} · ${p.price} ${p.currency}</p>`).join('') : '<p>Ingen køb registreret.</p>'}</article>
      <article class="card"><h3>Smagningshistorik</h3>${logs.length ? tastingPath(logs) : '<p>Ingen smagninger endnu.</p>'}</article>
    </section>

    ${tastingForm()}
  `, '/wines');
}

function newPage() {
  return shell(`
    <section class="card">
      <h2>Opret vin + første køb</h2>
      <form id="createWineForm">
        <div class="grid cols2">
          ${label('Producent', input('producer', 'text', '', true))}
          ${label('Vinens navn', input('wineName', 'text', '', true))}
          ${label('Årgang', input('vintage', 'number', '', true, 1900))}
          ${label('Land', select('country', OPTIONS.countries, '', true))}
          ${label('Region', select('region', OPTIONS.regions, '', true))}
          ${label('Appellation', input('appellation'))}
          ${label('Primær drue', select('primaryGrape', OPTIONS.grapes, '', true))}
          ${label('Vintype', select('wineType', OPTIONS.wineTypes, '', true))}
          ${label('Drikkevindue fra (år)', input('drinkFrom', 'number', '', false, 1900))}
          ${label('Drikkevindue til (år)', input('drinkTo', 'number', '', false, 1900))}
          ${label('Købsdato', input('purchaseDate', 'date', '', true))}
          ${label('Antal flasker', input('quantity', 'number', 1, true, 1))}
          ${label('Pris per flaske', input('price', 'number', 0, true, 0))}
          ${label('Valuta', select('currency', OPTIONS.currency, 'DKK', true))}
          ${label('Forhandler', input('retailer', 'text'))}
          ${label('Placering', select('location', OPTIONS.locations, 'Vinlager', true))}
        </div>
        ${label('Blend', `<textarea class="input" name="blend" rows="2"></textarea>`)}
        ${label('Generelle noter', `<textarea class="input" name="notes" rows="3"></textarea>`)}
        <button class="btn" type="submit">Gem vin og køb</button>
      </form>
    </section>

    <section class="card">
      <h3>Import / bulk upload</h3>
      <p>Download importark og upload CSV/XLS (XLS læses som semikolon/komma-separeret tekst).</p>
      <div class="row-gap">
        <button class="btn" id="downloadXls">Download Excel</button>
        <button class="btn dark" id="downloadCsv">Download CSV</button>
        <input id="bulkFile" type="file" accept=".csv,.xls,.xlsx" class="input" />
        <button class="btn" id="uploadBulk">Upload bulk fil</button>
      </div>
      <p id="uploadStatus" class="muted"></p>
    </section>
  `, '/new');
}

function exportInventoryCsv(s) {
  const header = ['producer','wine_name','vintage','country','region','appellation','primary_grape','wine_type','bottles_left','avg_price'];
  const rows = s.wines.map((w) => {
    const stat = getWineStats(s, w.id);
    return [w.producer, w.wineName, w.vintage, w.country, w.region, w.appellation, w.primaryGrape, w.wineType, stat.left, stat.avgPrice.toFixed(2)].join(',');
  });
  dl('lager_export.csv', [header.join(','), ...rows].join('\n'));
}

function dl(name, content, type = 'text/csv') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}

function parseBulk(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const split = (line) => line.split(line.includes(';') ? ';' : ',').map((v) => v.trim());
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const idx = (name) => header.indexOf(name);
  return lines.slice(1).map((line) => {
    const c = split(line);
    return {
      producer: c[idx('producer')] || '', wineName: c[idx('wine_name')] || '', vintage: c[idx('vintage')] || '', country: c[idx('country')] || '',
      region: c[idx('region')] || '', appellation: c[idx('appellation')] || '', primaryGrape: c[idx('primary_grape')] || '', blend: c[idx('blend')] || '',
      wineType: c[idx('wine_type')] || '', drinkFrom: c[idx('drink_from')] || '', drinkTo: c[idx('drink_to')] || '', notes: c[idx('notes')] || '',
      purchaseDate: c[idx('purchase_date')] || '', quantity: Number(c[idx('quantity')] || 0), price: Number(c[idx('price')] || 0), currency: c[idx('currency')] || 'DKK', retailer: c[idx('retailer')] || '', location: c[idx('location')] || 'Vinlager'
    };
  }).filter((r) => r.producer && r.wineName);
}

function attachHandlers(path, s) {
  if (path === '/wines') {
    const list = document.getElementById('wine-list');
    const empty = document.getElementById('empty');
    const controls = ['search', 'location', 'country', 'wineType', 'sortBy'].map((name) => document.querySelector(`[name="${name}"]`));

    const renderList = () => {
      const search = (document.querySelector('[name="search"]').value || '').toLowerCase();
      const location = document.querySelector('[name="location"]').value;
      const country = document.querySelector('[name="country"]').value;
      const wineType = document.querySelector('[name="wineType"]').value;
      const sortBy = document.querySelector('[name="sortBy"]').value;

      const filtered = s.wines.filter((w) => {
        const text = `${w.producer} ${w.wineName} ${w.region} ${w.country} ${w.primaryGrape} ${w.vintage}`.toLowerCase();
        if (search && !text.includes(search)) return false;
        if (country && w.country !== country) return false;
        if (wineType && w.wineType !== wineType) return false;
        if (location) {
          const hasLoc = s.purchases.some((p) => p.wineId === w.id && p.location === location);
          if (!hasLoc) return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        const aStat = getWineStats(s, a.id);
        const bStat = getWineStats(s, b.id);
        if (sortBy === 'Årgang stigende') return Number(a.vintage || 0) - Number(b.vintage || 0);
        if (sortBy === 'Årgang faldende') return Number(b.vintage || 0) - Number(a.vintage || 0);
        if (sortBy === 'Pris stigende') return aStat.avgPrice - bStat.avgPrice;
        if (sortBy === 'Pris faldende') return bStat.avgPrice - aStat.avgPrice;
        return 0;
      });

      list.innerHTML = filtered.map((w) => wineCard(s, w)).join('');
      empty.style.display = filtered.length ? 'none' : 'block';
    };

    controls.forEach((c) => c.oninput = renderList);
    renderList();
    document.getElementById('exportInventory').onclick = () => exportInventoryCsv(s);
  }

  if (path.startsWith('/wines/')) {
    const wineId = path.split('/')[2];

    const toggle = document.getElementById('toggleEdit');
    const editForm = document.getElementById('editWineForm');
    if (toggle && editForm) toggle.onclick = () => editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';

    if (editForm) editForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(editForm);
      const next = store();
      const i = next.wines.findIndex((w) => w.id === wineId);
      if (i < 0) return;
      next.wines[i] = { ...next.wines[i], ...Object.fromEntries(fd.entries()) };
      save(next);
      render();
    };

    const form = document.getElementById('logForm');
    if (form) {
      const withFood = form.querySelector('[name="withFood"]');
      const pairing = document.getElementById('foodPairingWrap');
      const toggleFood = () => pairing.style.display = withFood.value === 'Ja' ? 'block' : 'none';
      withFood.onchange = toggleFood;
      toggleFood();

      form.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const next = store();
        next.drinkLogs.push({
          id: uid(), wineId,
          date: fd.get('date'),
          bottlesConsumed: Number(fd.get('bottlesConsumed') || 0),
          quality: fd.get('quality'), readiness: fd.get('readiness'), developmentLevel: fd.get('developmentLevel'),
          sweetness: fd.get('sweetness'), acidity: fd.get('acidity'), tannin: fd.get('tannin'), body: fd.get('body'),
          aromaIntensity: fd.get('aromaIntensity'), flavourIntensity: fd.get('flavourIntensity'),
          withFood: fd.get('withFood'), foodPairing: fd.get('foodPairing') || '',
          notes: fd.get('notes') || '', descriptorIds: fd.getAll('descriptors')
        });
        save(next); render();
      };
    }
  }

  if (path === '/new') {
    document.getElementById('createWineForm').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const v = Object.fromEntries(fd.entries());
      const id = uid();
      const next = store();
      next.wines.push({
        id, producer: v.producer, wineName: v.wineName, vintage: v.vintage, country: v.country, region: v.region, appellation: v.appellation, primaryGrape: v.primaryGrape,
        blend: v.blend, wineType: v.wineType, drinkFrom: v.drinkFrom, drinkTo: v.drinkTo, notes: v.notes
      });
      next.purchases.push({
        id: uid(), wineId: id, purchaseDate: v.purchaseDate, quantity: Number(v.quantity), price: Number(v.price), currency: v.currency, retailer: v.retailer, location: v.location
      });
      save(next);
      navigate(`/wines/${id}`);
    };

    document.getElementById('downloadCsv').onclick = () => dl('wine_import_template.csv', 'producer,wine_name,vintage,country,region,appellation,primary_grape,blend,wine_type,drink_from,drink_to,notes,purchase_date,quantity,price,currency,retailer,location');
    document.getElementById('downloadXls').onclick = () => dl('wine_import_template.xls', '<table><tr><th>producer</th><th>wine_name</th><th>vintage</th><th>country</th><th>region</th><th>appellation</th><th>primary_grape</th><th>blend</th><th>wine_type</th><th>drink_from</th><th>drink_to</th><th>notes</th><th>purchase_date</th><th>quantity</th><th>price</th><th>currency</th><th>retailer</th><th>location</th></tr></table>', 'application/vnd.ms-excel');

    document.getElementById('uploadBulk').onclick = async () => {
      const file = document.getElementById('bulkFile').files[0];
      const status = document.getElementById('uploadStatus');
      if (!file) {
        status.textContent = 'Vælg en fil først.';
        return;
      }
      const text = await file.text();
      const rows = parseBulk(text);
      if (!rows.length) {
        status.textContent = 'Ingen gyldige rækker fundet.';
        return;
      }
      const next = store();
      rows.forEach((r) => {
        const wineId = uid();
        next.wines.push({ id: wineId, producer: r.producer, wineName: r.wineName, vintage: r.vintage, country: r.country, region: r.region, appellation: r.appellation, primaryGrape: r.primaryGrape, blend: r.blend, wineType: r.wineType, drinkFrom: r.drinkFrom, drinkTo: r.drinkTo, notes: r.notes });
        if (r.quantity > 0) next.purchases.push({ id: uid(), wineId, purchaseDate: r.purchaseDate, quantity: r.quantity, price: r.price, currency: r.currency, retailer: r.retailer, location: r.location });
      });
      save(next);
      status.textContent = `${rows.length} vin(e) blev importeret.`;
    };
  }
}

function render() {
  const s = store();
  const path = location.pathname;
  let html = '';
  if (path === '/') html = dashboard(s);
  else if (path === '/wines') html = winesPage();
  else if (path.startsWith('/wines/')) html = wineDetail(s, path.split('/')[2]);
  else if (path === '/new') html = newPage();
  else html = shell('<p>Side ikke fundet.</p>');
  document.getElementById('app').innerHTML = html;
  attachHandlers(path, s);
}

render();
