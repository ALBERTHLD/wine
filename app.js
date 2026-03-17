import { login as identityLogin, signup as identitySignup, logout as identityLogout, getUser, handleAuthCallback, requestPasswordRecovery, updateUser, onAuthChange, AUTH_EVENTS, AuthError } from '@netlify/identity';

const STORAGE_KEY = 'winecellar.v8';
const RULE_SCALE = 1.5;

const WINE_REGIONS_BY_COUNTRY = {
  Frankrig: ['Alsace', 'Bordeaux', 'Bourgogne', 'Champagne', 'Loire', 'Rhone', 'Anden'],
  Italien: ['Piemonte', 'Toscana', 'Veneto', 'Sicilia', 'Anden'],
  Spanien: ['Rioja', 'Ribera del Duero', 'Priorat', 'Jerez', 'Anden'],
  Tyskland: ['Mosel', 'Rheingau', 'Rheinhessen', 'Anden'],
  Portugal: ['Douro', 'Dao', 'Vinho Verde', 'Anden'],
  USA: ['Napa Valley', 'Sonoma County', 'Oregon', 'Anden'],
  Australien: ['Barossa Valley', 'Yarra Valley', 'Margaret River', 'Anden'],
  'New Zealand': ['Marlborough', 'Central Otago', 'Anden'],
  Østrig: ['Wachau', 'Burgenland', 'Anden'],
  Argentina: ['Mendoza', 'Patagonia', 'Anden'],
  Chile: ['Maipo Valley', 'Colchagua Valley', 'Anden'],
  Danmark: ['Fyn', 'Jylland', 'Sjælland', 'Bornholm', 'Anden']
};

const getRegionsForCountry = (country) => WINE_REGIONS_BY_COUNTRY[country] || ['Anden'];
const shouldShowCustomRegionInput = (selectedRegion) => selectedRegion === 'Anden';

const OPTIONS = {
  countries: [...Object.keys(WINE_REGIONS_BY_COUNTRY), 'Grækenland', 'Ungarn', 'Georgien', 'Schweiz'],
  grapes: ['Pinot Noir', 'Syrah', 'Cabernet Sauvignon', 'Merlot', 'Riesling', 'Sauvignon Blanc', 'Chardonnay', 'Nebbiolo', 'Sangiovese', 'Tempranillo'],
  wineTypes: ['Rødvin', 'Hvidvin', 'Rosé', 'Mousserende', 'Dessertvin', 'Orangevin', 'Forstærket'],
  locations: ['Vinlager', 'Kælder', 'Øvrige'],
  currency: ['DKK', 'EUR', 'USD'],
  packagingStatus: ['Ingen', 'Æske', 'OC', 'OWC'],
  bottleVolumes: ['187', '375', '500', '750', '1000', '1500', '3000', '6000', 'Anden størrelse'],
  quality: ['Faulty', 'Poor', 'Acceptable', 'Good', 'Very good', 'Outstanding'],
  developmentLevel: ['Youthful', 'Developing', 'Fully developed', 'Tired'],
  sweetness: ['Dry', 'Off-dry', 'Medium', 'Sweet'],
  acidity: ['Low', 'Medium', 'High'],
  tannin: ['Low', 'Medium', 'High'],
  alcohol: ['Low', 'Medium', 'High'],
  body: ['Light', 'Medium', 'Full'],
  aromaIntensity: ['Light', 'Medium', 'Pronounced'],
  flavourIntensity: ['Light', 'Medium', 'Pronounced'],
  finish: ['Short', 'Medium', 'Long']
};

const WSET_DESCRIPTORS = {
  primary: {
    fruit: ['Citrus', 'Rød frugt', 'Sort frugt', 'Stenfrugt'],
    floral: ['Violet', 'Rose', 'Hvide blomster'],
    spice: ['Sort peber', 'Kanel', 'Lakrids'],
    otherPrimary: ['Urter', 'Mineral', 'Grønne noter']
  },
  secondary: {
    oak: ['Vanilje', 'Ristet kaffe', 'Røg'],
    yeastAutolysis: ['Brød', 'Gær'],
    vinification: ['Smør', 'Mælkesyre']
  },
  tertiary: ['Skovbund', 'Svamp', 'Læder', 'Tobak', 'Nødder']
};

const BASE_TYPE_RULES = {
  rødvin: { label: 'Baseregel: Rødvin', from: 2, to: 8 },
  hvidvin: { label: 'Baseregel: Hvidvin', from: 1, to: 5 },
  rosé: { label: 'Baseregel: Rosé', from: 0, to: 3 },
  mousserende: { label: 'Baseregel: Mousserende', from: 1, to: 4 },
  dessertvin: { label: 'Baseregel: Dessertvin', from: 3, to: 20 },
  orangevin: { label: 'Baseregel: Orangevin', from: 1, to: 6 },
  forstærket: { label: 'Baseregel: Forstærket', from: 5, to: 30 }
};

const AGING_CATEGORY_RULES = {
  'drik ung': { label: 'Kategori: Drik ung', from: 0, to: 3 },
  'mellem lagring': { label: 'Kategori: Mellem lagring', from: 2, to: 8 },
  'lang lagring': { label: 'Kategori: Lang lagring', from: 5, to: 15 },
  'meget lang lagring': { label: 'Kategori: Meget lang lagring', from: 8, to: 25 }
};

const GRAPE_RULES = [
  { label: 'Drue: Cabernet Sauvignon', matches: ['cabernet sauvignon'], from: 6, to: 18 },
  { label: 'Drue: Merlot', matches: ['merlot'], from: 3, to: 10 },
  { label: 'Drue: Pinot Noir', matches: ['pinot noir', 'spatburgunder'], from: 3, to: 12 },
  { label: 'Drue: Syrah / Shiraz', matches: ['syrah', 'shiraz'], from: 4, to: 15 },
  { label: 'Drue: Nebbiolo', matches: ['nebbiolo'], from: 8, to: 25 },
  { label: 'Drue: Sangiovese', matches: ['sangiovese'], from: 4, to: 12 },
  { label: 'Drue: Chardonnay', matches: ['chardonnay'], from: 2, to: 8 },
  { label: 'Drue: Sauvignon Blanc', matches: ['sauvignon blanc'], from: 0, to: 4 },
  { label: 'Drue: Riesling', matches: ['riesling'], from: 2, to: 15 }
];

const REGION_RULES = [
  { label: 'Region: Bordeaux', matches: ['bordeaux'], from: 6, to: 20 },
  { label: 'Region: Bourgogne', matches: ['bourgogne', 'burgundy'], from: 2, to: 10 },
  { label: 'Region: Barolo', matches: ['barolo'], from: 8, to: 25 },
  { label: 'Region: Rioja', matches: ['rioja'], from: 4, to: 15 },
  { label: 'Region: Mosel', matches: ['mosel'], from: 2, to: 15 },
  { label: 'Region: Douro', matches: ['douro'], from: 4, to: 20 },
  { label: 'Region: Napa Valley', matches: ['napa valley'], from: 4, to: 15 }
];

const countryFlags = { Frankrig:'🇫🇷', Italien:'🇮🇹', Spanien:'🇪🇸', Tyskland:'🇩🇪', Portugal:'🇵🇹', USA:'🇺🇸', Australien:'🇦🇺', Argentina:'🇦🇷', Chile:'🇨🇱', Danmark:'🇩🇰', Østrig:'🇦🇹', 'New Zealand':'🇳🇿', Grækenland:'🇬🇷', Ungarn:'🇭🇺', Georgien:'🇬🇪', Schweiz:'🇨🇭' };

const seedData = { wines: [], purchases: [], inventoryEvents: [], drinkLogs: [] };

let _identityUser = null;
let _authCallbackResult = null;

function mapIdentityUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, username: u.user_metadata?.full_name || u.email?.split('@')[0] || '', role: (u.app_metadata?.roles || []).includes('admin') ? 'admin' : 'user', _raw: u };
}
const currentUser = () => _identityUser;

const uid = () => Math.random().toString(36).slice(2, 10);
const money = (n) => `${Number(n || 0).toFixed(2)} DKK`;

const store = () => { try { return { ...seedData, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return seedData; } };
const save = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

const normalize = (v='') => v.trim().toLowerCase().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const normalizeKey = (w) => `${normalize(w.producer)}|${normalize(w.wineName)}|${String(w.vintage || '').trim()}`;

const label = (t, f) => `<label><span>${t}</span>${f}</label>`;
const input = (n, t='text', v='', req=false, min='') => `<input class="input" name="${n}" type="${t}" value="${v || ''}" ${req ? 'required' : ''} ${min !== '' ? `min="${min}"` : ''}/>`;
const select = (n, opts, v='', req=false) => `<select class="input" name="${n}" ${req ? 'required' : ''}><option value="">Vælg...</option>${opts.map((o) => `<option value="${o}" ${o===v?'selected':''}>${o}</option>`).join('')}</select>`;
const pill = (p, txt, a) => `<a href="${p}" class="pill ${a===p?'active':''}" data-link>${txt}</a>`;

function scaleWindowRule(rule, factor = RULE_SCALE) {
  const from = Math.max(0, Math.round(rule.from * factor));
  const to = Math.max(from, Math.round(rule.to * factor));
  return { ...rule, from, to };
}

function findRule(value, rules) {
  const normalizedValue = normalize(value);
  if (!normalizedValue) return null;
  return rules.find((r) => r.matches.some((m) => normalizedValue.includes(normalize(m)))) || null;
}

function mergeWindow(current, incoming, weight) {
  const w = Math.max(0, Math.min(1, weight));
  return { from: Math.round(current.from * (1 - w) + incoming.from * w), to: Math.round(current.to * (1 - w) + incoming.to * w) };
}

function suggestDrinkWindow({ wineType, region, primaryGrape, vintage, agingCategory, currentYear = new Date().getFullYear() }) {
  if (!vintage || vintage < 1800 || vintage > currentYear + 1) return { drinkWindowFromYear: null, drinkWindowToYear: null, status: 'unknown', confidence: 'low', reasons: ['Årgang mangler/ugyldig.'], appliedRules: [] };

  const baseRaw = BASE_TYPE_RULES[normalize(wineType)] || { label: 'Baseregel: Standard', from: 2, to: 6 };
  let window = scaleWindowRule(baseRaw);
  const appliedRules = [baseRaw.label];
  const reasons = [`Basisforslag ud fra vintype: ${wineType || 'ukendt type'}`];

  const ageRuleRaw = AGING_CATEGORY_RULES[normalize(agingCategory)] || null;
  if (ageRuleRaw) {
    const ageRule = scaleWindowRule(ageRuleRaw);
    window = mergeWindow(window, ageRule, 0.6);
    appliedRules.push(ageRuleRaw.label);
    reasons.push(`Justeret af lagringskategori: ${agingCategory}`);
  }

  const grapeRaw = findRule(primaryGrape, GRAPE_RULES);
  if (grapeRaw) {
    const grapeRule = scaleWindowRule(grapeRaw);
    window = mergeWindow(window, grapeRule, 0.5);
    appliedRules.push(grapeRaw.label);
    reasons.push(`Justeret af drue: ${primaryGrape}`);
  }

  const regionRaw = findRule(region, REGION_RULES);
  if (regionRaw) {
    const regionRule = scaleWindowRule(regionRaw);
    window = mergeWindow(window, regionRule, 0.7);
    appliedRules.push(regionRaw.label);
    reasons.push(`Justeret af region: ${region}`);
  }

  window.from = Math.max(0, window.from);
  window.to = Math.max(window.from, window.to);

  const drinkWindowFromYear = vintage + window.from;
  const drinkWindowToYear = vintage + window.to;
  const status = currentYear < drinkWindowFromYear ? 'too_young' : currentYear > drinkWindowToYear ? 'past_window' : 'drink_now';

  return {
    drinkWindowFromYear,
    drinkWindowToYear,
    status,
    confidence: appliedRules.length >= 3 ? 'high' : appliedRules.length === 2 ? 'medium' : 'low',
    reasons,
    appliedRules,
    estimatedYearsFromVintage: window.from,
    estimatedYearsToVintage: window.to
  };
}

function shell(content, active='/') {
  const u = currentUser();
  const nav = `${pill('/', 'Dashboard', active)}${pill('/wines', 'Alle vine', active)}${pill('/new', 'Opret vin + køb', active)}${pill('/profile', 'Profil', active)}${u?.role === 'admin' ? pill('/admin', 'Admin', active) : ''}`;
  return `<header class="topbar"><div class="container top-row"><h1>Vinlager Manager</h1><nav>${nav}<button id="logoutBtn" class="pill logout-btn">Log ud</button></nav></div></header><main class="container">${content}</main>`;
}

function navigate(path) { history.pushState({}, '', path); render(); }
document.addEventListener('click', (e) => { const a = e.target.closest('[data-link]'); if (!a) return; e.preventDefault(); navigate(a.getAttribute('href')); });
window.addEventListener('popstate', render);

const wineById = (s, id) => s.wines.find((w) => w.id === id);
const inventoryEventsForWine = (s, wineId) => s.inventoryEvents.filter((e) => e.wineId === wineId).sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));

function getWineStats(s, wineId) {
  const purchases = s.purchases.filter((p) => p.wineId === wineId);
  const purchased = purchases.reduce((n, p) => n + Number(p.quantity || 0), 0);
  const events = inventoryEventsForWine(s, wineId);
  const added = events.filter((e) => e.type === 'add').reduce((n, e) => n + Number(e.quantity || 0), 0);
  const removed = events.filter((e) => e.type === 'remove').reduce((n, e) => n + Number(e.quantity || 0), 0);
  const consumed = s.drinkLogs.filter((l) => l.wineId === wineId).reduce((n, l) => n + Number(l.bottlesConsumed || 0), 0);
  const left = Math.max(0, purchased + added - removed - consumed);
  const avgPrice = purchases.length ? purchases.reduce((n,p)=>n+Number(p.price||0),0)/purchases.length : 0;
  const inventoryValue = left * avgPrice;

  const perLocation = { Vinlager: 0, Kælder: 0, Øvrige: 0 };
  const byLocPurchased = { Vinlager: 0, Kælder: 0, Øvrige: 0 };
  purchases.forEach((p) => {
    const loc = byLocPurchased[p.location] != null ? p.location : 'Øvrige';
    byLocPurchased[loc] += Number(p.quantity || 0);
  });
  const totalLoc = byLocPurchased.Vinlager + byLocPurchased.Kælder + byLocPurchased.Øvrige || 1;
  perLocation.Vinlager = Math.round(left * (byLocPurchased.Vinlager / totalLoc));
  perLocation.Kælder = Math.round(left * (byLocPurchased.Kælder / totalLoc));
  perLocation.Øvrige = Math.max(0, left - perLocation.Vinlager - perLocation.Kælder);

  return { purchased, added, removed, consumed, left, avgPrice, inventoryValue, perLocation };
}

function badgeStatus(w) { return w.status === 'ude' ? '<span class="badge archived">Ude</span>' : '<span class="badge active">Aktiv</span>'; }

function drinkSignalFromWineAndLogs(w, logs) {
  const now = new Date().getFullYear();
  const latest = [...logs].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0))[0];
  if (latest?.developmentLevel === 'Tired') return { text:'Drik nu', cls:'sig-red' };
  if (latest?.developmentLevel === 'Fully developed') return { text:'Drik løbende', cls:'sig-orange' };
  if (latest?.developmentLevel === 'Youthful') return { text:'For ung', cls:'sig-green' };
  const from = Number(w.drinkFrom || 0), to = Number(w.drinkTo || 0);
  if (from && now < from) return { text:'For ung', cls:'sig-green' };
  if (to && now > to) return { text:'Drik nu', cls:'sig-red' };
  if (from && to && now >= from && now <= to) return { text:'Drik løbende', cls:'sig-orange' };
  return null;
}

function dashboard(s) {
  const activeWines = s.wines.filter((w) => w.status !== 'ude');
  const bottlesByType = {}; const bottlesByCountry = {}; const valueByLocation = { Vinlager:0, Kælder:0, Øvrige:0 };
  const statusBars = { drink_now:0, too_young:0, past_window:0, unknown:0 };
  const readyNow = []; const readyRunning = [];

  activeWines.forEach((w) => {
    const st = getWineStats(s, w.id);
    if (st.left <= 0) return;
    bottlesByType[w.wineType || 'Ukendt'] = (bottlesByType[w.wineType || 'Ukendt'] || 0) + st.left;
    bottlesByCountry[w.country || 'Ukendt'] = (bottlesByCountry[w.country || 'Ukendt'] || 0) + st.left;
    valueByLocation.Vinlager += st.perLocation.Vinlager * st.avgPrice;
    valueByLocation.Kælder += st.perLocation.Kælder * st.avgPrice;
    valueByLocation.Øvrige += st.perLocation.Øvrige * st.avgPrice;

    const now = new Date().getFullYear();
    const from = Number(w.drinkFrom || 0), to = Number(w.drinkTo || 0);
    const logs = s.drinkLogs.filter((l) => l.wineId === w.id);
    const latest = [...logs].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0))[0];

    const helperStatus = suggestDrinkWindow({ wineType: w.wineType, region: w.region, primaryGrape: w.primaryGrape, vintage: Number(w.vintage || 0), agingCategory: w.agingCategory }).status;
    statusBars[helperStatus] = (statusBars[helperStatus] || 0) + 1;

    if (from && to && now >= from && now <= to) readyRunning.push({ w, st });
    if ((from && to && to === now) || latest?.developmentLevel === 'Tired') readyNow.push({ w, st });
  });

  const latestTasting = [...s.drinkLogs].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0))[0];
  const latestWine = latestTasting ? wineById(s, latestTasting.wineId) : null;

  const miniRows = (obj) => Object.entries(obj).map(([k,v]) => `<div class="mini-row"><span>${k}</span><b>${v}</b></div>`).join('') || '<p class="muted">Ingen data.</p>';

  return shell(`
    <section class="hero card"><h2>Dashboard</h2><p>Beslutningsværktøj for lager og drikkeklarhed.</p></section>
    <section class="grid cols3">
      <article class="card"><small>Flasker i alt (aktive)</small><h3>${Object.values(bottlesByType).reduce((a,b)=>a+b,0)}</h3></article>
      <article class="card"><small>Vine klar til at drikke nu</small><h3>${readyNow.length}</h3></article>
      <article class="card"><small>Vine uden drikkevindue</small><h3>${activeWines.filter((w)=>!w.drinkFrom || !w.drinkTo).length}</h3></article>
    </section>
    <section class="grid cols3">
      <article class="card"><h3>Flasker pr. vintype</h3>${miniRows(bottlesByType)}</article>
      <article class="card"><h3>Flasker pr. land</h3>${miniRows(bottlesByCountry)}</article>
      <article class="card"><h3>Værdi pr. placering</h3>${miniRows({ Vinlager: money(valueByLocation.Vinlager), Kælder: money(valueByLocation.Kælder), Øvrige: money(valueByLocation.Øvrige) })}</article>
    </section>
    <section class="grid cols2">
      <article class="card"><h3>Status: klar nu / for tidlig / over vindue / ukendt</h3>${miniRows({ 'Klar nu':statusBars.drink_now, 'For tidlig':statusBars.too_young, 'Over vindue':statusBars.past_window, 'Ukendt':statusBars.unknown })}</article>
      <article class="card"><h3>Flasker i alt pr. placering</h3>${miniRows({ Vinlager: activeWines.reduce((n,w)=>n+getWineStats(s,w.id).perLocation.Vinlager,0), Kælder: activeWines.reduce((n,w)=>n+getWineStats(s,w.id).perLocation.Kælder,0), Øvrige: activeWines.reduce((n,w)=>n+getWineStats(s,w.id).perLocation.Øvrige,0) })}</article>
    </section>
    <section class="grid cols2">
      <article class="card"><h3>Klar til at drikke løbende</h3>${readyRunning.length ? readyRunning.map(({w,st})=>`<p><a href="/wines/${w.id}" data-link>${w.producer} ${w.wineName}</a> · ${w.drinkFrom}-${w.drinkTo} · ${st.left} fl. <span class="signal sig-orange">Drik løbende</span></p>`).join('') : '<p class="muted">Ingen endnu.</p>'}</article>
      <article class="card"><h3>Klar til at drikke nu</h3>${readyNow.length ? readyNow.map(({w,st})=>`<p><a href="/wines/${w.id}" data-link>${w.producer} ${w.wineName}</a> · ${st.left} fl. <span class="signal sig-red">Drik nu</span></p>`).join('') : '<p class="muted">Ingen endnu.</p>'}</article>
    </section>
    <section class="grid cols2">
      <article class="card"><h3>Seneste smagning</h3>${latestTasting ? `<p><b>${latestWine ? `${latestWine.producer} ${latestWine.wineName}` : 'Ukendt vin'}</b></p><p>Dato: ${latestTasting.date}</p><p>Kvalitet: ${latestTasting.quality}</p><p>${(latestTasting.notes||'').slice(0,90) || '-'}</p><a class="btn" href="/tastings/${latestTasting.id}" data-link>Se smagning</a>` : '<p class="muted">Ingen smagninger endnu.</p>'}</article>
      <article class="card"><h3>Seneste køb</h3>${[...s.purchases].sort((a,b)=>new Date(b.purchaseDate||0)-new Date(a.purchaseDate||0)).slice(0,5).map((p)=>{const w=wineById(s,p.wineId); return `<p>${p.purchaseDate} · ${w ? `${w.producer} ${w.wineName}` : 'Ukendt'} · ${p.quantity} fl.</p>`;}).join('') || '<p class="muted">Ingen køb endnu.</p>'}</article>
    </section>
  `, '/');
}

function wineCard(s, w) {
  const st = getWineStats(s, w.id);
  const logs = s.drinkLogs.filter((l)=>l.wineId===w.id);
  const sig = drinkSignalFromWineAndLogs(w, logs);
  return `<article class="card wine-card ${w.status==='ude'?'archived-card':''}">
    <h3>${w.producer} · ${w.wineName}</h3>
    <p><span class="flag">${countryFlags[w.country] || '🏳️'}</span> ${w.country || '-'} / ${w.region || '-'}</p>
    <p>${w.vintage || '-'} · ${w.wineType || '-'} / ${w.primaryGrape || '-'}</p>
    <p>Flasker tilbage: <b>${st.left}</b></p>
    <p>Drikkevindue: ${w.drinkFrom || '-'} - ${w.drinkTo || '-'}</p>
    <p>${badgeStatus(w)} ${sig ? `<span class="signal ${sig.cls}">${sig.text}</span>` : ''}</p>
    <div class="row-gap"><a class="btn dark" href="/wines/${w.id}/edit" data-link>Rediger</a><a class="btn" href="/wines/${w.id}" data-link>Detaljer</a></div>
  </article>`;
}

function winesPage() {
  return shell(`<section class="card"><h2>Alle vine</h2><div class="grid cols3">${label('Søg', input('search'))}${label('Placering', select('location', OPTIONS.locations))}${label('Land', select('country', OPTIONS.countries))}${label('Region', input('region'))}${label('Vintype', select('wineType', OPTIONS.wineTypes))}${label('Drue', input('primaryGrape'))}${label('Status', select('status', ['aktiv', 'ude']))}${label('Flaskevolumen', select('bottleVolume', OPTIONS.bottleVolumes.filter((x)=>x!=='Anden størrelse')))}${label('Emballage', select('packagingStatus', OPTIONS.packagingStatus))}${label('Årgang fra', input('vintageFrom','number'))}${label('Årgang til', input('vintageTo','number'))}${label('Sortering', select('sortBy',['navn','producent','årgang','antal flasker','pris per flaske','samlet værdi','drikkevindue fra','drikkevindue til','seneste køb']))}</div><label><input type="checkbox" id="showArchived"/> Vis ude</label></section><section id="wine-list" class="grid cols3"></section><p id="empty" class="muted" style="display:none">Ingen vine matcher filtrene.</p>`, '/wines');
}

function renderWsetDescriptors(values = {}) {
  const chk = (name, val) => `<label class="chip check-chip"><input type="checkbox" name="${name}" value="${val}" ${(values[name]||[]).includes(val)?'checked':''}/> ${val}</label>`;
  return `
    <h4>Primære karakteristika</h4>
    <p><b>Frugt</b></p><div class="chips">${WSET_DESCRIPTORS.primary.fruit.map((v)=>chk('primaryFruit',v)).join('')}</div>
    <p><b>Blomst</b></p><div class="chips">${WSET_DESCRIPTORS.primary.floral.map((v)=>chk('primaryFloral',v)).join('')}</div>
    <p><b>Krydderi</b></p><div class="chips">${WSET_DESCRIPTORS.primary.spice.map((v)=>chk('primarySpice',v)).join('')}</div>
    <p><b>Andre ikke-fadede primære noter</b></p><div class="chips">${WSET_DESCRIPTORS.primary.otherPrimary.map((v)=>chk('primaryOther',v)).join('')}</div>
    <h4>Sekundære karakteristika</h4>
    <p><b>Fadprægsnoter</b></p><div class="chips">${WSET_DESCRIPTORS.secondary.oak.map((v)=>chk('secondaryOak',v)).join('')}</div>
    <p><b>Gær / autolyse</b></p><div class="chips">${WSET_DESCRIPTORS.secondary.yeastAutolysis.map((v)=>chk('secondaryYeast',v)).join('')}</div>
    <p><b>Vinifikationspræg</b></p><div class="chips">${WSET_DESCRIPTORS.secondary.vinification.map((v)=>chk('secondaryVinification',v)).join('')}</div>
    <h4>Tertiære karakteristika</h4>
    <div class="chips">${WSET_DESCRIPTORS.tertiary.map((v)=>chk('tertiary',v)).join('')}</div>
  `;
}

function tastingForm() {
  const fields = [
    ['quality','Kvalitet',OPTIONS.quality], ['developmentLevel','Udviklingsniveau',OPTIONS.developmentLevel], ['sweetness','Sødhed',OPTIONS.sweetness],
    ['acidity','Syre',OPTIONS.acidity], ['tannin','Tannin',OPTIONS.tannin], ['alcohol','Alkohol',OPTIONS.alcohol],
    ['body','Krop',OPTIONS.body], ['aromaIntensity','Aroma intensitet',OPTIONS.aromaIntensity], ['flavourIntensity','Smags intensitet',OPTIONS.flavourIntensity], ['finish','Finish',OPTIONS.finish]
  ];
  return `<form id="logForm" class="card"><h3>Log smagning (WSET Level 2)</h3><div class="grid cols3">${label('Dato', input('date','date',new Date().toISOString().slice(0,10),true))}${label('Antal flasker åbnet', input('bottlesConsumed','number',1,true,1))}${fields.map(([n,t,o])=>label(t,select(n,o,'',true))).join('')}</div>${renderWsetDescriptors()}${label('Blev den drukket sammen med mad?', select('withFood',['Ja','Nej'],'Nej',true))}${label('Mad-note (fritekst)', input('foodPairing'))}${label('Note (fritekst)', `<textarea class="input" name="notes" rows="3"></textarea>`)}<button class="btn" type="submit">Gem smagning</button></form>`;
}


function renderTastingTimeline(logs) {
  return `<div class="timeline-wrap">${logs.map((l,i)=>`<a href="/tastings/${l.id}" data-link class="timeline-item ${i % 2 ? 'right' : 'left'}"><span class="dot"></span><div class="timeline-card"><h4>Smagning ${i+1}</h4><p><b>Dato:</b> ${l.date}</p><p><b>Kvalitet:</b> ${l.quality}</p><p><b>Udviklingsniveau:</b> ${l.developmentLevel}</p><p><b>Note:</b> ${(l.notes||'-').slice(0,100)}</p></div></a>`).join('')}</div>`;
}

function wineDetail(s, id) {
  const w = wineById(s, id); if (!w) return shell('<p>Vin ikke fundet.</p>', '/wines');
  const st = getWineStats(s, id);
  const purchases = s.purchases.filter((p)=>p.wineId===id).sort((a,b)=>new Date(b.purchaseDate||0)-new Date(a.purchaseDate||0));
  const events = inventoryEventsForWine(s,id).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  const logs = s.drinkLogs.filter((l)=>l.wineId===id).sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
  return shell(`<section class="card"><h2>${w.producer} — ${w.wineName}</h2><p>${w.vintage} · ${w.country}/${w.region} · ${w.primaryGrape} · ${badgeStatus(w)}</p><p>Flasker tilbage: <b>${st.left}</b></p><a class="btn" href="/wines/${id}/edit" data-link>Rediger vin</a></section><section class="grid cols2"><article class="card"><h3>Købshistorik</h3>${purchases.length?purchases.map((p)=>`<p>${p.purchaseDate} · ${p.quantity} fl. · ${p.price} ${p.currency} · ${p.location} · ${p.bottleVolumeMl||'-'} ml · ${p.packagingStatus||'-'} · ${p.note||''}</p>`).join(''):'<p>Ingen køb.</p>'}</article><article class="card"><h3>Lagerhændelser</h3>${events.length?events.map((e)=>`<p>${e.date} · ${e.type} · ${e.quantity||0} · ${e.note||''}</p>`).join(''):'<p>Ingen hændelser.</p>'}</article></section><section class="card"><h3>Smagningshistorik</h3>${logs.length?renderTastingTimeline(logs):'<p>Ingen smagninger.</p>'}</section>${tastingForm()}`, '/wines');
}

function editWinePage(s, id) {
  const w = wineById(s,id); if(!w) return shell('<p>Vin ikke fundet.</p>','/wines');
  const st = getWineStats(s,id);
  const regions = getRegionsForCountry(w.country);
  return shell(`<section class="card"><h2>Rediger vin</h2><p><b>${w.producer} ${w.wineName} (${w.vintage})</b></p><p>Flasker tilbage: <b>${st.left}</b> · Status: ${badgeStatus(w)}</p></section><section class="grid cols2"><article class="card"><h3>Stamdata</h3><form id="editWineDataForm">${label('Producent',input('producer','text',w.producer,true))}${label('Vinens navn',input('wineName','text',w.wineName,true))}${label('Årgang',input('vintage','number',w.vintage,true,1800))}${label('Land',select('country',OPTIONS.countries,w.country,true))}${label('Region',`<select class="input" name="region" id="editRegionSelect">${regions.map((r)=>`<option value="${r}" ${r===w.region?'selected':''}>${r}</option>`).join('')}</select>`)}<div id="editCustomRegionWrap" style="display:${shouldShowCustomRegionInput(w.region)?'block':'none'}">${label('Brugerdefineret region',input('regionCustom','text',shouldShowCustomRegionInput(w.region)?w.region:''))}</div>${label('Appellation',input('appellation','text',w.appellation||''))}${label('Primær drue',select('primaryGrape',OPTIONS.grapes.concat(['Anden']),OPTIONS.grapes.includes(w.primaryGrape)?w.primaryGrape:'Anden',true))}<div id="editCustomGrapeWrap" style="display:${OPTIONS.grapes.includes(w.primaryGrape)?'none':'block'}">${label('Brugerdefineret drue',input('grapeCustom','text',OPTIONS.grapes.includes(w.primaryGrape)?'':w.primaryGrape))}</div>${label('Vintype',select('wineType',OPTIONS.wineTypes,w.wineType,true))}${label('Lagringskategori',select('agingCategory',['Drik ung','Mellem lagring','Lang lagring','Meget lang lagring'],w.agingCategory||'',false))}${label('Drikkevindue fra',input('drinkFrom','number',w.drinkFrom||'',false,1900))}${label('Drikkevindue til',input('drinkTo','number',w.drinkTo||'',false,1900))}${label('Flaskevolumen (ml)',input('bottleVolumeMl','number',w.bottleVolumeMl||'',false,1))}${label('Emballagestatus',select('packagingStatus',OPTIONS.packagingStatus,w.packagingStatus||'Ingen',false))}${label('Blend',`<textarea class="input" name="blend" rows="2">${w.blend||''}</textarea>`)}${label('Generelle noter',`<textarea class="input" name="notes" rows="3">${w.notes||''}</textarea>`)}<button class="btn" type="submit">Gem stamdata</button><button class="btn dark" id="suggestWindowBtn" type="button">Foreslå drikkevindue</button><p id="windowSuggestionMsg" class="muted"></p></form></article><article class="card"><h3>Lagerregulering</h3><form id="addStockForm">${label('Tilføj flasker',input('quantity','number',1,true,1))}${label('Dato',input('date','date',new Date().toISOString().slice(0,10),true))}${label('Note',input('note'))}<button class="btn" type="submit">Tilføj</button></form><form id="removeStockForm">${label('Fjern flasker',input('quantity','number',1,true,1))}${label('Dato',input('date','date',new Date().toISOString().slice(0,10),true))}${label('Note',input('note'))}<button class="btn" type="submit">Fjern</button></form><p id="stockStatus" class="muted"></p>${w.status==='ude' ? '<button class="btn" id="reactivateBtn">Åbn igen</button>' : '<button class="btn dark" id="archiveBtn">Marker som ude</button>'}</article></section><section class="card"><h3>Købshistorik</h3>${s.purchases.filter((p)=>p.wineId===id).map((p)=>`<p>${p.purchaseDate} · ${p.quantity} fl. · ${p.price} ${p.currency} · ${p.location} · ${p.bottleVolumeMl||'-'} ml · ${p.packagingStatus||'-'} · ${p.note||''}</p>`).join('')||'<p>Ingen køb.</p>'}</section>`, '/wines');
}

function tastingDetailPage(s,id){
  const t = s.drinkLogs.find((x)=>x.id===id); if(!t) return shell('<p>Smagning ikke fundet.</p>','/');
  const w = wineById(s,t.wineId);
  const arr = (k) => (t.wsetDescriptors?.[k] || []).join(', ') || '-';
  return shell(`<article class="card"><a href="/wines/${t.wineId}" data-link>← Tilbage til vin</a><h2>Smagningsdetaljer (WSET Level 2)</h2><p><b>Vin:</b> ${w?`${w.producer} ${w.wineName}`:'Ukendt'}</p><h3>Struktur</h3><p>Dato: ${t.date}</p><p>Antal flasker åbnet: ${t.bottlesConsumed}</p><p>Kvalitet: ${t.quality}</p><p>Udviklingsniveau: ${t.developmentLevel}</p><p>Sødhed: ${t.sweetness}</p><p>Syre: ${t.acidity}</p><p>Tannin: ${t.tannin}</p><p>Alkohol: ${t.alcohol}</p><p>Krop: ${t.body}</p><p>Aroma intensitet: ${t.aromaIntensity}</p><p>Smags intensitet: ${t.flavourIntensity}</p><p>Finish: ${t.finish}</p><h3>Primære karakteristika</h3><p>Frugt: ${arr('primaryFruit')}</p><p>Blomst: ${arr('primaryFloral')}</p><p>Krydderi: ${arr('primarySpice')}</p><p>Andre: ${arr('primaryOther')}</p><h3>Sekundære karakteristika</h3><p>Fadpræg: ${arr('secondaryOak')}</p><p>Gær/autolyse: ${arr('secondaryYeast')}</p><p>Vinifikationspræg: ${arr('secondaryVinification')}</p><h3>Tertiære karakteristika</h3><p>${arr('tertiary')}</p><h3>Supplerende felter</h3><p>Med mad: ${t.withFood||'Nej'}</p><p>Madnote: ${t.foodPairing||'-'}</p><p>Note: ${t.notes||'-'}</p></article>`, '/');
}

function profilePage(){ const u=currentUser(); return shell(`<section class="card"><h2>Min profil</h2><form id="profileForm" class="grid cols2">${label('Visningsnavn',input('username','text',u?.username||'',true))}${label('Email',`<input class="input" name="email" type="email" value="${u?.email||''}" disabled/>`)}<div><span class="muted" style="font-size:13px">Email kan ikke ændres herfra.</span></div>${label('Nyt kodeord',input('password','password','',false))}<div></div><button class="btn" type="submit">Gem profil</button></form><p id="profileStatus" class="muted"></p></section>`, '/profile'); }

function adminPage(){
  const u = currentUser();
  return shell(`<section class="card"><h2>Administration</h2><p>Logget ind som: <b>${u?.username || u?.email}</b> (${u?.role})</p><div class="card"><h3>Brugerstyring</h3><p class="muted">Brugere administreres via Netlify Identity-dashboardet.</p><p>Gå til <b>Project configuration &rarr; Identity</b> i Netlify for at oprette, redigere og slette brugere samt tildele roller.</p></div></section>`, '/admin');
}

function loginPage(){
  const showReset = _authCallbackResult?.type === 'recovery';
  if (showReset) {
    return `<main class="login-main"><section class="login-card"><div class="login-header"><h1>Vinlager Manager</h1><p class="muted">Nulstil dit kodeord</p></div><div id="resetPanel"><form id="resetForm">${label('Nyt kodeord (min. 6 tegn)',input('password','password','',true))}<button class="btn login-submit-btn" type="submit">Opdater kodeord</button></form><p id="resetStatus" class="login-status"></p></div></section></main>`;
  }
  return `<main class="login-main"><section class="login-card"><div class="login-header"><h1>Vinlager Manager</h1><p class="muted">Din personlige vinlagerstyring</p></div><div class="login-tabs"><button class="login-tab active" data-tab="login">Log ind</button><button class="login-tab" data-tab="signup">Opret konto</button></div><div id="loginPanel" class="login-panel active"><form id="loginForm">${label('Email',input('email','email','',true))}${label('Kodeord',input('password','password','',true))}<button class="btn login-submit-btn" type="submit">Log ind</button></form><p id="loginStatus" class="login-status"></p><button type="button" id="forgotPasswordBtn" class="link-btn">Glemt kodeord?</button></div><div id="signupPanel" class="login-panel"><form id="signupForm">${label('Navn',input('name','text','',true))}${label('Email',input('email','email','',true))}${label('Kodeord (min. 6 tegn)',input('password','password','',true))}<button class="btn login-submit-btn" type="submit">Opret konto</button></form><p id="signupStatus" class="login-status"></p></div><div id="recoveryPanel" class="login-panel"><p class="muted">Indtast din email, så sender vi et link til at nulstille dit kodeord.</p><form id="recoveryForm">${label('Email',input('email','email','',true))}<button class="btn login-submit-btn" type="submit">Send nulstillingslink</button></form><p id="recoveryStatus" class="login-status"></p><button type="button" id="backToLoginBtn" class="link-btn">&larr; Tilbage til login</button></div></section></main>`;
}

function importBlock(){
  return `<section class="card"><h3>Import / eksport</h3><div class="row-gap"><button class="btn" id="downloadCsvTemplate">Download template CSV</button><button class="btn dark" id="downloadXlsxTemplate">Download template XLSX</button><input id="bulkFile" type="file" class="input" accept=".csv,.xlsx"/><button class="btn" id="previewImportBtn">Preview import</button></div><div id="importPreview" class="card"></div><p id="importStatus" class="muted"></p></section>`;
}

function createPage(){
  return shell(`<section class="card"><h2>Opret vin + første køb</h2><form id="createWineForm"><div class="grid cols2">${label('Producent',input('producer','text','',true))}${label('Vinens navn',input('wineName','text','',true))}${label('Årgang',input('vintage','number','',true,1800))}${label('Land',select('country',OPTIONS.countries,'',true))}${label('Region',`<select class="input" name="region" id="regionSelect"></select>`)}<div id="customRegionWrap" style="display:none">${label('Brugerdefineret region', input('regionCustom'))}</div>${label('Appellation',input('appellation'))}${label('Primær drue',select('primaryGrape',OPTIONS.grapes.concat(['Anden']),'',true))}<div id="customGrapeWrap" style="display:none">${label('Brugerdefineret drue',input('grapeCustom'))}</div>${label('Vintype',select('wineType',OPTIONS.wineTypes,'',true))}${label('Lagringskategori',select('agingCategory',['Drik ung','Mellem lagring','Lang lagring','Meget lang lagring'],'',false))}${label('Drikkevindue fra (år)',input('drinkFrom','number','',false,1900))}${label('Drikkevindue til (år)',input('drinkTo','number','',false,1900))}${label('Købsdato',input('purchaseDate','date',new Date().toISOString().slice(0,10),true))}${label('Antal flasker',input('quantity','number',1,true,1))}${label('Pris per flaske',input('price','number',0,true,0))}${label('Valuta',select('currency',OPTIONS.currency,'DKK',true))}${label('Forhandler',input('retailer'))}${label('Placering',select('location',OPTIONS.locations,'Vinlager',true))}${label('Flaskevolumen (ml)',select('bottleVolumeMl',OPTIONS.bottleVolumes,'750',false))}<div id="customVolumeWrap" style="display:none">${label('Anden størrelse (ml)',input('bottleVolumeCustom','number','',false,1))}</div>${label('Emballagestatus',select('packagingStatus',OPTIONS.packagingStatus,'Ingen',false))}</div>${label('Blend',`<textarea class="input" name="blend" rows="2"></textarea>`)}${label('Generelle noter',`<textarea class="input" name="notes" rows="3"></textarea>`)}<button class="btn dark" type="button" id="suggestWindowFromRulesBtn">Foreslå drikkevindue</button><p id="createWindowMsg" class="muted"></p><button class="btn" type="submit">Gem vin og køb</button></form></section>${importBlock()}`, '/new');
}

function rowsToCsv(rows){
  const cols = ['producent','vinens_navn','årgang','land','region','appellation','primær_drue','vintype','antal_flasker','pris_per_flaske','placering','drikkevindue_fra','drikkevindue_til','købsdato','valuta','forhandler','flaskevolumen_ml','emballagestatus','blend','generelle_noter','status'];
  if(!rows.length) return cols.join(',');
  const esc = (v)=>`"${String(v??'').replaceAll('"','""')}"`;
  return [cols.join(','), ...rows.map((r)=>cols.map((c)=>esc(r[c])).join(','))].join('\n');
}

function rowsToFakeXlsx(rows){
  const cols = ['producent','vinens_navn','årgang','land','region','appellation','primær_drue','vintype','antal_flasker','pris_per_flaske','placering','drikkevindue_fra','drikkevindue_til','købsdato','valuta','forhandler','flaskevolumen_ml','emballagestatus','blend','generelle_noter','status'];
  if(!rows.length) return cols.join('\t');
  return [cols.join('\t'), ...rows.map((r)=>cols.map((c)=>String(r[c]??'')).join('\t'))].join('\n');
}

function exportRows(s, includeArchived, filteredIds = null){
  return s.wines
    .filter((w)=>includeArchived || w.status !== 'ude')
    .filter((w)=>!filteredIds || filteredIds.has(w.id))
    .map((w)=>{
      const st = getWineStats(s,w.id);
      const p = s.purchases.filter((x)=>x.wineId===w.id)[0] || {};
      return {
        producent:w.producer, vinens_navn:w.wineName, årgang:w.vintage, land:w.country, region:w.region, appellation:w.appellation||'', primær_drue:w.primaryGrape, vintype:w.wineType, antal_flasker:st.left, pris_per_flaske:p.price||'', placering:p.location||'', drikkevindue_fra:w.drinkFrom||'', drikkevindue_til:w.drinkTo||'', købsdato:p.purchaseDate||'', valuta:p.currency||'DKK', forhandler:p.retailer||'', flaskevolumen_ml:w.bottleVolumeMl||'', emballagestatus:w.packagingStatus||'', blend:w.blend||'', generelle_noter:w.notes||'', status:w.status||'aktiv'
      };
    });
}

function parseDelimited(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  if(lines.length < 2) return { rows: [], errors: ['Filen indeholder ingen datarækker.'] };
  const delim = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
  const split = (line) => line.split(delim).map((x)=>x.trim().replace(/^"|"$/g,''));
  const headers = split(lines[0]).map((h)=>normalize(h));
  const required = ['producent','vinens_navn','årgang','land','region','primær_drue','vintype','antal_flasker','pris_per_flaske','placering'];
  const errors = [];
  required.forEach((r)=>{ if(!headers.includes(normalize(r))) errors.push(`Mangler kolonne: ${r}`); });
  if(errors.length) return { rows:[], errors };
  const idx = (k)=>headers.indexOf(normalize(k));

  const rows = lines.slice(1).map((line,i)=>{
    const c = split(line);
    const row = {
      producer:c[idx('producent')]||'', wineName:c[idx('vinens_navn')]||'', vintage:c[idx('årgang')]||'', country:c[idx('land')]||'', region:c[idx('region')]||'', appellation:c[idx('appellation')]||'', primaryGrape:c[idx('primær_drue')]||'', wineType:c[idx('vintype')]||'', quantity:c[idx('antal_flasker')]||'', price:c[idx('pris_per_flaske')]||'', location:c[idx('placering')]||'', drinkFrom:c[idx('drikkevindue_fra')]||'', drinkTo:c[idx('drikkevindue_til')]||'', purchaseDate:c[idx('købsdato')]||'', currency:c[idx('valuta')]||'DKK', retailer:c[idx('forhandler')]||'', bottleVolumeMl:c[idx('flaskevolumen_ml')]||'', packagingStatus:c[idx('emballagestatus')]||'Ingen', blend:c[idx('blend')]||'', notes:c[idx('generelle_noter')]||'', status:c[idx('status')]||'aktiv'
    };
    const rowErrors = [];
    if(!row.producer || !row.wineName) rowErrors.push('mangler producent/vinens_navn');
    if(!/^\d{4}$/.test(String(row.vintage))) rowErrors.push('ugyldig årgang');
    if(Number(row.quantity) <= 0) rowErrors.push('antal_flasker skal være > 0');
    if(Number(row.price) < 0) rowErrors.push('pris_per_flaske skal være >= 0');
    if(row.drinkFrom && !/^\d{4}$/.test(String(row.drinkFrom))) rowErrors.push('ugyldig drikkevindue_fra');
    if(row.drinkTo && !/^\d{4}$/.test(String(row.drinkTo))) rowErrors.push('ugyldig drikkevindue_til');
    return { row, rowErrors, line: i + 2 };
  });
  return { rows, errors: [] };
}

function applyImport(s, parsedRows){
  let createdWines=0, updatedWines=0, createdPurchases=0, errorRows=0;
  const report = [];
  const next = JSON.parse(JSON.stringify(s));

  parsedRows.forEach(({row,rowErrors,line})=>{
    if(rowErrors.length){ errorRows += 1; report.push(`Linje ${line}: ${rowErrors.join(', ')}`); return; }

    const exactKey = `${normalize(row.producer)}|${normalize(row.wineName)}|${String(row.vintage).trim()}`;
    const exact = next.wines.find((w)=>normalizeKey(w)===exactKey);
    const uncertain = !exact && next.wines.find((w)=>normalize(w.producer)===normalize(row.producer) && normalize(w.wineName)===normalize(row.wineName));

    let wineId;
    if(exact){ wineId = exact.id; updatedWines += 1; }
    else {
      wineId = uid();
      next.wines.push({ id:wineId, producer:row.producer, wineName:row.wineName, vintage:Number(row.vintage), country:row.country, region:row.region, appellation:row.appellation, primaryGrape:row.primaryGrape, wineType:row.wineType, drinkFrom:row.drinkFrom||'', drinkTo:row.drinkTo||'', blend:row.blend||'', notes:row.notes||'', bottleVolumeMl:row.bottleVolumeMl||'', packagingStatus:row.packagingStatus||'Ingen', status:row.status==='ude'?'ude':'aktiv' });
      createdWines += 1;
      if(uncertain) report.push(`Linje ${line}: mulig eksisterende vin fundet (${uncertain.producer} ${uncertain.wineName}) - oprettede ny.`);
    }

    next.purchases.push({ id:uid(), wineId, purchaseDate:row.purchaseDate || new Date().toISOString().slice(0,10), quantity:Number(row.quantity), price:Number(row.price), currency:row.currency || 'DKK', retailer:row.retailer || '', location:row.location || 'Vinlager', bottleVolumeMl:row.bottleVolumeMl || '', packagingStatus:row.packagingStatus || 'Ingen', note:'Import' });
    next.inventoryEvents.push({ id:uid(), wineId, date:row.purchaseDate || new Date().toISOString().slice(0,10), type:'purchase', quantity:Number(row.quantity), note:'Import purchase' });
    createdPurchases += 1;
  });

  return { next, summary:{ createdWines, updatedWines, createdPurchases, errorRows, report } };
}

function dl(name, content, type='text/csv'){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); }

function bindRegion(countrySelector, regionSelector, customWrapId, customInputName){
  const c = document.querySelector(countrySelector), r = document.querySelector(regionSelector);
  if(!c || !r) return;
  const renderRegions = () => {
    const regions = getRegionsForCountry(c.value);
    r.innerHTML = regions.map((x)=>`<option value="${x}">${x}</option>`).join('');
    const customWrap = document.getElementById(customWrapId);
    const customInput = document.querySelector(`[name="${customInputName}"]`);
    const toggle = () => {
      const on = shouldShowCustomRegionInput(r.value);
      if(customWrap) customWrap.style.display = on ? 'block' : 'none';
      if(customInput) customInput.required = on;
    };
    r.onchange = toggle;
    toggle();
  };
  c.onchange = renderRegions;
  renderRegions();
}

function attachHandlers(path,s){
  const logout = document.getElementById('logoutBtn'); if(logout) logout.onclick = async ()=>{ try { await identityLogout(); } catch(e) {} _identityUser = null; navigate('/login'); };

  if(path === '/login'){
    document.querySelectorAll('.login-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.login-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(tab.dataset.tab + 'Panel');
        if (panel) panel.classList.add('active');
      };
    });

    const forgotBtn = document.getElementById('forgotPasswordBtn');
    if (forgotBtn) forgotBtn.onclick = () => {
      document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.login-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('recoveryPanel').classList.add('active');
    };

    const backBtn = document.getElementById('backToLoginBtn');
    if (backBtn) backBtn.onclick = () => {
      document.querySelectorAll('.login-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
      document.getElementById('loginPanel').classList.add('active');
      const loginTab = document.querySelector('[data-tab="login"]');
      if (loginTab) loginTab.classList.add('active');
    };

    const loginForm = document.getElementById('loginForm');
    if(loginForm) loginForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(loginForm); const status=document.getElementById('loginStatus'); const btn=loginForm.querySelector('button[type="submit"]'); btn.disabled=true; btn.textContent='Logger ind...'; try { const user = await identityLogin(fd.get('email'), fd.get('password')); _identityUser = mapIdentityUser(user); navigate(_identityUser.role==='admin'?'/admin':'/'); } catch(error) { if(error instanceof AuthError){ status.textContent = error.status===401?'Forkert email eller kodeord.':error.message; } else { status.textContent='Der opstod en fejl. Prøv igen.'; } status.className='login-status error'; } finally { btn.disabled=false; btn.textContent='Log ind'; } };

    const signupForm = document.getElementById('signupForm');
    if(signupForm) signupForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(signupForm); const status=document.getElementById('signupStatus'); const btn=signupForm.querySelector('button[type="submit"]'); btn.disabled=true; btn.textContent='Opretter...'; try { const user = await identitySignup(fd.get('email'), fd.get('password'), { full_name: fd.get('name') }); if(user.emailVerified){ _identityUser = mapIdentityUser(user); navigate('/'); } else { status.textContent='Konto oprettet! Tjek din email for at bekræfte din konto.'; status.className='login-status success'; } } catch(error) { if(error instanceof AuthError){ if(error.status===403) status.textContent='Oprettelse er ikke tilladt for denne side.'; else if(error.status===422) status.textContent='Ugyldig email eller kodeord (min. 6 tegn).'; else status.textContent=error.message; } else { status.textContent='Der opstod en fejl. Prøv igen.'; } status.className='login-status error'; } finally { btn.disabled=false; btn.textContent='Opret konto'; } };

    const recoveryForm = document.getElementById('recoveryForm');
    if(recoveryForm) recoveryForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(recoveryForm); const status=document.getElementById('recoveryStatus'); try { await requestPasswordRecovery(fd.get('email')); status.textContent='Nulstillingslink sendt! Tjek din email.'; status.className='login-status success'; } catch(error) { status.textContent = error instanceof AuthError ? error.message : 'Der opstod en fejl.'; status.className='login-status error'; } };

    const resetForm = document.getElementById('resetForm');
    if(resetForm) resetForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(resetForm); const status=document.getElementById('resetStatus'); try { await updateUser({ password: fd.get('password') }); _authCallbackResult = null; status.textContent='Kodeord opdateret! Omdirigerer...'; status.className='login-status success'; setTimeout(()=>navigate('/'), 1500); } catch(error) { status.textContent = error instanceof AuthError ? error.message : 'Der opstod en fejl.'; status.className='login-status error'; } };
  }

  if(path === '/admin'){
    // Admin page is informational only - user management is via Netlify dashboard
  }

  if(path === '/profile'){
    const form = document.getElementById('profileForm');
    if(form) form.onsubmit=async (e)=>{ e.preventDefault(); const fd=new FormData(form); const status=document.getElementById('profileStatus'); try { const updates = { data: { full_name: fd.get('username') } }; if(fd.get('password')) updates.password = fd.get('password'); await updateUser(updates); const u = await getUser(); _identityUser = mapIdentityUser(u); status.textContent='Profil opdateret.'; } catch(error) { status.textContent = error instanceof AuthError ? error.message : 'Der opstod en fejl.'; } };
  }

  if(path === '/wines'){
    const renderList = ()=>{
      const q=(document.querySelector('[name="search"]').value||'').toLowerCase();
      const location=document.querySelector('[name="location"]').value; const country=document.querySelector('[name="country"]').value; const region=(document.querySelector('[name="region"]').value||'').toLowerCase(); const wineType=document.querySelector('[name="wineType"]').value; const grape=(document.querySelector('[name="primaryGrape"]').value||'').toLowerCase(); const status=document.querySelector('[name="status"]').value; const volume=document.querySelector('[name="bottleVolume"]').value; const packaging=document.querySelector('[name="packagingStatus"]').value; const vFrom=Number(document.querySelector('[name="vintageFrom"]').value||0); const vTo=Number(document.querySelector('[name="vintageTo"]').value||9999); const sortBy=document.querySelector('[name="sortBy"]').value; const showArchived=document.getElementById('showArchived').checked;
      const list=document.getElementById('wine-list'); const empty=document.getElementById('empty');
      const filtered=s.wines.filter((w)=>{
        const st=getWineStats(s,w.id); const text=`${w.producer} ${w.wineName} ${w.region} ${w.country} ${w.primaryGrape} ${w.vintage}`.toLowerCase();
        if(!showArchived && w.status==='ude') return false;
        if(q && !text.includes(q)) return false;
        if(location && st.perLocation[location] <= 0) return false;
        if(country && w.country!==country) return false;
        if(region && !(w.region||'').toLowerCase().includes(region)) return false;
        if(wineType && w.wineType!==wineType) return false;
        if(grape && !(w.primaryGrape||'').toLowerCase().includes(grape)) return false;
        if(status && (w.status||'aktiv')!==status) return false;
        if(volume && String(w.bottleVolumeMl||'')!==String(volume)) return false;
        if(packaging && (w.packagingStatus||'Ingen')!==packaging) return false;
        if(Number(w.vintage||0) < vFrom || Number(w.vintage||0) > vTo) return false;
        return true;
      });
      filtered.sort((a,b)=>{ const sa=getWineStats(s,a.id), sb=getWineStats(s,b.id); const pA=s.purchases.filter((p)=>p.wineId===a.id).sort((x,y)=>new Date(y.purchaseDate)-new Date(x.purchaseDate))[0]?.purchaseDate||''; const pB=s.purchases.filter((p)=>p.wineId===b.id).sort((x,y)=>new Date(y.purchaseDate)-new Date(x.purchaseDate))[0]?.purchaseDate||''; if(sortBy==='navn') return (a.wineName||'').localeCompare(b.wineName||''); if(sortBy==='producent') return (a.producer||'').localeCompare(b.producer||''); if(sortBy==='årgang') return Number(b.vintage||0)-Number(a.vintage||0); if(sortBy==='antal flasker') return sb.left-sa.left; if(sortBy==='pris per flaske') return sb.avgPrice-sa.avgPrice; if(sortBy==='samlet værdi') return sb.inventoryValue-sa.inventoryValue; if(sortBy==='drikkevindue fra') return Number(a.drinkFrom||0)-Number(b.drinkFrom||0); if(sortBy==='drikkevindue til') return Number(a.drinkTo||0)-Number(b.drinkTo||0); if(sortBy==='seneste køb') return new Date(pB)-new Date(pA); return 0; });
      list.innerHTML = filtered.map((w)=>wineCard(s,w)).join('');
      empty.style.display = filtered.length ? 'none' : 'block';
    };
    ['search','location','country','region','wineType','primaryGrape','status','bottleVolume','packagingStatus','vintageFrom','vintageTo','sortBy'].forEach((n)=>{ const el=document.querySelector(`[name="${n}"]`); if(el) el.oninput=renderList; });
    document.getElementById('showArchived').onchange = renderList;
    renderList();
  }

  if(/^\/wines\/[^/]+$/.test(path)){
    const wineId = path.split('/')[2];
    const logForm = document.getElementById('logForm');
    if(logForm) logForm.onsubmit=(e)=>{ e.preventDefault(); const fd=new FormData(logForm); const next=store(); next.drinkLogs.push({
      id:uid(), wineId,
      date:fd.get('date'), bottlesConsumed:Number(fd.get('bottlesConsumed')||0), quality:fd.get('quality'), developmentLevel:fd.get('developmentLevel'), sweetness:fd.get('sweetness'), acidity:fd.get('acidity'), tannin:fd.get('tannin'), alcohol:fd.get('alcohol'), body:fd.get('body'), aromaIntensity:fd.get('aromaIntensity'), flavourIntensity:fd.get('flavourIntensity'), finish:fd.get('finish'), withFood:fd.get('withFood'), foodPairing:fd.get('foodPairing')||'', notes:fd.get('notes')||'',
      wsetDescriptors: {
        primaryFruit: fd.getAll('primaryFruit'), primaryFloral: fd.getAll('primaryFloral'), primarySpice: fd.getAll('primarySpice'), primaryOther: fd.getAll('primaryOther'),
        secondaryOak: fd.getAll('secondaryOak'), secondaryYeast: fd.getAll('secondaryYeast'), secondaryVinification: fd.getAll('secondaryVinification'), tertiary: fd.getAll('tertiary')
      }
    }); save(next); render(); };
  }

  if(/^\/wines\/[^/]+\/edit$/.test(path)){
    const wineId = path.split('/')[2];
    const stockStatus = document.getElementById('stockStatus');
    bindRegion('[name="country"]', '#editRegionSelect', 'editCustomRegionWrap', 'regionCustom');
    const grapeSel=document.querySelector('[name="primaryGrape"]'); const grapeWrap=document.getElementById('editCustomGrapeWrap'); const grapeCustom=document.querySelector('[name="grapeCustom"]'); if(grapeSel){ const t=()=>{const on=grapeSel.value==='Anden'; grapeWrap.style.display=on?'block':'none'; grapeCustom.required=on;}; grapeSel.onchange=t; t(); }

    const editForm = document.getElementById('editWineDataForm');
    if(editForm) editForm.onsubmit=(e)=>{ e.preventDefault(); const v=Object.fromEntries(new FormData(editForm).entries()); if(v.drinkFrom && v.drinkTo && Number(v.drinkFrom)>Number(v.drinkTo)){ stockStatus.textContent='Drikkevindue fra må ikke være større end til.'; return; } const next=store(); const i=next.wines.findIndex((w)=>w.id===wineId); if(i<0) return; next.wines[i] = { ...next.wines[i], ...v, region:shouldShowCustomRegionInput(v.region)?v.regionCustom:v.region, primaryGrape:v.primaryGrape==='Anden'?v.grapeCustom:v.primaryGrape }; save(next); stockStatus.textContent='Stamdata opdateret.'; render(); };
    const suggestBtn = document.getElementById('suggestWindowBtn');
    if(suggestBtn) suggestBtn.onclick=()=>{ const v=Object.fromEntries(new FormData(document.getElementById('editWineDataForm')).entries()); const sgg=suggestDrinkWindow({ wineType:v.wineType, region:shouldShowCustomRegionInput(v.region)?v.regionCustom:v.region, primaryGrape:v.primaryGrape==='Anden'?v.grapeCustom:v.primaryGrape, vintage:Number(v.vintage||0), agingCategory:v.agingCategory }); const msg=document.getElementById('windowSuggestionMsg'); if(!sgg.drinkWindowFromYear) return msg.textContent='Intet forslag.'; document.querySelector('[name="drinkFrom"]').value=sgg.drinkWindowFromYear; document.querySelector('[name="drinkTo"]').value=sgg.drinkWindowToYear; msg.textContent=`Foreslået ud fra type/region/drue (${sgg.confidence}): ${sgg.drinkWindowFromYear}-${sgg.drinkWindowToYear}`; };

    const addForm=document.getElementById('addStockForm');
    if(addForm) addForm.onsubmit=(e)=>{ e.preventDefault(); const fd=new FormData(addForm); const next=store(); next.inventoryEvents.push({ id:uid(), wineId, date:fd.get('date'), type:'add', quantity:Number(fd.get('quantity')||0), note:fd.get('note')||'' }); save(next); stockStatus.textContent='Flasker tilføjet.'; render(); };
    const remForm=document.getElementById('removeStockForm');
    if(remForm) remForm.onsubmit=(e)=>{ e.preventDefault(); const fd=new FormData(remForm); const qty=Number(fd.get('quantity')||0); if(qty>getWineStats(store(),wineId).left){ stockStatus.textContent='Du kan ikke fjerne flere flasker, end der er på lager.'; return; } const next=store(); next.inventoryEvents.push({ id:uid(), wineId, date:fd.get('date'), type:'remove', quantity:qty, note:fd.get('note')||'' }); save(next); stockStatus.textContent='Flasker fjernet.'; render(); };

    const archiveBtn=document.getElementById('archiveBtn'); if(archiveBtn) archiveBtn.onclick=()=>{ const next=store(); const i=next.wines.findIndex((w)=>w.id===wineId); if(i<0) return; next.wines[i].status='ude'; next.inventoryEvents.push({id:uid(),wineId,date:new Date().toISOString().slice(0,10),type:'archive',quantity:0,note:'Markeret som ude'}); save(next); render(); };
    const reactivateBtn=document.getElementById('reactivateBtn'); if(reactivateBtn) reactivateBtn.onclick=()=>{ const next=store(); const i=next.wines.findIndex((w)=>w.id===wineId); if(i<0) return; next.wines[i].status='aktiv'; next.inventoryEvents.push({id:uid(),wineId,date:new Date().toISOString().slice(0,10),type:'reactivate',quantity:0,note:'Åbnet igen'}); save(next); render(); };
  }

  if(path === '/new'){
    bindRegion('[name="country"]', '#regionSelect', 'customRegionWrap', 'regionCustom');
    const grapeSel=document.querySelector('[name="primaryGrape"]'); const grapeWrap=document.getElementById('customGrapeWrap'); const grapeCustom=document.querySelector('[name="grapeCustom"]'); if(grapeSel){ const t=()=>{const on=grapeSel.value==='Anden'; grapeWrap.style.display=on?'block':'none'; grapeCustom.required=on;}; grapeSel.onchange=t; t(); }
    const volSel=document.querySelector('[name="bottleVolumeMl"]'); const volWrap=document.getElementById('customVolumeWrap'); const volCustom=document.querySelector('[name="bottleVolumeCustom"]'); if(volSel){ const t=()=>{const on=volSel.value==='Anden størrelse'; volWrap.style.display=on?'block':'none'; volCustom.required=on;}; volSel.onchange=t; t(); }

    const suggestBtn = document.getElementById('suggestWindowFromRulesBtn');
    if(suggestBtn) suggestBtn.onclick=()=>{ const v=Object.fromEntries(new FormData(document.getElementById('createWineForm')).entries()); const sgg=suggestDrinkWindow({ wineType:v.wineType, region:shouldShowCustomRegionInput(v.region)?v.regionCustom:v.region, primaryGrape:v.primaryGrape==='Anden'?v.grapeCustom:v.primaryGrape, vintage:Number(v.vintage||0), agingCategory:v.agingCategory }); const msg=document.getElementById('createWindowMsg'); if(!sgg.drinkWindowFromYear) return msg.textContent='Intet forslag (mangler gyldig årgang).'; document.querySelector('[name="drinkFrom"]').value=sgg.drinkWindowFromYear; document.querySelector('[name="drinkTo"]').value=sgg.drinkWindowToYear; msg.textContent='Foreslået ud fra vinens type og region/drue.'; };

    const createForm=document.getElementById('createWineForm');
    if(createForm) createForm.onsubmit=(e)=>{ e.preventDefault(); const v=Object.fromEntries(new FormData(createForm).entries()); if(v.drinkFrom&&v.drinkTo&&Number(v.drinkFrom)>Number(v.drinkTo)){ document.getElementById('createWindowMsg').textContent='Drikkevindue fra må ikke være større end til.'; return; }
      const next=store(); const region=shouldShowCustomRegionInput(v.region)?v.regionCustom:v.region; const grape=v.primaryGrape==='Anden'?v.grapeCustom:v.primaryGrape; const bottleVolumeMl=v.bottleVolumeMl==='Anden størrelse'?String(Number(v.bottleVolumeCustom||0)||''):v.bottleVolumeMl;
      const candidate = { producer:v.producer, wineName:v.wineName, vintage:Number(v.vintage) };
      const key = `${normalize(candidate.producer)}|${normalize(candidate.wineName)}|${String(candidate.vintage).trim()}`;
      const exact = next.wines.find((w)=>normalizeKey(w)===key);
      let wineId;
      if(exact){ wineId = exact.id; }
      else {
        const uncertain = next.wines.find((w)=>normalize(w.producer)===normalize(v.producer) && normalize(w.wineName)===normalize(v.wineName));
        if(uncertain){
          const useExisting = confirm(`Vi fandt en mulig eksisterende vin (${uncertain.producer} ${uncertain.wineName}). Vil du lægge købet til denne?`);
          if(useExisting) wineId = uncertain.id;
        }
      }
      if(!wineId){
        wineId = uid();
        next.wines.push({ id:wineId, producer:v.producer, wineName:v.wineName, vintage:Number(v.vintage), country:v.country, region, appellation:v.appellation||'', primaryGrape:grape, wineType:v.wineType, drinkFrom:v.drinkFrom||'', drinkTo:v.drinkTo||'', agingCategory:v.agingCategory||'', blend:v.blend||'', notes:v.notes||'', bottleVolumeMl, packagingStatus:v.packagingStatus||'Ingen', status:'aktiv' });
      }
      next.purchases.push({ id:uid(), wineId, purchaseDate:v.purchaseDate, quantity:Number(v.quantity), price:Number(v.price), currency:v.currency, retailer:v.retailer||'', location:v.location, bottleVolumeMl, packagingStatus:v.packagingStatus||'Ingen', note:'' });
      next.inventoryEvents.push({ id:uid(), wineId, date:v.purchaseDate, type:'purchase', quantity:Number(v.quantity), note:'Køb registreret' });
      save(next); navigate(`/wines/${wineId}`);
    };

    document.getElementById('downloadCsvTemplate').onclick = () => dl('import-template.csv', rowsToCsv([]));
    document.getElementById('downloadXlsxTemplate').onclick = () => dl('import-template.xlsx', rowsToFakeXlsx([]), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    let previewRows = null;
    document.getElementById('previewImportBtn').onclick = async () => {
      const file = document.getElementById('bulkFile').files[0];
      const status = document.getElementById('importStatus');
      const preview = document.getElementById('importPreview');
      if(!file) return status.textContent='Vælg fil først.';
      const parsed = parseDelimited(await file.text());
      if(parsed.errors.length){ previewRows=null; preview.innerHTML=`<h4>Fejl</h4>${parsed.errors.map((e)=>`<p>${e}</p>`).join('')}`; return; }
      previewRows = parsed.rows;
      const valid = parsed.rows.filter((r)=>!r.rowErrors.length).length;
      const invalid = parsed.rows.length-valid;
      preview.innerHTML = `<h4>Preview</h4><p>Rækker: ${parsed.rows.length}</p><p>Gyldige: ${valid}</p><p>Fejl: ${invalid}</p>${parsed.rows.slice(0,10).map((r)=>`<p>Linje ${r.line}: ${r.row.producer} ${r.row.wineName} (${r.row.vintage}) ${r.rowErrors.length?`<span class='signal sig-red'>${r.rowErrors.join(', ')}</span>`:''}</p>`).join('')}<div class='row-gap'><button class='btn' id='confirmImportBtn'>Bekræft import</button><button class='btn dark' id='downloadErrorReportBtn'>Download fejlrapport</button></div>`;
      document.getElementById('confirmImportBtn').onclick = () => { const res=applyImport(store(),previewRows); save(res.next); status.textContent=`Oprettede vine: ${res.summary.createdWines}, opdaterede vine: ${res.summary.updatedWines}, oprettede køb: ${res.summary.createdPurchases}, fejl: ${res.summary.errorRows}.`; preview.dataset.report = res.summary.report.join('\n') || 'Ingen fejl.'; };
      document.getElementById('downloadErrorReportBtn').onclick = () => dl('import-fejlrapport.txt', preview.dataset.report || 'Ingen fejl.');
    };

    document.getElementById('importPreview').insertAdjacentHTML('beforeend', `<div class='row-gap'><button class='btn' id='exportCsvActiveFromNew'>Eksport CSV (aktive)</button><button class='btn dark' id='exportXlsxActiveFromNew'>Eksport XLSX (aktive)</button><button class='btn' id='exportCsvAllFromNew'>Eksport CSV (alle inkl. ude)</button><button class='btn dark' id='exportXlsxAllFromNew'>Eksport XLSX (alle inkl. ude)</button></div>`);
    document.getElementById('exportCsvActiveFromNew').onclick=()=>dl('vine_aktive.csv', rowsToCsv(exportRows(store(), false)));
    document.getElementById('exportXlsxActiveFromNew').onclick=()=>dl('vine_aktive.xlsx', rowsToFakeXlsx(exportRows(store(), false)), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    document.getElementById('exportCsvAllFromNew').onclick=()=>dl('vine_alle.csv', rowsToCsv(exportRows(store(), true)));
    document.getElementById('exportXlsxAllFromNew').onclick=()=>dl('vine_alle.xlsx', rowsToFakeXlsx(exportRows(store(), true)), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
}

function render(){
  if(!currentUser() && location.pathname !== '/login') history.replaceState({}, '', '/login');

  const s = store();
  const p = location.pathname;
  let html = '';
  if(p === '/login') html = loginPage();
  else if(p === '/') html = dashboard(s);
  else if(p === '/wines') html = winesPage();
  else if(/^\/wines\/[^/]+$/.test(p)) html = wineDetail(s, p.split('/')[2]);
  else if(/^\/wines\/[^/]+\/edit$/.test(p)) html = editWinePage(s, p.split('/')[2]);
  else if(/^\/tastings\//.test(p)) html = tastingDetailPage(s, p.split('/')[2]);
  else if(p === '/new') html = createPage();
  else if(p === '/profile') html = profilePage();
  else if(p === '/admin') html = currentUser()?.role === 'admin' ? adminPage() : shell('<section class="card"><h2>Ingen adgang</h2></section>', '/');
  else html = shell('<p>Side ikke fundet.</p>', '/');

  document.getElementById('app').innerHTML = html;
  attachHandlers(p, s);
}

async function initAuth() {
  try {
    const result = await handleAuthCallback();
    if (result) {
      _authCallbackResult = result;
      if (result.user) _identityUser = mapIdentityUser(result.user);
    }
  } catch (e) {
    console.error('Auth callback error:', e);
  }

  if (!_identityUser) {
    const u = await getUser();
    _identityUser = mapIdentityUser(u);
  }

  onAuthChange((event, user) => {
    _identityUser = mapIdentityUser(user);
    if (event === AUTH_EVENTS.LOGIN || event === AUTH_EVENTS.LOGOUT || event === AUTH_EVENTS.USER_UPDATED) render();
  });

  render();
}

initAuth();
