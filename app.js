const STORAGE_KEY = 'winecellar.v4';
const SESSION_KEY = 'winecellar.session';

const OPTIONS = {
  countries: ['Danmark', 'Frankrig', 'Italien', 'Spanien', 'Tyskland', 'USA', 'Argentina', 'Chile', 'Australien', 'Østrig'],
  regions: ['Bordeaux', 'Bourgogne', 'Toscana', 'Piemonte', 'Rioja', 'Mosel', 'Napa Valley', 'Mendoza', 'Barossa Valley'],
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

const store = () => {
  try { return { ...seed, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return seed; }
};
const save = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

const session = () => localStorage.getItem(SESSION_KEY);
const setSession = (username) => localStorage.setItem(SESSION_KEY, username);
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const money = (n) => `${Number(n || 0).toFixed(2)} DKK`;
const label = (text, field) => `<label><span>${text}</span>${field}</label>`;
const input = (name, type = 'text', value = '', required = false, min = '') => `<input class="input" name="${name}" type="${type}" value="${value || ''}" ${required ? 'required' : ''} ${min !== '' ? `min="${min}"` : ''}/>`;
const select = (name, options, value = '', required = false, extra = []) => `<select class="input" name="${name}" ${required ? 'required' : ''}><option value="">Vælg...</option>${options.map((o) => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('')}${extra.map((x) => `<option value="${x}" ${x === value ? 'selected' : ''}>${x}</option>`).join('')}</select>`;

function pill(path, text, active) {
  return `<a href="${path}" class="pill ${active === path ? 'active' : ''}" data-link>${text}</a>`;
}

function shell(content, active = '/') {
  return `
    <header class="topbar"><div class="container top-row"><h1>Vinlager Manager</h1><nav>${pill('/', 'Dashboard', active)}${pill('/wines', 'Alle vine', active)}${pill('/new', 'Tilføj data', active)}<button class="pill" id="logoutBtn">Log ud</button></nav></div></header>
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

function purchaseBuckets(s, wineId) {
  const logs = s.drinkLogs.filter((d) => d.wineId === wineId);
  let consumed = logs.reduce((n, l) => n + Number(l.bottlesConsumed || 0), 0);
  const purchases = [...s.purchases.filter((p) => p.wineId === wineId)].sort((a, b) => new Date(a.purchaseDate || 0) - new Date(b.purchaseDate || 0));
  return purchases.map((p) => {
    const qty = Number(p.quantity || 0);
    const used = Math.min(qty, consumed);
    consumed -= used;
    return { ...p, qtyLeft: qty - used };
  });
}

function getWineStats(s, wineId) {
  const buckets = purchaseBuckets(s, wineId);
  const bought = buckets.reduce((n, p) => n + Number(p.quantity || 0), 0);
  const left = buckets.reduce((n, p) => n + Number(p.qtyLeft || 0), 0);
  const consumed = bought - left;
  const avgPrice = buckets.length ? buckets.reduce((n, p) => n + Number(p.price || 0), 0) / buckets.length : 0;
  const inventoryValue = buckets.reduce((n, p) => n + Number(p.qtyLeft || 0) * Number(p.price || 0), 0);
  return { bought, consumed, left, avgPrice, inventoryValue, buckets };
}

function aggregateDashboard(s) {
  const totals = { bottlesLeft: 0, inventoryValue: 0, cellarValue: 0, storageValue: 0, winesInCellar: new Set(), winesInStorage: new Set() };
  s.wines.forEach((w) => {
    const st = getWineStats(s, w.id);
    totals.bottlesLeft += st.left;
    totals.inventoryValue += st.inventoryValue;
    st.buckets.forEach((b) => {
      const locValue = Number(b.qtyLeft || 0) * Number(b.price || 0);
      if (b.location === 'Kælder') {
        totals.cellarValue += locValue;
        if (b.qtyLeft > 0) totals.winesInCellar.add(w.id);
      }
      if (b.location === 'Vinlager') {
        totals.storageValue += locValue;
        if (b.qtyLeft > 0) totals.winesInStorage.add(w.id);
      }
    });
  });
  return totals;
}

function dashboard(s) {
  const agg = aggregateDashboard(s);
  const latest = [...s.drinkLogs].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5)
    .map((log) => {
      const w = s.wines.find((x) => x.id === log.wineId);
      return `<p><a href="/tastings/${log.id}" data-link>${log.date} · ${w ? `${w.producer} ${w.wineName}` : 'Ukendt vin'}</a></p>`;
    }).join('') || '<p>Ingen smagninger endnu.</p>';

  return shell(`
    <section class="hero card"><h2>Dit personlige vinlager 🍷</h2><p>Overblik over flasker, lager-værdi og smagningsudvikling.</p></section>
    <section class="grid cols3">
      <article class="card"><small>Antal vine i Vinlager</small><h3>${agg.winesInStorage.size}</h3></article>
      <article class="card"><small>Antal vine i Kælder</small><h3>${agg.winesInCellar.size}</h3></article>
      <article class="card"><small>Flasker tilbage</small><h3>${agg.bottlesLeft}</h3></article>
    </section>
    <section class="grid cols3">
      <article class="card"><small>Samlet lager værdi</small><h3>${money(agg.inventoryValue)}</h3></article>
      <article class="card"><small>Værdi i Vinlager</small><h3>${money(agg.storageValue)}</h3></article>
      <article class="card"><small>Værdi i Kælder</small><h3>${money(agg.cellarValue)}</h3></article>
    </section>
    <section class="grid cols2"><article class="card"><h3>Seneste smagninger</h3>${latest}</article><article class="card"><h3>Hurtig navigation</h3><a class="btn dark" href="/wines" data-link>Gå til alle vine</a><a class="btn" href="/new" data-link>Opret vin + køb</a></article></section>
  `, '/');
}

function wineCard(s, w) {
  const stat = getWineStats(s, w.id);
  const flag = countryFlags[w.country] || '🏳️';
  return `<a class="card wine-card" href="/wines/${w.id}" data-link><h3>${w.producer} · ${w.wineName}</h3><p><span class="flag">${flag}</span> ${w.country} · ${w.region}</p><p>${w.vintage} · ${w.wineType} · ${w.primaryGrape}</p><p>Flasker tilbage: <b>${stat.left}</b></p></a>`;
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
  return `<div class="timeline-wrap">${logs.map((log, i) => `<a href="/tastings/${log.id}" data-link class="timeline-item ${i % 2 ? 'right' : 'left'}"><div class="dot"></div><div class="timeline-card"><h4>Smagning ${i + 1}</h4><p><b>Dato:</b> ${log.date}</p><p><b>Kvalitet:</b> ${log.quality || '-'}</p><p><b>Noter:</b> ${log.notes || '-'}</p></div></a>`).join('')}</div>`;
}

function tastingForm() {
  const map = [
    ['quality', 'Kvalitet', OPTIONS.quality], ['readiness', 'Drikkemodenhed', OPTIONS.readiness], ['developmentLevel', 'Udviklingsniveau', OPTIONS.developmentLevel],
    ['sweetness', 'Sødhed', OPTIONS.sweetness], ['acidity', 'Syre', OPTIONS.acidity], ['tannin', 'Tannin', OPTIONS.tannin],
    ['body', 'Krop', OPTIONS.body], ['aromaIntensity', 'Aroma intensitet', OPTIONS.aromaIntensity], ['flavourIntensity', 'Smags intensitet', OPTIONS.flavourIntensity]
  ];
  const byCat = descriptors.reduce((acc, d) => ({ ...acc, [d.category]: [...(acc[d.category] || []), d] }), {});
  return `<form id="logForm" class="card">
    <h3>Log smagning / åbning</h3>
    <div class="grid cols3">${label('Dato', input('date', 'date', new Date().toISOString().slice(0, 10), true))}${label('Antal flasker åbnet', input('bottlesConsumed', 'number', 1, true, 1))}${map.map(([n, t, o]) => label(t, select(n, o, '', true))).join('')}</div>
    ${label('Blev den drukket sammen med mad?', select('withFood', ['Ja', 'Nej'], 'Nej', true))}
    <div id="foodWrap" style="display:none">${label('Hvilket mad var det og hvordan var oplevelsen i sammenspillet?', input('foodPairing', 'text'))}</div>
    <h4>Smagsdeskriptorer</h4>${Object.entries(byCat).map(([cat, list]) => `<div><b>${cat}</b><div class="chips">${list.map((d) => `<label class="chip check-chip"><input type="checkbox" name="descriptors" value="${d.id}"/> ${d.name}</label>`).join('')}</div></div>`).join('')}
    ${label('Frie smagsnoter', `<textarea class="input" name="notes" rows="3"></textarea>`)}
    <button class="btn" type="submit">Gem smagning</button>
  </form>`;
}

function wineDetail(s, id) {
  const w = s.wines.find((x) => x.id === id);
  if (!w) return shell('<p>Vin ikke fundet.</p>', '/wines');
  const logs = s.drinkLogs.filter((l) => l.wineId === id).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const stat = getWineStats(s, id);
  const flag = countryFlags[w.country] || '🏳️';
  const customCountry = !OPTIONS.countries.includes(w.country) ? [w.country] : [];
  const customRegion = !OPTIONS.regions.includes(w.region) ? [w.region] : [];
  const customGrape = !OPTIONS.grapes.includes(w.primaryGrape) ? [w.primaryGrape] : [];

  return shell(`
    <article class="card"><h2>${w.producer} — ${w.wineName}</h2><p><span class="flag">${flag}</span> ${w.vintage} · ${w.appellation || 'Ingen appellation'} · ${w.region}, ${w.country}</p><p>Vintype: ${w.wineType} · Primær drue: ${w.primaryGrape}</p><p>Drikkevindue: ${w.drinkFrom || '-'} til ${w.drinkTo || '-'}</p><p>Automatisk flaskestatus: Købt ${stat.bought} · Drukket ${stat.consumed} · <b>Tilbage ${stat.left}</b></p>
      <button class="btn" id="toggleEdit">Redigér vin</button>
      <form id="editWineForm" style="display:none" class="mt"><div class="grid cols2">
        ${label('Producent', input('producer', 'text', w.producer, true))}
        ${label('Vinens navn', input('wineName', 'text', w.wineName, true))}
        ${label('Årgang', input('vintage', 'number', w.vintage, true, 1900))}
        ${label('Land', select('country', OPTIONS.countries, w.country, true, customCountry.concat(['Andet (skriv selv)'])))}
        <div id="editCountryCustom" style="display:none">${label('Skriv land', input('countryCustom', 'text'))}</div>
        ${label('Region', select('region', OPTIONS.regions, w.region, true, customRegion.concat(['Andet (skriv selv)'])))}
        <div id="editRegionCustom" style="display:none">${label('Skriv region', input('regionCustom', 'text'))}</div>
        ${label('Appellation', input('appellation', 'text', w.appellation || ''))}
        ${label('Primær drue', select('primaryGrape', OPTIONS.grapes, w.primaryGrape, true, customGrape.concat(['Andet (skriv selv)'])))}
        <div id="editGrapeCustom" style="display:none">${label('Skriv drue', input('grapeCustom', 'text'))}</div>
        ${label('Vintype', select('wineType', OPTIONS.wineTypes, w.wineType, true))}
        ${label('Drikkevindue fra', input('drinkFrom', 'number', w.drinkFrom, false, 1900))}
        ${label('Drikkevindue til', input('drinkTo', 'number', w.drinkTo, false, 1900))}
      </div>${label('Blend', `<textarea class="input" name="blend" rows="2">${w.blend || ''}</textarea>`)}${label('Noter', `<textarea class="input" name="notes" rows="3">${w.notes || ''}</textarea>`)}<button class="btn" type="submit">Gem ændringer</button></form>
    </article>
    <section class="grid cols2"><article class="card"><h3>Køb & placering</h3>${stat.buckets.length ? stat.buckets.map((p) => `<p>${p.purchaseDate} · ${p.quantity} flasker · ${p.location} · ${p.price} ${p.currency} (tilbage ${p.qtyLeft})</p>`).join('') : '<p>Ingen køb.</p>'}</article><article class="card"><h3>Smagningshistorik</h3>${logs.length ? tastingPath(logs) : '<p>Ingen smagninger endnu.</p>'}</article></section>
    ${tastingForm()}
  `, '/wines');
}

function tastingDetailPage(s, id) {
  const t = s.drinkLogs.find((x) => x.id === id);
  if (!t) return shell('<p>Smagning ikke fundet.</p>', '/');
  const w = s.wines.find((x) => x.id === t.wineId);
  const descriptorNames = (t.descriptorIds || []).map((d) => descriptors.find((x) => x.id === d)?.name).filter(Boolean);
  return shell(`
    <article class="card"><a href="/wines/${t.wineId}" data-link>← Tilbage til vin</a><h2>Smagningsdetaljer</h2>
      <p><b>Vin:</b> ${w ? `${w.producer} ${w.wineName}` : 'Ukendt vin'}</p>
      <p><b>Dato:</b> ${t.date}</p><p><b>Antal flasker:</b> ${t.bottlesConsumed}</p><p><b>Kvalitet:</b> ${t.quality}</p><p><b>Drikkemodenhed:</b> ${t.readiness}</p><p><b>Udviklingsniveau:</b> ${t.developmentLevel}</p>
      <p><b>Sødhed:</b> ${t.sweetness} · <b>Syre:</b> ${t.acidity} · <b>Tannin:</b> ${t.tannin}</p>
      <p><b>Krop:</b> ${t.body} · <b>Aroma intensitet:</b> ${t.aromaIntensity} · <b>Smags intensitet:</b> ${t.flavourIntensity}</p>
      <p><b>Med mad:</b> ${t.withFood || 'Nej'}</p>${t.withFood === 'Ja' ? `<p><b>Madparring:</b> ${t.foodPairing || '-'}</p>` : ''}
      <p><b>Smagsdeskriptorer:</b> ${descriptorNames.join(', ') || '-'}</p>
      <p><b>Noter:</b><br/>${t.notes || '-'}</p>
    </article>
  `, '/');
}

function customSelectBlock(prefix, labelText, options) {
  return `${label(labelText, select(prefix, options, '', true, ['Andet (skriv selv)']))}<div id="${prefix}CustomWrap" style="display:none">${label(`Skriv ${labelText.toLowerCase()}`, input(`${prefix}Custom`, 'text'))}</div>`;
}

function newPage() {
  return shell(`
    <section class="card"><h2>Opret vin + første køb</h2><form id="createWineForm"><div class="grid cols2">
      ${label('Producent', input('producer', 'text', '', true))}
      ${label('Vinens navn', input('wineName', 'text', '', true))}
      ${label('Årgang', input('vintage', 'number', '', true, 1900))}
      ${customSelectBlock('country', 'Land', OPTIONS.countries)}
      ${customSelectBlock('region', 'Region', OPTIONS.regions)}
      ${label('Appellation', input('appellation'))}
      ${customSelectBlock('primaryGrape', 'Primær drue', OPTIONS.grapes)}
      ${label('Vintype', select('wineType', OPTIONS.wineTypes, '', true))}
      ${label('Drikkevindue fra (år)', input('drinkFrom', 'number', '', false, 1900))}
      ${label('Drikkevindue til (år)', input('drinkTo', 'number', '', false, 1900))}
      ${label('Købsdato', input('purchaseDate', 'date', '', true))}
      ${label('Antal flasker', input('quantity', 'number', 1, true, 1))}
      ${label('Pris per flaske', input('price', 'number', 0, true, 0))}
      ${label('Valuta', select('currency', OPTIONS.currency, 'DKK', true))}
      ${label('Forhandler', input('retailer', 'text'))}
      ${label('Placering', select('location', OPTIONS.locations, 'Vinlager', true))}
    </div>${label('Blend', `<textarea class="input" name="blend" rows="2"></textarea>`)}${label('Generelle noter', `<textarea class="input" name="notes" rows="3"></textarea>`)}<button class="btn" type="submit">Gem vin og køb</button></form></section>
    <section class="card"><h3>Import / bulk upload</h3><p>Download importark og upload CSV/XLS (XLS læses som tekst-separeret).</p><div class="row-gap"><button class="btn" id="downloadXls">Download Excel</button><button class="btn dark" id="downloadCsv">Download CSV</button><input id="bulkFile" type="file" accept=".csv,.xls,.xlsx" class="input"/><button class="btn" id="uploadBulk">Upload bulk fil</button></div><p id="uploadStatus" class="muted"></p></section>
  `, '/new');
}

function loginPage() {
  return `
    <main class="login-main"><section class="login-card"><h1>Vinlager Manager</h1><p>Log ind for at få adgang til dit vinlager.</p><form id="loginForm">${label('Brugernavn', input('username', 'text', '', true))}${label('Kodeord', input('password', 'password', '', true))}<button class="btn" type="submit">Log ind</button></form></section></main>
  `;
}

function parseBulk(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const split = (line) => line.split(line.includes(';') ? ';' : ',').map((v) => v.trim());
  const head = split(lines[0]).map((h) => h.toLowerCase());
  const i = (name) => head.indexOf(name);
  return lines.slice(1).map((line) => {
    const c = split(line);
    return {
      producer: c[i('producer')] || '', wineName: c[i('wine_name')] || '', vintage: c[i('vintage')] || '', country: c[i('country')] || '', region: c[i('region')] || '', appellation: c[i('appellation')] || '', primaryGrape: c[i('primary_grape')] || '', blend: c[i('blend')] || '', wineType: c[i('wine_type')] || '', drinkFrom: c[i('drink_from')] || '', drinkTo: c[i('drink_to')] || '', notes: c[i('notes')] || '',
      purchaseDate: c[i('purchase_date')] || '', quantity: Number(c[i('quantity')] || 0), price: Number(c[i('price')] || 0), currency: c[i('currency')] || 'DKK', retailer: c[i('retailer')] || '', location: c[i('location')] || 'Vinlager'
    };
  }).filter((r) => r.producer && r.wineName);
}

function exportInventoryCsv(s) {
  const header = ['producer','wine_name','vintage','country','region','appellation','primary_grape','wine_type','bottles_left','inventory_value'];
  const rows = s.wines.map((w) => {
    const st = getWineStats(s, w.id);
    return [w.producer, w.wineName, w.vintage, w.country, w.region, w.appellation, w.primaryGrape, w.wineType, st.left, st.inventoryValue.toFixed(2)].join(',');
  });
  dl('lager_export.csv', [header.join(','), ...rows].join('\n'));
}

function dl(name, content, type = 'text/csv') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}

function bindCustomInput(selectName, wrapId, inputName) {
  const selectEl = document.querySelector(`[name="${selectName}"]`);
  const wrap = document.getElementById(wrapId);
  const custom = document.querySelector(`[name="${inputName}"]`);
  if (!selectEl || !wrap || !custom) return;
  const toggle = () => {
    const on = selectEl.value === 'Andet (skriv selv)';
    wrap.style.display = on ? 'block' : 'none';
    custom.required = on;
  };
  selectEl.addEventListener('change', toggle);
  toggle();
}

function attachGlobalHandlers() {
  const out = document.getElementById('logoutBtn');
  if (out) out.onclick = () => { clearSession(); navigate('/login'); };
}

function attachHandlers(path, s) {
  attachGlobalHandlers();

  if (path === '/login') {
    const form = document.getElementById('loginForm');
    if (form) form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      setSession(fd.get('username'));
      navigate('/');
    };
  }

  if (path === '/wines') {
    const controls = ['search', 'location', 'country', 'wineType', 'sortBy'].map((name) => document.querySelector(`[name="${name}"]`));
    const list = document.getElementById('wine-list');
    const empty = document.getElementById('empty');
    const renderList = () => {
      const q = (document.querySelector('[name="search"]').value || '').toLowerCase();
      const location = document.querySelector('[name="location"]').value;
      const country = document.querySelector('[name="country"]').value;
      const wineType = document.querySelector('[name="wineType"]').value;
      const sortBy = document.querySelector('[name="sortBy"]').value;
      const filtered = s.wines.filter((w) => {
        const text = `${w.producer} ${w.wineName} ${w.region} ${w.country} ${w.primaryGrape} ${w.vintage}`.toLowerCase();
        if (q && !text.includes(q)) return false;
        if (country && w.country !== country) return false;
        if (wineType && w.wineType !== wineType) return false;
        if (location) {
          const has = getWineStats(s, w.id).buckets.some((b) => b.location === location && b.qtyLeft > 0);
          if (!has) return false;
        }
        return true;
      });
      filtered.sort((a, b) => {
        const sa = getWineStats(s, a.id); const sb = getWineStats(s, b.id);
        if (sortBy === 'Årgang stigende') return Number(a.vintage || 0) - Number(b.vintage || 0);
        if (sortBy === 'Årgang faldende') return Number(b.vintage || 0) - Number(a.vintage || 0);
        if (sortBy === 'Pris stigende') return sa.avgPrice - sb.avgPrice;
        if (sortBy === 'Pris faldende') return sb.avgPrice - sa.avgPrice;
        return 0;
      });
      list.innerHTML = filtered.map((w) => wineCard(s, w)).join('');
      empty.style.display = filtered.length ? 'none' : 'block';
    };
    controls.forEach((c) => c && (c.oninput = renderList));
    renderList();
    const ex = document.getElementById('exportInventory');
    if (ex) ex.onclick = () => exportInventoryCsv(s);
  }

  if (path.startsWith('/wines/')) {
    const wineId = path.split('/')[2];
    const toggle = document.getElementById('toggleEdit');
    const editForm = document.getElementById('editWineForm');
    if (toggle && editForm) toggle.onclick = () => editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';

    bindCustomInput('country', 'editCountryCustom', 'countryCustom');
    bindCustomInput('region', 'editRegionCustom', 'regionCustom');
    bindCustomInput('primaryGrape', 'editGrapeCustom', 'grapeCustom');

    if (editForm) editForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(editForm);
      const next = store();
      const i = next.wines.findIndex((w) => w.id === wineId);
      if (i < 0) return;
      const values = Object.fromEntries(fd.entries());
      const country = values.country === 'Andet (skriv selv)' ? values.countryCustom : values.country;
      const region = values.region === 'Andet (skriv selv)' ? values.regionCustom : values.region;
      const primaryGrape = values.primaryGrape === 'Andet (skriv selv)' ? values.grapeCustom : values.primaryGrape;
      next.wines[i] = { ...next.wines[i], ...values, country, region, primaryGrape };
      save(next);
      render();
    };

    const form = document.getElementById('logForm');
    if (form) {
      const withFood = form.querySelector('[name="withFood"]');
      const foodWrap = document.getElementById('foodWrap');
      const toggleFood = () => foodWrap.style.display = withFood.value === 'Ja' ? 'block' : 'none';
      withFood.onchange = toggleFood; toggleFood();
      form.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const next = store();
        next.drinkLogs.push({
          id: uid(), wineId,
          date: fd.get('date'), bottlesConsumed: Number(fd.get('bottlesConsumed') || 0),
          quality: fd.get('quality'), readiness: fd.get('readiness'), developmentLevel: fd.get('developmentLevel'), sweetness: fd.get('sweetness'), acidity: fd.get('acidity'), tannin: fd.get('tannin'), body: fd.get('body'), aromaIntensity: fd.get('aromaIntensity'), flavourIntensity: fd.get('flavourIntensity'),
          withFood: fd.get('withFood'), foodPairing: fd.get('foodPairing') || '', descriptorIds: fd.getAll('descriptors'), notes: fd.get('notes') || ''
        });
        save(next); render();
      };
    }
  }

  if (path === '/new') {
    bindCustomInput('country', 'countryCustomWrap', 'countryCustom');
    bindCustomInput('region', 'regionCustomWrap', 'regionCustom');
    bindCustomInput('primaryGrape', 'primaryGrapeCustomWrap', 'primaryGrapeCustom');

    const form = document.getElementById('createWineForm');
    if (form) form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const v = Object.fromEntries(fd.entries());
      const country = v.country === 'Andet (skriv selv)' ? v.countryCustom : v.country;
      const region = v.region === 'Andet (skriv selv)' ? v.regionCustom : v.region;
      const primaryGrape = v.primaryGrape === 'Andet (skriv selv)' ? v.primaryGrapeCustom : v.primaryGrape;
      const wineId = uid();
      const next = store();
      next.wines.push({ id: wineId, producer: v.producer, wineName: v.wineName, vintage: v.vintage, country, region, appellation: v.appellation, primaryGrape, blend: v.blend, wineType: v.wineType, drinkFrom: v.drinkFrom, drinkTo: v.drinkTo, notes: v.notes });
      next.purchases.push({ id: uid(), wineId, purchaseDate: v.purchaseDate, quantity: Number(v.quantity), price: Number(v.price), currency: v.currency, retailer: v.retailer, location: v.location });
      save(next);
      navigate(`/wines/${wineId}`);
    };

    const csv = document.getElementById('downloadCsv');
    const xls = document.getElementById('downloadXls');
    if (csv) csv.onclick = () => dl('wine_import_template.csv', 'producer,wine_name,vintage,country,region,appellation,primary_grape,blend,wine_type,drink_from,drink_to,notes,purchase_date,quantity,price,currency,retailer,location');
    if (xls) xls.onclick = () => dl('wine_import_template.xls', '<table><tr><th>producer</th><th>wine_name</th><th>vintage</th><th>country</th><th>region</th><th>appellation</th><th>primary_grape</th><th>blend</th><th>wine_type</th><th>drink_from</th><th>drink_to</th><th>notes</th><th>purchase_date</th><th>quantity</th><th>price</th><th>currency</th><th>retailer</th><th>location</th></tr></table>', 'application/vnd.ms-excel');

    const upload = document.getElementById('uploadBulk');
    if (upload) upload.onclick = async () => {
      const file = document.getElementById('bulkFile').files[0];
      const status = document.getElementById('uploadStatus');
      if (!file) return status.textContent = 'Vælg en fil først.';
      const rows = parseBulk(await file.text());
      if (!rows.length) return status.textContent = 'Ingen gyldige rækker fundet.';
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

  if (!session() && path !== '/login') {
    history.replaceState({}, '', '/login');
  }

  const current = location.pathname;
  let html = '';
  if (current === '/login') html = loginPage();
  else if (current === '/') html = dashboard(s);
  else if (current === '/wines') html = winesPage();
  else if (current.startsWith('/wines/')) html = wineDetail(s, current.split('/')[2]);
  else if (current.startsWith('/tastings/')) html = tastingDetailPage(s, current.split('/')[2]);
  else if (current === '/new') html = newPage();
  else html = shell('<p>Side ikke fundet.</p>');

  document.getElementById('app').innerHTML = html;
  attachHandlers(current, s);
}

render();
