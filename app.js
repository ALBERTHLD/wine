const STORAGE_KEY = 'winecellar.v6';
const USERS_KEY = 'winecellar.users.v2';
const SESSION_KEY = 'winecellar.session.v3';

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
const seedUsers = [{ id: 'admin-default', username: 'AdminAlbert', email: 'admin@vinlager.local', password: 'Start123', role: 'admin', active: true, verified: true }];
const uid = () => Math.random().toString(36).slice(2, 10);

const store = () => {
  try { return { ...seed, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return seed; }
};
const save = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

function usersStore() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || 'null');
    if (Array.isArray(users) && users.length) return users;
  } catch {}
  localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  return seedUsers;
}
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const setSession = (userId) => localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
const clearSession = () => localStorage.removeItem(SESSION_KEY);
function currentUser() {
  const id = getSession()?.userId;
  return id ? usersStore().find((u) => u.id === id && u.active) : null;
}

const money = (n) => `${Number(n || 0).toFixed(2)} DKK`;
const label = (text, field) => `<label><span>${text}</span>${field}</label>`;
const input = (name, type = 'text', value = '', required = false, min = '') => `<input class="input" name="${name}" type="${type}" value="${value || ''}" ${required ? 'required' : ''} ${min !== '' ? `min="${min}"` : ''}/>`;
const select = (name, options, value = '', required = false, extra = []) => `<select class="input" name="${name}" ${required ? 'required' : ''}><option value="">Vælg...</option>${options.map((o) => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('')}${extra.map((x) => `<option value="${x}" ${x === value ? 'selected' : ''}>${x}</option>`).join('')}</select>`;

const pill = (path, text, active) => `<a href="${path}" class="pill ${active === path ? 'active' : ''}" data-link>${text}</a>`;

function shell(content, active = '/') {
  const user = currentUser();
  const userNav = user?.role === 'admin'
    ? `${pill('/admin', 'Admin', active)}`
    : `${pill('/', 'Dashboard', active)}${pill('/wines', 'Alle vine', active)}${pill('/new', 'Tilføj data', active)}${pill('/profile', 'Profil', active)}`;

  return `<header class="topbar"><div class="container top-row"><h1>Vinlager Manager</h1><nav>${userNav}<button class="pill logout-btn" id="logoutBtn">Log ud</button></nav></div></header><main class="container">${content}</main>`;
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
  const left = buckets.reduce((n, p) => n + Number(p.qtyLeft || 0), 0);
  const bought = buckets.reduce((n, p) => n + Number(p.quantity || 0), 0);
  const avgPrice = buckets.length ? buckets.reduce((n, p) => n + Number(p.price || 0), 0) / buckets.length : 0;
  const inventoryValue = buckets.reduce((n, p) => n + Number(p.qtyLeft || 0) * Number(p.price || 0), 0);
  return { left, bought, consumed: bought - left, avgPrice, inventoryValue, buckets };
}

function drinkingSignal(wine, logs) {
  const now = new Date().getFullYear();
  const from = Number(wine.drinkFrom || 0);
  const to = Number(wine.drinkTo || 0);
  const latest = logs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

  if (latest?.readiness === 'Past its best' || latest?.developmentLevel === 'Tired') return { text: 'Drik nu', cls: 'sig-red' };
  if (latest?.developmentLevel === 'Fully developed') return { text: 'Drik løbende', cls: 'sig-orange' };
  if (latest?.readiness === 'Too young' || (from && now < from)) return { text: 'For ung', cls: 'sig-green' };
  if (to && now > to) return { text: 'Drik nu', cls: 'sig-red' };
  if (from && to && now >= from && now <= to) return { text: 'Drik løbende', cls: 'sig-orange' };
  return null;
}

function aggregateDashboard(s) {
  const totals = { bottlesInCellar: 0, bottlesInStorage: 0, inventoryValue: 0, cellarValue: 0, storageValue: 0, alerts: [] };

  s.wines.forEach((w) => {
    const st = getWineStats(s, w.id);
    totals.inventoryValue += st.inventoryValue;
    st.buckets.forEach((b) => {
      const qty = Number(b.qtyLeft || 0);
      const val = qty * Number(b.price || 0);
      if (b.location === 'Kælder') { totals.bottlesInCellar += qty; totals.cellarValue += val; }
      if (b.location === 'Vinlager') { totals.bottlesInStorage += qty; totals.storageValue += val; }
    });

    const logs = s.drinkLogs.filter((l) => l.wineId === w.id);
    const signal = drinkingSignal(w, logs);
    if (signal && st.left > 0) totals.alerts.push({ wine: w, left: st.left, signal });
  });

  return totals;
}

function dashboard(s) {
  const a = aggregateDashboard(s);
  const bottlesLeft = a.bottlesInStorage + a.bottlesInCellar;
  const latest = [...s.drinkLogs].sort((x, y) => new Date(y.date || 0) - new Date(x.date || 0)).slice(0, 5)
    .map((l) => {
      const w = s.wines.find((x) => x.id === l.wineId);
      return `<p><a href="/tastings/${l.id}" data-link>${l.date} · ${w ? `${w.producer} ${w.wineName}` : 'Ukendt vin'}</a></p>`;
    }).join('') || '<p>Ingen smagninger endnu.</p>';

  return shell(`
    <section class="hero card"><h2>Dit personlige vinlager 🍷</h2><p>Overblik over flasker, lager-værdi og smagningsudvikling.</p></section>
    <section class="grid cols3">
      <article class="card"><small>Flasker i Vinlager</small><h3>${a.bottlesInStorage}</h3></article>
      <article class="card"><small>Flasker i Kælder</small><h3>${a.bottlesInCellar}</h3></article>
      <article class="card"><small>Flasker tilbage</small><h3>${bottlesLeft}</h3></article>
    </section>
    <section class="grid cols3">
      <article class="card"><small>Samlet lager værdi</small><h3>${money(a.inventoryValue)}</h3></article>
      <article class="card"><small>Værdi i Vinlager</small><h3>${money(a.storageValue)}</h3></article>
      <article class="card"><small>Værdi i Kælder</small><h3>${money(a.cellarValue)}</h3></article>
    </section>
    <section class="grid cols2">
      <article class="card"><h3>Seneste smagninger</h3>${latest}</article>
      <article class="card"><h3>Flasker der snart bør drikkes</h3>${a.alerts.length ? a.alerts.map((x) => `<p><a href="/wines/${x.wine.id}" data-link>${x.wine.producer} ${x.wine.wineName}</a> · ${x.left} fl. <span class="signal ${x.signal.cls}">${x.signal.text}</span></p>`).join('') : '<p>Ingen alarmer endnu.</p>'}</article>
    </section>
  `, '/');
}

function wineCard(s, w) {
  const st = getWineStats(s, w.id);
  const flag = countryFlags[w.country] || '🏳️';
  return `<a class="card wine-card" href="/wines/${w.id}" data-link><h3>${w.producer} · ${w.wineName}</h3><p><span class="flag">${flag}</span> ${w.country} · ${w.region}</p><p>${w.vintage} · ${w.wineType} · ${w.primaryGrape}</p><p>Flasker tilbage: <b>${st.left}</b></p></a>`;
}

function winesPage() {
  return shell(`<section class="card"><h2>Alle vine</h2><div class="grid cols3">${label('Søgning', input('search'))}${label('Placering', select('location', OPTIONS.locations))}${label('Land', select('country', OPTIONS.countries))}${label('Type', select('wineType', OPTIONS.wineTypes))}${label('Sortering', select('sortBy', ['Årgang stigende', 'Årgang faldende', 'Pris stigende', 'Pris faldende']))}</div><div class="row-gap"><button id="exportInventory" class="btn">Eksportér lager (CSV)</button></div></section><section id="wine-list" class="grid cols3"></section><p id="empty" class="muted" style="display:none">Ingen vine matcher filtrene.</p>`, '/wines');
}

function tastingPath(logs) {
  return `<div class="timeline-wrap">${logs.map((l, i) => `<a href="/tastings/${l.id}" data-link class="timeline-item ${i % 2 ? 'right' : 'left'}"><div class="dot"></div><div class="timeline-card"><h4>Smagning ${i + 1}</h4><p><b>Dato:</b> ${l.date}</p><p><b>Kvalitet:</b> ${l.quality || '-'}</p><p><b>Noter:</b> ${l.notes || '-'}</p></div></a>`).join('')}</div>`;
}

function tastingForm() {
  const map = [
    ['quality', 'Kvalitet', OPTIONS.quality], ['readiness', 'Drikkemodenhed', OPTIONS.readiness], ['developmentLevel', 'Udviklingsniveau', OPTIONS.developmentLevel],
    ['sweetness', 'Sødhed', OPTIONS.sweetness], ['acidity', 'Syre', OPTIONS.acidity], ['tannin', 'Tannin', OPTIONS.tannin],
    ['body', 'Krop', OPTIONS.body], ['aromaIntensity', 'Aroma intensitet', OPTIONS.aromaIntensity], ['flavourIntensity', 'Smags intensitet', OPTIONS.flavourIntensity]
  ];
  const byCat = descriptors.reduce((acc, d) => ({ ...acc, [d.category]: [...(acc[d.category] || []), d] }), {});
  return `<form id="logForm" class="card"><h3>Log smagning / åbning</h3><div class="grid cols3">${label('Dato', input('date', 'date', new Date().toISOString().slice(0, 10), true))}${label('Antal flasker åbnet', input('bottlesConsumed', 'number', 1, true, 1))}${map.map(([n, t, o]) => label(t, select(n, o, '', true))).join('')}</div>${label('Blev den drukket sammen med mad?', select('withFood', ['Ja', 'Nej'], 'Nej', true))}<div id="foodWrap" style="display:none">${label('Hvilket mad var det og hvordan var oplevelsen i sammenspillet?', input('foodPairing'))}</div><h4>Smagsdeskriptorer</h4>${Object.entries(byCat).map(([cat, list]) => `<div><b>${cat}</b><div class="chips">${list.map((d) => `<label class="chip check-chip"><input type="checkbox" name="descriptors" value="${d.id}"/> ${d.name}</label>`).join('')}</div></div>`).join('')}${label('Frie smagsnoter', `<textarea class="input" name="notes" rows="3"></textarea>`)}<button class="btn" type="submit">Gem smagning</button></form>`;
}

function wineDetail(s, id) {
  const w = s.wines.find((x) => x.id === id);
  if (!w) return shell('<p>Vin ikke fundet.</p>', '/wines');
  const logs = s.drinkLogs.filter((x) => x.wineId === id).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const st = getWineStats(s, id);
  const flag = countryFlags[w.country] || '🏳️';
  const customCountry = !OPTIONS.countries.includes(w.country) ? [w.country] : [];
  const customRegion = !OPTIONS.regions.includes(w.region) ? [w.region] : [];
  const customGrape = !OPTIONS.grapes.includes(w.primaryGrape) ? [w.primaryGrape] : [];

  return shell(`<article class="card"><h2>${w.producer} — ${w.wineName}</h2><p><span class="flag">${flag}</span> ${w.vintage} · ${w.appellation || 'Ingen appellation'} · ${w.region}, ${w.country}</p><p>Vintype: ${w.wineType} · Primær drue: ${w.primaryGrape}</p><p>Drikkevindue: ${w.drinkFrom || '-'} til ${w.drinkTo || '-'}</p><p>Automatisk flaskestatus: Købt ${st.bought} · Drukket ${st.consumed} · <b>Tilbage ${st.left}</b></p><button class="btn" id="toggleEdit">Redigér vin</button><form id="editWineForm" style="display:none" class="mt"><div class="grid cols2">${label('Producent', input('producer', 'text', w.producer, true))}${label('Vinens navn', input('wineName', 'text', w.wineName, true))}${label('Årgang', input('vintage', 'number', w.vintage, true, 1900))}${label('Land', select('country', OPTIONS.countries, w.country, true, customCountry.concat(['Andet (skriv selv)'])))}<div id="editCountryCustom" style="display:none">${label('Skriv land', input('countryCustom'))}</div>${label('Region', select('region', OPTIONS.regions, w.region, true, customRegion.concat(['Andet (skriv selv)'])))}<div id="editRegionCustom" style="display:none">${label('Skriv region', input('regionCustom'))}</div>${label('Appellation', input('appellation', 'text', w.appellation || ''))}${label('Primær drue', select('primaryGrape', OPTIONS.grapes, w.primaryGrape, true, customGrape.concat(['Andet (skriv selv)'])))}<div id="editGrapeCustom" style="display:none">${label('Skriv drue', input('grapeCustom'))}</div>${label('Vintype', select('wineType', OPTIONS.wineTypes, w.wineType, true))}${label('Drikkevindue fra', input('drinkFrom', 'number', w.drinkFrom, false, 1900))}${label('Drikkevindue til', input('drinkTo', 'number', w.drinkTo, false, 1900))}</div>${label('Blend', `<textarea class="input" name="blend" rows="2">${w.blend || ''}</textarea>`)}${label('Noter', `<textarea class="input" name="notes" rows="3">${w.notes || ''}</textarea>`)}<button class="btn" type="submit">Gem ændringer</button></form></article><section class="grid cols2"><article class="card"><h3>Køb & placering</h3>${st.buckets.length ? st.buckets.map((p) => `<p>${p.purchaseDate} · ${p.quantity} flasker · ${p.location} · ${p.price} ${p.currency} (tilbage ${p.qtyLeft})</p>`).join('') : '<p>Ingen køb.</p>'}</article><article class="card"><h3>Smagningshistorik</h3>${logs.length ? tastingPath(logs) : '<p>Ingen smagninger endnu.</p>'}</article></section>${tastingForm()}`, '/wines');
}

function tastingDetailPage(s, id) {
  const t = s.drinkLogs.find((x) => x.id === id);
  if (!t) return shell('<p>Smagning ikke fundet.</p>', '/');
  const w = s.wines.find((x) => x.id === t.wineId);
  const names = (t.descriptorIds || []).map((d) => descriptors.find((x) => x.id === d)?.name).filter(Boolean);
  return shell(`<article class="card"><a href="/wines/${t.wineId}" data-link>← Tilbage til vin</a><h2>Smagningsdetaljer</h2><p><b>Vin:</b> ${w ? `${w.producer} ${w.wineName}` : 'Ukendt vin'}</p><p><b>Dato:</b> ${t.date}</p><p><b>Antal flasker:</b> ${t.bottlesConsumed}</p><p><b>Kvalitet:</b> ${t.quality}</p><p><b>Drikkemodenhed:</b> ${t.readiness}</p><p><b>Udviklingsniveau:</b> ${t.developmentLevel}</p><p><b>Sødhed:</b> ${t.sweetness} · <b>Syre:</b> ${t.acidity} · <b>Tannin:</b> ${t.tannin}</p><p><b>Krop:</b> ${t.body} · <b>Aroma intensitet:</b> ${t.aromaIntensity} · <b>Smags intensitet:</b> ${t.flavourIntensity}</p><p><b>Med mad:</b> ${t.withFood || 'Nej'}</p>${t.withFood === 'Ja' ? `<p><b>Madparring:</b> ${t.foodPairing || '-'}</p>` : ''}<p><b>Smagsdeskriptorer:</b> ${names.join(', ') || '-'}</p><p><b>Noter:</b><br/>${t.notes || '-'}</p></article>`, '/');
}

function profilePage() {
  const user = currentUser();
  return shell(`<section class="card"><h2>Min profil</h2><form id="profileForm" class="grid cols2">${label('Brugernavn', input('username', 'text', user?.username || '', true))}${label('Email', input('email', 'email', user?.email || '', true))}${label('Nyt kodeord', input('password', 'password', '', false))}<div></div><button class="btn" type="submit">Gem profil</button></form><p class="muted">Lad kodeord stå tomt for at beholde nuværende kodeord.</p><p id="profileStatus" class="muted"></p></section>`, '/profile');
}

function adminPage() {
  const users = usersStore();
  return shell(`<section class="card"><h2>Admin: Brugerstyring</h2><p>Her administreres brugere og roller.</p><div class="grid cols2"><form id="adminCreateUserForm"><h3>Opret bruger</h3>${label('Brugernavn', input('username', 'text', '', true))}${label('Email', input('email', 'email', '', true))}${label('Kodeord', input('password', 'text', '', true))}${label('Rolle', select('role', ['user', 'admin'], 'user', true))}<button class="btn" type="submit">Opret bruger</button></form><form id="adminEditUserForm"><h3>Redigér bruger</h3>${label('Vælg bruger', `<select class="input" name="userId" required><option value="">Vælg...</option>${users.map((u) => `<option value="${u.id}">${u.username} (${u.role})</option>`).join('')}</select>`)}${label('Nyt brugernavn', input('username'))}${label('Ny email', input('email', 'email'))}${label('Nyt kodeord', input('password'))}${label('Rolle', select('role', ['user', 'admin']))}${label('Aktiv', select('active', ['Ja', 'Nej'], 'Ja'))}${label('Verificeret email', select('verified', ['Ja', 'Nej'], 'Ja'))}<button class="btn" type="submit">Gem brugerændringer</button></form></div><h3>Brugeroversigt</h3><div class="card">${users.map((u) => `<p><b>${u.username}</b> · ${u.email} · rolle: ${u.role} · ${u.verified ? 'verificeret' : 'ikke verificeret'} · ${u.active ? 'aktiv' : 'deaktiveret'}</p>`).join('')}</div><p id="adminStatus" class="muted"></p></section>`, '/admin');
}

const customSelectBlock = (prefix, labelText, options) => `${label(labelText, select(prefix, options, '', true, ['Andet (skriv selv)']))}<div id="${prefix}CustomWrap" style="display:none">${label(`Skriv ${labelText.toLowerCase()}`, input(`${prefix}Custom`))}</div>`;

function newPage() {
  return shell(`<section class="card"><h2>Opret vin + første køb</h2><form id="createWineForm"><div class="grid cols2">${label('Producent', input('producer', 'text', '', true))}${label('Vinens navn', input('wineName', 'text', '', true))}${label('Årgang', input('vintage', 'number', '', true, 1900))}${customSelectBlock('country', 'Land', OPTIONS.countries)}${customSelectBlock('region', 'Region', OPTIONS.regions)}${label('Appellation', input('appellation'))}${customSelectBlock('primaryGrape', 'Primær drue', OPTIONS.grapes)}${label('Vintype', select('wineType', OPTIONS.wineTypes, '', true))}${label('Drikkevindue fra (år)', input('drinkFrom', 'number', '', false, 1900))}${label('Drikkevindue til (år)', input('drinkTo', 'number', '', false, 1900))}${label('Købsdato', input('purchaseDate', 'date', '', true))}${label('Antal flasker', input('quantity', 'number', 1, true, 1))}${label('Pris per flaske', input('price', 'number', 0, true, 0))}${label('Valuta', select('currency', OPTIONS.currency, 'DKK', true))}${label('Forhandler', input('retailer'))}${label('Placering', select('location', OPTIONS.locations, 'Vinlager', true))}</div>${label('Blend', `<textarea class="input" name="blend" rows="2"></textarea>`)}${label('Generelle noter', `<textarea class="input" name="notes" rows="3"></textarea>`)}<button class="btn" type="submit">Gem vin og køb</button></form></section><section class="card"><h3>Import / bulk upload</h3><p>Download importark og upload CSV/XLS (XLS læses som tekst-separeret).</p><div class="row-gap"><button class="btn" id="downloadXls">Download Excel</button><button class="btn dark" id="downloadCsv">Download CSV</button><input id="bulkFile" type="file" accept=".csv,.xls,.xlsx" class="input"/><button class="btn" id="uploadBulk">Upload bulk fil</button></div><p id="uploadStatus" class="muted"></p></section>`, '/new');
}

function loginPage() {
  return `<main class="login-main"><section class="login-card"><h1>Vinlager Manager</h1><p>Log ind for at få adgang til dit vinlager.</p><form id="loginForm">${label('Brugernavn', input('username', 'text', '', true))}${label('Kodeord', input('password', 'password', '', true))}<button class="btn" type="submit">Log ind</button></form><p id="loginStatus" class="muted"></p><hr/><h3>Opret bruger</h3><form id="registerForm">${label('Email', input('email', 'email', '', true))}${label('Brugernavn', input('username', 'text', '', true))}${label('Kodeord', input('password', 'password', '', true))}<button class="btn" type="submit">Opret profil</button></form><p id="registerStatus" class="muted"></p><h3>Verificér email</h3><form id="verifyForm">${label('Email', input('email', 'email', '', true))}${label('Verifikationskode', input('code', 'text', '', true))}<button class="btn" type="submit">Verificér</button></form><p id="verifyStatus" class="muted"></p></section></main>`;
}

function parseBulk(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const split = (line) => line.split(line.includes(';') ? ';' : ',').map((v) => v.trim());
  const head = split(lines[0]).map((h) => h.toLowerCase());
  const i = (x) => head.indexOf(x);
  return lines.slice(1).map((line) => {
    const c = split(line);
    return { producer: c[i('producer')] || '', wineName: c[i('wine_name')] || '', vintage: c[i('vintage')] || '', country: c[i('country')] || '', region: c[i('region')] || '', appellation: c[i('appellation')] || '', primaryGrape: c[i('primary_grape')] || '', blend: c[i('blend')] || '', wineType: c[i('wine_type')] || '', drinkFrom: c[i('drink_from')] || '', drinkTo: c[i('drink_to')] || '', notes: c[i('notes')] || '', purchaseDate: c[i('purchase_date')] || '', quantity: Number(c[i('quantity')] || 0), price: Number(c[i('price')] || 0), currency: c[i('currency')] || 'DKK', retailer: c[i('retailer')] || '', location: c[i('location')] || 'Vinlager' };
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
  const s = document.querySelector(`[name="${selectName}"]`); const w = document.getElementById(wrapId); const i = document.querySelector(`[name="${inputName}"]`);
  if (!s || !w || !i) return;
  const t = () => { const on = s.value === 'Andet (skriv selv)'; w.style.display = on ? 'block' : 'none'; i.required = on; };
  s.addEventListener('change', t); t();
}

function attachGlobalHandlers() {
  const out = document.getElementById('logoutBtn');
  if (out) out.onclick = () => { clearSession(); navigate('/login'); };
}

function attachHandlers(path, s) {
  attachGlobalHandlers();

  if (path === '/login') {
    const loginForm = document.getElementById('loginForm');
    const loginStatus = document.getElementById('loginStatus');
    const registerForm = document.getElementById('registerForm');
    const registerStatus = document.getElementById('registerStatus');
    const verifyForm = document.getElementById('verifyForm');
    const verifyStatus = document.getElementById('verifyStatus');

    if (loginForm) loginForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const u = usersStore().find((x) => x.username === fd.get('username') && x.password === fd.get('password') && x.active);
      if (!u) return loginStatus.textContent = 'Forkert login eller bruger er deaktiveret.';
      if (!u.verified) return loginStatus.textContent = 'Email er ikke verificeret endnu.';
      setSession(u.id); navigate(u.role === 'admin' ? '/admin' : '/');
    };

    if (registerForm) registerForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(registerForm);
      const users = usersStore();
      if (users.some((x) => x.email === fd.get('email'))) return registerStatus.textContent = 'Email findes allerede.';
      if (users.some((x) => x.username === fd.get('username'))) return registerStatus.textContent = 'Brugernavn findes allerede.';
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      users.push({ id: uid(), username: fd.get('username'), email: fd.get('email'), password: fd.get('password'), role: 'user', active: true, verified: false, verificationCode: code });
      saveUsers(users);
      registerStatus.textContent = `Verifikationskode sendt til email (demo): ${code}`;
    };

    if (verifyForm) verifyForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(verifyForm);
      const users = usersStore();
      const i = users.findIndex((x) => x.email === fd.get('email'));
      if (i < 0) return verifyStatus.textContent = 'Email findes ikke.';
      if (users[i].verificationCode !== fd.get('code')) return verifyStatus.textContent = 'Forkert verifikationskode.';
      users[i].verified = true;
      delete users[i].verificationCode;
      saveUsers(users);
      verifyStatus.textContent = 'Email verificeret. Du kan nu logge ind.';
    };
  }

  if (path === '/profile') {
    const form = document.getElementById('profileForm');
    const status = document.getElementById('profileStatus');
    if (form) form.onsubmit = (e) => {
      e.preventDefault();
      const me = currentUser();
      const users = usersStore();
      const i = users.findIndex((x) => x.id === me.id);
      if (i < 0) return;
      const fd = new FormData(form);
      users[i].username = fd.get('username');
      users[i].email = fd.get('email');
      if (fd.get('password')) users[i].password = fd.get('password');
      saveUsers(users); status.textContent = 'Profil opdateret.';
    };
  }

  if (path === '/admin') {
    const status = document.getElementById('adminStatus');
    const createForm = document.getElementById('adminCreateUserForm');
    const editForm = document.getElementById('adminEditUserForm');
    if (createForm) createForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(createForm);
      const users = usersStore();
      if (users.some((x) => x.username === fd.get('username'))) return status.textContent = 'Brugernavn findes allerede.';
      if (users.some((x) => x.email === fd.get('email'))) return status.textContent = 'Email findes allerede.';
      users.push({ id: uid(), username: fd.get('username'), email: fd.get('email'), password: fd.get('password'), role: fd.get('role') || 'user', active: true, verified: true });
      saveUsers(users); status.textContent = 'Bruger oprettet.'; render();
    };
    if (editForm) editForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(editForm);
      const users = usersStore();
      const i = users.findIndex((x) => x.id === fd.get('userId'));
      if (i < 0) return;
      if (fd.get('username')) users[i].username = fd.get('username');
      if (fd.get('email')) users[i].email = fd.get('email');
      if (fd.get('password')) users[i].password = fd.get('password');
      if (fd.get('role')) users[i].role = fd.get('role');
      users[i].active = fd.get('active') !== 'Nej';
      users[i].verified = fd.get('verified') !== 'Nej';
      saveUsers(users); status.textContent = 'Bruger opdateret.'; render();
    };
  }

  if (path === '/wines') {
    const renderList = () => {
      const q = (document.querySelector('[name="search"]').value || '').toLowerCase();
      const loc = document.querySelector('[name="location"]').value;
      const country = document.querySelector('[name="country"]').value;
      const type = document.querySelector('[name="wineType"]').value;
      const sortBy = document.querySelector('[name="sortBy"]').value;
      const list = document.getElementById('wine-list');
      const empty = document.getElementById('empty');

      const filtered = s.wines.filter((w) => {
        const text = `${w.producer} ${w.wineName} ${w.region} ${w.country} ${w.primaryGrape} ${w.vintage}`.toLowerCase();
        if (q && !text.includes(q)) return false;
        if (country && w.country !== country) return false;
        if (type && w.wineType !== type) return false;
        if (loc && !getWineStats(s, w.id).buckets.some((b) => b.location === loc && b.qtyLeft > 0)) return false;
        return true;
      });

      filtered.sort((a, b) => {
        const sa = getWineStats(s, a.id), sb = getWineStats(s, b.id);
        if (sortBy === 'Årgang stigende') return Number(a.vintage || 0) - Number(b.vintage || 0);
        if (sortBy === 'Årgang faldende') return Number(b.vintage || 0) - Number(a.vintage || 0);
        if (sortBy === 'Pris stigende') return sa.avgPrice - sb.avgPrice;
        if (sortBy === 'Pris faldende') return sb.avgPrice - sa.avgPrice;
        return 0;
      });

      list.innerHTML = filtered.map((w) => wineCard(s, w)).join('');
      empty.style.display = filtered.length ? 'none' : 'block';
    };

    ['search', 'location', 'country', 'wineType', 'sortBy'].forEach((x) => {
      const el = document.querySelector(`[name="${x}"]`); if (el) el.oninput = renderList;
    });
    document.getElementById('exportInventory').onclick = () => exportInventoryCsv(s);
    renderList();
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
      const v = Object.fromEntries(new FormData(editForm).entries());
      const next = store();
      const i = next.wines.findIndex((w) => w.id === wineId);
      if (i < 0) return;
      next.wines[i] = {
        ...next.wines[i], ...v,
        country: v.country === 'Andet (skriv selv)' ? v.countryCustom : v.country,
        region: v.region === 'Andet (skriv selv)' ? v.regionCustom : v.region,
        primaryGrape: v.primaryGrape === 'Andet (skriv selv)' ? v.grapeCustom : v.primaryGrape
      };
      save(next); render();
    };

    const logForm = document.getElementById('logForm');
    if (logForm) {
      const withFood = logForm.querySelector('[name="withFood"]');
      const foodWrap = document.getElementById('foodWrap');
      const toggleFood = () => foodWrap.style.display = withFood.value === 'Ja' ? 'block' : 'none';
      withFood.onchange = toggleFood; toggleFood();
      logForm.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(logForm);
        const next = store();
        next.drinkLogs.push({ id: uid(), wineId, date: fd.get('date'), bottlesConsumed: Number(fd.get('bottlesConsumed') || 0), quality: fd.get('quality'), readiness: fd.get('readiness'), developmentLevel: fd.get('developmentLevel'), sweetness: fd.get('sweetness'), acidity: fd.get('acidity'), tannin: fd.get('tannin'), body: fd.get('body'), aromaIntensity: fd.get('aromaIntensity'), flavourIntensity: fd.get('flavourIntensity'), withFood: fd.get('withFood'), foodPairing: fd.get('foodPairing') || '', descriptorIds: fd.getAll('descriptors'), notes: fd.get('notes') || '' });
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
      const v = Object.fromEntries(new FormData(form).entries());
      const wineId = uid();
      const next = store();
      next.wines.push({ id: wineId, producer: v.producer, wineName: v.wineName, vintage: v.vintage, country: v.country === 'Andet (skriv selv)' ? v.countryCustom : v.country, region: v.region === 'Andet (skriv selv)' ? v.regionCustom : v.region, appellation: v.appellation, primaryGrape: v.primaryGrape === 'Andet (skriv selv)' ? v.primaryGrapeCustom : v.primaryGrape, blend: v.blend, wineType: v.wineType, drinkFrom: v.drinkFrom, drinkTo: v.drinkTo, notes: v.notes });
      next.purchases.push({ id: uid(), wineId, purchaseDate: v.purchaseDate, quantity: Number(v.quantity), price: Number(v.price), currency: v.currency, retailer: v.retailer, location: v.location });
      save(next); navigate(`/wines/${wineId}`);
    };

    document.getElementById('downloadCsv').onclick = () => dl('wine_import_template.csv', 'producer,wine_name,vintage,country,region,appellation,primary_grape,blend,wine_type,drink_from,drink_to,notes,purchase_date,quantity,price,currency,retailer,location');
    document.getElementById('downloadXls').onclick = () => dl('wine_import_template.xls', '<table><tr><th>producer</th><th>wine_name</th><th>vintage</th><th>country</th><th>region</th><th>appellation</th><th>primary_grape</th><th>blend</th><th>wine_type</th><th>drink_from</th><th>drink_to</th><th>notes</th><th>purchase_date</th><th>quantity</th><th>price</th><th>currency</th><th>retailer</th><th>location</th></tr></table>', 'application/vnd.ms-excel');
    document.getElementById('uploadBulk').onclick = async () => {
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
      save(next); status.textContent = `${rows.length} vin(e) blev importeret.`;
    };
  }
}

function render() {
  usersStore();
  if (!currentUser() && location.pathname !== '/login') history.replaceState({}, '', '/login');
  const user = currentUser();
  const s = store();
  const path = location.pathname;

  if (path !== '/login' && user?.role === 'admin' && path !== '/admin') history.replaceState({}, '', '/admin');

  let html = '';
  const current = location.pathname;
  if (current === '/login') html = loginPage();
  else if (current === '/admin') html = user?.role === 'admin' ? adminPage() : shell('<section class="card"><h2>Ingen adgang</h2></section>', '/');
  else if (current === '/') html = dashboard(s);
  else if (current === '/wines') html = winesPage();
  else if (current.startsWith('/wines/')) html = wineDetail(s, current.split('/')[2]);
  else if (current.startsWith('/tastings/')) html = tastingDetailPage(s, current.split('/')[2]);
  else if (current === '/new') html = newPage();
  else if (current === '/profile') html = profilePage();
  else html = shell('<p>Side ikke fundet.</p>');

  document.getElementById('app').innerHTML = html;
  attachHandlers(current, s);
}

render();
