const STORAGE_KEY = 'winecellar.v7';
const USERS_KEY = 'winecellar.users.v3';
const SESSION_KEY = 'winecellar.session.v4';

const WINE_REGIONS_BY_COUNTRY = {
  Frankrig: ['Alsace','Beaujolais','Bordeaux','Bourgogne','Champagne','Jura','Loire','Provence','Rhone','Anden'],
  Italien: ['Piemonte','Toscana','Veneto','Sicilia','Puglia','Umbria','Anden'],
  Spanien: ['Rioja','Ribera del Duero','Priorat','Jerez','Penedes','Anden'],
  Tyskland: ['Mosel','Rheingau','Rheinhessen','Pfalz','Anden'],
  Portugal: ['Douro','Dao','Vinho Verde','Alentejo','Anden'],
  USA: ['Napa Valley','Sonoma County','Oregon','Washington','Anden'],
  Australien: ['Barossa Valley','Yarra Valley','Margaret River','Anden'],
  'New Zealand': ['Marlborough','Central Otago','Hawke\'s Bay','Anden'],
  Østrig: ['Wachau','Burgenland','Wien','Anden'],
  Argentina: ['Mendoza','Patagonia','Salta','Anden'],
  Chile: ['Maipo Valley','Colchagua Valley','Casablanca Valley','Anden'],
  Danmark: ['Fyn','Jylland','Sjælland','Bornholm','Anden']
};
const getRegionsForCountry = (country) => WINE_REGIONS_BY_COUNTRY[country] || ['Anden'];
const shouldShowCustomRegionInput = (r) => r === 'Anden';

const OPTIONS = {
  countries: [...Object.keys(WINE_REGIONS_BY_COUNTRY), 'Grækenland', 'Ungarn', 'Georgien', 'Schweiz'],
  grapes: ['Pinot Noir', 'Syrah', 'Cabernet Sauvignon', 'Merlot', 'Riesling', 'Sauvignon Blanc', 'Chardonnay', 'Nebbiolo', 'Sangiovese', 'Tempranillo'],
  wineTypes: ['Rødvin', 'Hvidvin', 'Rosé', 'Mousserende', 'Dessertvin', 'Orangevin', 'Forstærket'],
  locations: ['Vinlager', 'Kælder'],
  currency: ['DKK', 'EUR', 'USD'],
  packagingStatus: ['Ingen', 'Æske', 'OC', 'OWC'],
  bottleVolumes: ['187', '375', '500', '750', '1000', '1500', '3000', '6000', 'Anden størrelse'],
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

const countryFlags = { Frankrig:'🇫🇷',Italien:'🇮🇹',Spanien:'🇪🇸',Tyskland:'🇩🇪',Portugal:'🇵🇹',USA:'🇺🇸',Australien:'🇦🇺',Argentina:'🇦🇷',Chile:'🇨🇱',Danmark:'🇩🇰',Østrig:'🇦🇹','New Zealand':'🇳🇿',Grækenland:'🇬🇷',Ungarn:'🇭🇺',Georgien:'🇬🇪',Schweiz:'🇨🇭' };

const seedData = { wines: [], purchases: [], inventoryEvents: [], drinkLogs: [] };
const seedUsers = [{ id:'admin-default', username:'AdminAlbert', email:'admin@vinlager.local', password:'Start123', role:'admin', active:true, verified:true }];
const uid = () => Math.random().toString(36).slice(2, 10);
const money = (n) => `${Number(n || 0).toFixed(2)} DKK`;

const store = () => { try { return { ...seedData, ...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}') }; } catch { return seedData; } };
const save = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
function usersStore() { try { const v = JSON.parse(localStorage.getItem(USERS_KEY)||'null'); if (Array.isArray(v)&&v.length) return v; } catch {} localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers)); return seedUsers; }
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); } catch { return null; } };
const setSession = (userId) => localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
const clearSession = () => localStorage.removeItem(SESSION_KEY);
const currentUser = () => { const id = getSession()?.userId; return id ? usersStore().find((u) => u.id === id && u.active) : null; };

const normalize = (v='') => v.trim().toLowerCase().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const normalizeKey = (w) => `${normalize(w.producer)}|${normalize(w.wineName)}|${String(w.vintage||'').trim()}`;

const label = (t, f) => `<label><span>${t}</span>${f}</label>`;
const input = (n, t='text', v='', req=false, min='') => `<input class="input" name="${n}" type="${t}" value="${v||''}" ${req?'required':''} ${min!==''?`min="${min}"`:''} />`;
const select = (n, opts, v='', req=false) => `<select class="input" name="${n}" ${req?'required':''}><option value="">Vælg...</option>${opts.map((o)=>`<option value="${o}" ${o===v?'selected':''}>${o}</option>`).join('')}</select>`;
const pill = (p,txt,a)=>`<a href="${p}" class="pill ${a===p?'active':''}" data-link>${txt}</a>`;

// Provider adapter (optional)
const labelProviders = {
  mock: async (file) => {
    const name = (file?.name || '').toLowerCase();
    if (name.includes('tignanello')) return { producer:'Antinori', wineName:'Tignanello', vintage:new Date().getFullYear()-6, country:'Italien', region:'Toscana', appellation:'IGT Toscana', primaryGrape:'Sangiovese', wineType:'Rødvin' };
    return null;
  }
};
async function scanLabelWithProvider(file) {
  const provider = labelProviders.mock;
  if (!provider) return { ok:false, message:'Etiket-scanning er ikke konfigureret.' };
  try {
    const result = await provider(file);
    if (!result) return { ok:false, message:'Ingen brugbare forslag fundet. Fortsæt manuelt.' };
    return { ok:true, data:result };
  } catch {
    return { ok:false, message:'Scanning fejlede. Fortsæt manuelt.' };
  }
}

function shell(content, active='/') {
  const u = currentUser();
  const nav = u?.role === 'admin'
    ? `${pill('/admin','Admin',active)}`
    : `${pill('/','Dashboard',active)}${pill('/wines','Alle vine',active)}${pill('/new','Opret vin + køb',active)}${pill('/profile','Profil',active)}`;
  return `<header class="topbar"><div class="container top-row"><h1>Vinlager Manager</h1><nav>${nav}<button id="logoutBtn" class="pill logout-btn">Log ud</button></nav></div></header><main class="container">${content}</main>`;
}

function navigate(path){ history.pushState({},'',path); render(); }
document.addEventListener('click',(e)=>{ const a=e.target.closest('[data-link]'); if(!a) return; e.preventDefault(); navigate(a.getAttribute('href')); });
window.addEventListener('popstate', render);

// Drink window engine
const BASE_TYPE_RULES = {
  rødvin:{label:'Baseregel: Rødvin',from:2,to:8}, hvidvin:{label:'Baseregel: Hvidvin',from:1,to:5}, rosé:{label:'Baseregel: Rosé',from:0,to:3}, mousserende:{label:'Baseregel: Mousserende',from:1,to:4}, dessertvin:{label:'Baseregel: Dessertvin',from:3,to:20}, orangevin:{label:'Baseregel: Orangevin',from:1,to:6}, forstærket:{label:'Baseregel: Forstærket',from:5,to:30}
};
const GRAPE_RULES = [
  {label:'Drue: Cabernet Sauvignon',matches:['cabernet sauvignon'],from:6,to:18}, {label:'Drue: Merlot',matches:['merlot'],from:3,to:10}, {label:'Drue: Pinot Noir',matches:['pinot noir','spatburgunder'],from:3,to:12}, {label:'Drue: Syrah',matches:['syrah','shiraz'],from:4,to:15}, {label:'Drue: Nebbiolo',matches:['nebbiolo'],from:8,to:25}, {label:'Drue: Sangiovese',matches:['sangiovese'],from:4,to:12}, {label:'Drue: Chardonnay',matches:['chardonnay'],from:2,to:8}, {label:'Drue: Sauvignon Blanc',matches:['sauvignon blanc'],from:0,to:4}, {label:'Drue: Riesling',matches:['riesling'],from:2,to:15}
];
const REGION_RULES = [
  {label:'Region: Bordeaux',matches:['bordeaux'],from:6,to:20}, {label:'Region: Bourgogne',matches:['bourgogne','burgundy'],from:2,to:10}, {label:'Region: Barolo',matches:['barolo'],from:8,to:25}, {label:'Region: Rioja',matches:['rioja'],from:4,to:15}, {label:'Region: Mosel',matches:['mosel'],from:2,to:15}, {label:'Region: Douro',matches:['douro'],from:4,to:20}, {label:'Region: Napa Valley',matches:['napa valley'],from:4,to:15}
];
function findRule(val, rules){ const n=normalize(val); if(!n) return null; return rules.find((r)=>r.matches.some((m)=>n.includes(normalize(m))))||null; }
function mergeRule(cur, incoming, w){ return {from:Math.round(cur.from*(1-w)+incoming.from*w), to:Math.round(cur.to*(1-w)+incoming.to*w)}; }
function suggestDrinkWindow({wineType, region, primaryGrape, vintage, currentYear = new Date().getFullYear()}){
  if (!vintage || vintage < 1800 || vintage > currentYear + 1) return { drinkWindowFromYear:null, drinkWindowToYear:null, status:'unknown', confidence:'low', reasons:['Årgang mangler/ugyldig'], appliedRules:[] };
  let base = BASE_TYPE_RULES[normalize(wineType)] || {label:'Baseregel: Standard',from:2,to:6};
  const applied = [base.label];
  const reasons = [`Basisforslag ud fra vintype: ${wineType || 'ukendt'}`];
  const grape = findRule(primaryGrape, GRAPE_RULES); if (grape){ base = mergeRule(base, grape, 0.5); applied.push(grape.label); reasons.push(`Justeret af drue: ${primaryGrape}`); }
  const regionRule = findRule(region, REGION_RULES); if (regionRule){ base = mergeRule(base, regionRule, 0.7); applied.push(regionRule.label); reasons.push(`Justeret af region: ${region}`); }
  const from = vintage + Math.max(0, base.from); const to = vintage + Math.max(base.from, base.to);
  const status = currentYear < from ? 'too_young' : currentYear > to ? 'past_window' : 'drink_now';
  return { drinkWindowFromYear:from, drinkWindowToYear:to, status, confidence: applied.length>=3?'high':applied.length===2?'medium':'low', reasons, appliedRules:applied };
}

function wineById(s,id){ return s.wines.find((w)=>w.id===id); }
function getInventoryEventsForWine(s,wineId){ return s.inventoryEvents.filter((e)=>e.wineId===wineId).sort((a,b)=>new Date(a.date||0)-new Date(b.date||0)); }

function getWineStats(s,wineId){
  const purchases = s.purchases.filter((p)=>p.wineId===wineId);
  const purchased = purchases.reduce((n,p)=>n+Number(p.quantity||0),0);
  const events = getInventoryEventsForWine(s,wineId);
  const added = events.filter((e)=>e.type==='add').reduce((n,e)=>n+Number(e.quantity||0),0);
  const removed = events.filter((e)=>e.type==='remove').reduce((n,e)=>n+Number(e.quantity||0),0);
  const consumed = s.drinkLogs.filter((l)=>l.wineId===wineId).reduce((n,l)=>n+Number(l.bottlesConsumed||0),0);
  const left = Math.max(0, purchased + added - removed - consumed);
  const avgPrice = purchases.length ? purchases.reduce((n,p)=>n+Number(p.price||0),0)/purchases.length : 0;

  const inventoryValue = left * avgPrice;
  const perLocation = { Vinlager:0, Kælder:0 };
  // approximate location split from purchases only
  const byLocPurchased = { Vinlager:0, Kælder:0 };
  purchases.forEach((p)=>{ if(byLocPurchased[p.location]!=null) byLocPurchased[p.location]+=Number(p.quantity||0); });
  const totalLoc = byLocPurchased.Vinlager + byLocPurchased.Kælder || 1;
  perLocation.Vinlager = Math.round(left * (byLocPurchased.Vinlager/totalLoc));
  perLocation.Kælder = left - perLocation.Vinlager;

  return { purchased, added, removed, consumed, left, avgPrice, inventoryValue, perLocation };
}

function getWineStatusBadge(w){ return w.status === 'ude' ? '<span class="badge archived">Ude</span>' : '<span class="badge active">Aktiv</span>'; }

function computeDrinkSignal(w, logs){
  const now = new Date().getFullYear();
  const latest = [...logs].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0))[0];
  if (latest?.readiness === 'Past its best' || latest?.developmentLevel === 'Tired') return { text:'Drik nu', cls:'sig-red' };
  if (latest?.developmentLevel === 'Fully developed') return { text:'Drik løbende', cls:'sig-orange' };
  if (latest?.readiness === 'Too young') return { text:'For ung', cls:'sig-green' };
  const from = Number(w.drinkFrom||0), to = Number(w.drinkTo||0);
  if (from && now < from) return { text:'For ung', cls:'sig-green' };
  if (to && now > to) return { text:'Drik nu', cls:'sig-red' };
  if (from && to && now>=from && now<=to) return { text:'Drik løbende', cls:'sig-orange' };
  return null;
}

function dashboard(s){
  const activeWines = s.wines.filter((w)=>w.status!=='ude');
  const byType = {}; const byCountry = {}; const byBottleVolume = {}; const byPackaging = {}; const locationValue = { Vinlager:0, Kælder:0 };
  let noWindow = 0; let markedOut = s.wines.filter((w)=>w.status==='ude').length; let readyNow=0;
  const statusBars = { drink_now:0, too_young:0, past_window:0, unknown:0 };
  const lowStock = [];
  const readyRunning = [];
  const readyNowList = [];

  activeWines.forEach((w)=>{
    const st = getWineStats(s,w.id);
    if (st.left <=0) return;
    byType[w.wineType||'Ukendt'] = (byType[w.wineType||'Ukendt']||0)+st.left;
    byCountry[w.country||'Ukendt'] = (byCountry[w.country||'Ukendt']||0)+st.left;
    byBottleVolume[w.bottleVolumeMl||'Ukendt'] = (byBottleVolume[w.bottleVolumeMl||'Ukendt']||0)+st.left;
    byPackaging[w.packagingStatus||'Ingen'] = (byPackaging[w.packagingStatus||'Ingen']||0)+1;
    locationValue.Vinlager += st.perLocation.Vinlager * st.avgPrice;
    locationValue.Kælder += st.perLocation.Kælder * st.avgPrice;

    if (!w.drinkFrom || !w.drinkTo) noWindow += 1;

    const suggestion = suggestDrinkWindow({ wineType:w.wineType, region:w.region, primaryGrape:w.primaryGrape, vintage:Number(w.vintage||0) });
    statusBars[suggestion.status] = (statusBars[suggestion.status]||0)+1;

    if (st.left <= 2) lowStock.push({w, st});

    const now = new Date().getFullYear();
    const from = Number(w.drinkFrom||0), to = Number(w.drinkTo||0);
    const logs = s.drinkLogs.filter((l)=>l.wineId===w.id);
    const latest = [...logs].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0))[0];
    const pastNote = latest && (latest.readiness === 'Past its best' || (latest.notes||'').toLowerCase().includes('past'));

    if (from && to && now>=from && now<=to) readyRunning.push({w,st});
    if ((from && to && to===now) || pastNote) readyNowList.push({w,st});
    if ((from&&to&&now>=from&&now<=to) || pastNote) readyNow += 1;
  });

  const latestPurchases = [...s.purchases].sort((a,b)=>new Date(b.purchaseDate||0)-new Date(a.purchaseDate||0)).slice(0,5);

  const bar = (obj) => Object.entries(obj).map(([k,v])=>`<div class="mini-row"><span>${k}</span><b>${v}</b></div>`).join('') || '<p class="muted">Ingen data.</p>';

  return shell(`
    <section class="hero card"><h2>Dashboard</h2><p>Beslutningsværktøj for lager og drikkeklarhed.</p></section>
    <section class="grid cols3">
      <article class="card"><small>Flasker i alt (aktive)</small><h3>${Object.values(byType).reduce((a,b)=>a+b,0)}</h3></article>
      <article class="card"><small>Vine klar nu</small><h3>${readyNow}</h3></article>
      <article class="card"><small>Vine uden drikkevindue</small><h3>${noWindow}</h3></article>
    </section>
    <section class="grid cols3">
      <article class="card"><h3>Flasker pr. vintype</h3>${bar(byType)}</article>
      <article class="card"><h3>Flasker pr. land</h3>${bar(byCountry)}</article>
      <article class="card"><h3>Værdi pr. placering</h3>${bar({ Vinlager: money(locationValue.Vinlager), Kælder: money(locationValue.Kælder) })}</article>
    </section>
    <section class="grid cols3">
      <article class="card"><h3>Statusbar (regelmotor)</h3>${bar({ 'Klar nu':statusBars.drink_now, 'For tidlig':statusBars.too_young, 'Over vindue':statusBars.past_window, 'Ukendt':statusBars.unknown })}</article>
      <article class="card"><h3>Flasker pr. volumen</h3>${bar(byBottleVolume)}</article>
      <article class="card"><h3>Vine pr. emballage</h3>${bar(byPackaging)}</article>
    </section>
    <section class="grid cols2">
      <article class="card"><h3>Klar til at drikke løbende</h3>${readyRunning.length?readyRunning.map(({w,st})=>`<p><a href="/wines/${w.id}" data-link>${w.producer} ${w.wineName}</a> (${w.drinkFrom}-${w.drinkTo}) · ${st.left} fl.</p>`).join(''):'<p class="muted">Ingen endnu.</p>'}</article>
      <article class="card"><h3>Klar til at drikke nu</h3>${readyNowList.length?readyNowList.map(({w,st})=>`<p><a href="/wines/${w.id}" data-link>${w.producer} ${w.wineName}</a> · ${st.left} fl. <span class="signal sig-red">Drik nu</span></p>`).join(''):'<p class="muted">Ingen endnu.</p>'}</article>
    </section>
    <section class="grid cols2">
      <article class="card"><h3>Lav beholdning</h3>${lowStock.length?lowStock.map(({w,st})=>`<p>${w.producer} ${w.wineName} · ${st.left} fl.</p>`).join(''):'<p class="muted">Ingen lav beholdning.</p>'}</article>
      <article class="card"><h3>Seneste køb</h3>${latestPurchases.length?latestPurchases.map((p)=>{const w=wineById(s,p.wineId); return `<p>${p.purchaseDate} · ${w?`${w.producer} ${w.wineName}`:'Ukendt'} · ${p.quantity} fl.</p>`;}).join(''):'<p class="muted">Ingen køb endnu.</p>'}</article>
    </section>
    <section class="card"><h3>Info</h3><p>Vine markeret som ude: <b>${markedOut}</b></p></section>
  `, '/');
}

function wineCard(s,w){
  const st = getWineStats(s,w.id);
  const logs = s.drinkLogs.filter((l)=>l.wineId===w.id);
  const sig = computeDrinkSignal(w, logs);
  return `<article class="card wine-card ${w.status==='ude'?'archived-card':''}">
    <h3>${w.producer} · ${w.wineName}</h3>
    <p><span class="flag">${countryFlags[w.country]||'🏳️'}</span> ${w.country||'-'} / ${w.region||'-'}</p>
    <p>${w.vintage||'-'} · ${w.wineType||'-'} / ${w.primaryGrape||'-'}</p>
    <p>Flasker tilbage: <b>${st.left}</b></p>
    <p>Drikkevindue: ${w.drinkFrom||'-'} - ${w.drinkTo||'-'}</p>
    <p>${getWineStatusBadge(w)} ${sig?`<span class="signal ${sig.cls}">${sig.text}</span>`:''}</p>
    <div class="row-gap"><a class="btn dark" href="/wines/${w.id}/edit" data-link>Rediger</a><a class="btn" href="/wines/${w.id}" data-link>Detaljer</a></div>
  </article>`;
}

function winesPage(){
  return shell(`<section class="card"><h2>Alle vine</h2><div class="grid cols3">${label('Søg',input('search'))}${label('Placering',select('location',OPTIONS.locations))}${label('Land',select('country',OPTIONS.countries))}${label('Region',input('region'))}${label('Vintype',select('wineType',OPTIONS.wineTypes))}${label('Drue',input('primaryGrape'))}${label('Status',select('status',['aktiv','ude']))}${label('Flaskevolumen',select('bottleVolume',OPTIONS.bottleVolumes.filter((x)=>x!=='Anden størrelse')))}${label('Emballage',select('packagingStatus',OPTIONS.packagingStatus))}${label('Årgang fra',input('vintageFrom','number'))}${label('Årgang til',input('vintageTo','number'))}${label('Sortering',select('sortBy',['navn','producent','årgang','antal flasker','pris per flaske','samlet værdi','drikkevindue fra','drikkevindue til','seneste køb']))}</div><label><input type="checkbox" id="showArchived"/> Vis ude</label><div class="row-gap"><button class="btn" id="exportCsvActive">Eksport CSV (aktive)</button><button class="btn" id="exportCsvAll">Eksport CSV (alle inkl. ude)</button><button class="btn dark" id="exportXlsxActive">Eksport XLSX (aktive)</button><button class="btn dark" id="exportXlsxAll">Eksport XLSX (alle inkl. ude)</button></div></section><section id="wine-list" class="grid cols3"></section><p id="empty" class="muted" style="display:none">Ingen vine matcher filtrene.</p>`, '/wines');
}

function tastingForm(){
  const map = [['quality','Kvalitet',OPTIONS.quality],['readiness','Drikkemodenhed',OPTIONS.readiness],['developmentLevel','Udviklingsniveau',OPTIONS.developmentLevel],['sweetness','Sødhed',OPTIONS.sweetness],['acidity','Syre',OPTIONS.acidity],['tannin','Tannin',OPTIONS.tannin],['body','Krop',OPTIONS.body],['aromaIntensity','Aroma intensitet',OPTIONS.aromaIntensity],['flavourIntensity','Smags intensitet',OPTIONS.flavourIntensity]];
  return `<form id="logForm" class="card"><h3>Log smagning</h3><div class="grid cols3">${label('Dato',input('date','date',new Date().toISOString().slice(0,10),true))}${label('Antal flasker åbnet',input('bottlesConsumed','number',1,true,1))}${map.map(([n,t,o])=>label(t,select(n,o,'',true))).join('')}</div>${label('Noter',`<textarea class="input" name="notes" rows="3"></textarea>`)}<button class="btn" type="submit">Gem smagning</button></form>`;
}

function wineDetail(s,id){
  const w = wineById(s,id); if(!w) return shell('<p>Vin ikke fundet.</p>','/wines');
  const st = getWineStats(s,id);
  const logs = s.drinkLogs.filter((l)=>l.wineId===id).sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
  const purchases = s.purchases.filter((p)=>p.wineId===id).sort((a,b)=>new Date(b.purchaseDate||0)-new Date(a.purchaseDate||0));
  const events = getInventoryEventsForWine(s,id).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  return shell(`<section class="card"><h2>${w.producer} — ${w.wineName}</h2><p>${w.vintage} · ${w.country}/${w.region} · ${w.primaryGrape}</p><p>Status: ${getWineStatusBadge(w)}</p><p>Flasker tilbage: <b>${st.left}</b></p><a class="btn" href="/wines/${id}/edit" data-link>Rediger vin</a></section><section class="grid cols2"><article class="card"><h3>Købshistorik</h3>${purchases.length?purchases.map((p)=>`<p>${p.purchaseDate} · ${p.quantity} fl. · ${p.price} ${p.currency} · ${p.location} · ${p.bottleVolumeMl||'-'} ml · ${p.packagingStatus||'-'}</p>`).join(''):'<p>Ingen køb.</p>'}</article><article class="card"><h3>Lagerhændelser</h3>${events.length?events.map((e)=>`<p>${e.date} · ${e.type} · ${e.quantity||0} · ${e.note||''}</p>`).join(''):'<p>Ingen hændelser.</p>'}</article></section><section class="card"><h3>Smagningshistorik</h3>${logs.length?logs.map((l)=>`<p><a href="/tastings/${l.id}" data-link>${l.date} · ${l.readiness} · ${l.developmentLevel}</a></p>`).join(''):'<p>Ingen smagninger.</p>'}</section>${tastingForm()}`, '/wines');
}

function editWinePage(s,id){
  const w = wineById(s,id); if(!w) return shell('<p>Vin ikke fundet.</p>','/wines');
  const st = getWineStats(s,id);
  const regions = getRegionsForCountry(w.country);
  return shell(`
    <section class="card"><h2>Rediger vin</h2><p><b>${w.producer} ${w.wineName} (${w.vintage})</b></p><p>Flasker tilbage: <b>${st.left}</b> · Status: ${w.status||'aktiv'}</p></section>
    <section class="grid cols2">
      <article class="card">
        <h3>Stamdata</h3>
        <form id="editWineDataForm">
          ${label('Producent', input('producer','text',w.producer,true))}
          ${label('Vinens navn', input('wineName','text',w.wineName,true))}
          ${label('Årgang', input('vintage','number',w.vintage,true,1800))}
          ${label('Land', select('country', OPTIONS.countries, w.country, true))}
          ${label('Region', `<select class="input" name="region" id="editRegionSelect">${regions.map((r)=>`<option value="${r}" ${r===w.region?'selected':''}>${r}</option>`).join('')}</select>`)}
          <div id="editCustomRegionWrap" style="display:${shouldShowCustomRegionInput(w.region)?'block':'none'}">${label('Brugerdefineret region', input('regionCustom','text', shouldShowCustomRegionInput(w.region)?w.region:''))}</div>
          ${label('Primær drue', select('primaryGrape', OPTIONS.grapes.concat(['Anden']), OPTIONS.grapes.includes(w.primaryGrape)?w.primaryGrape:'Anden', true))}
          <div id="editCustomGrapeWrap" style="display:${OPTIONS.grapes.includes(w.primaryGrape)?'none':'block'}">${label('Brugerdefineret drue', input('grapeCustom','text', OPTIONS.grapes.includes(w.primaryGrape)?'':w.primaryGrape))}</div>
          ${label('Vintype', select('wineType', OPTIONS.wineTypes, w.wineType, true))}
          ${label('Drikkevindue fra', input('drinkFrom','number',w.drinkFrom||'',false,1900))}
          ${label('Drikkevindue til', input('drinkTo','number',w.drinkTo||'',false,1900))}
          ${label('Lagringskategori', select('agingCategory',['Drik ung','Mellem lagring','Lang lagring','Meget lang lagring'],w.agingCategory||'',false))}
          ${label('Blend', `<textarea class="input" name="blend" rows="2">${w.blend||''}</textarea>`)}
          ${label('Generelle noter', `<textarea class="input" name="notes" rows="3">${w.notes||''}</textarea>`)}
          <button class="btn" type="submit">Gem stamdata</button>
          <button class="btn dark" type="button" id="suggestWindowBtn">Foreslå drikkevindue</button>
          <p id="windowSuggestionMsg" class="muted"></p>
        </form>
      </article>
      <article class="card">
        <h3>Lagerregulering</h3>
        <form id="addStockForm">${label('Tilføj flasker', input('quantity','number',1,true,1))}${label('Dato', input('date','date',new Date().toISOString().slice(0,10),true))}${label('Note', input('note'))}<button class="btn" type="submit">Tilføj</button></form>
        <form id="removeStockForm">${label('Fjern flasker', input('quantity','number',1,true,1))}${label('Dato', input('date','date',new Date().toISOString().slice(0,10),true))}${label('Note', input('note'))}<button class="btn" type="submit">Fjern</button></form>
        <p id="stockStatus" class="muted"></p>
        <h3>Status</h3>
        ${w.status==='ude' ? '<button class="btn" id="reactivateBtn">Åbn igen</button>' : '<button class="btn dark" id="archiveBtn">Marker som ude</button>'}
      </article>
    </section>
    <section class="card"><h3>Købshistorik</h3>${s.purchases.filter((p)=>p.wineId===id).map((p)=>`<p>${p.purchaseDate} · ${p.quantity} fl. · ${p.price} ${p.currency} · ${p.location} · ${p.bottleVolumeMl||'-'} ml · ${p.packagingStatus||'-'} · ${p.note||''}</p>`).join('')||'<p>Ingen køb.</p>'}</section>
  `, '/wines');
}

function tastingDetailPage(s,id){
  const t = s.drinkLogs.find((x)=>x.id===id); if(!t) return shell('<p>Smagning ikke fundet.</p>','/');
  const w = wineById(s,t.wineId);
  return shell(`<article class="card"><a href="/wines/${t.wineId}" data-link>← Tilbage til vin</a><h2>Smagningsdetaljer</h2><p><b>Vin:</b> ${w?`${w.producer} ${w.wineName}`:'Ukendt'}</p><p><b>Dato:</b> ${t.date}</p><p><b>Drikkemodenhed:</b> ${t.readiness}</p><p><b>Udviklingsniveau:</b> ${t.developmentLevel}</p><p><b>Noter:</b> ${t.notes||'-'}</p></article>`, '/');
}

function profilePage(){
  const u = currentUser();
  return shell(`<section class="card"><h2>Min profil</h2><form id="profileForm" class="grid cols2">${label('Brugernavn',input('username','text',u?.username||'',true))}${label('Email',input('email','email',u?.email||'',true))}${label('Nyt kodeord',input('password','password','',false))}<div></div><button class="btn" type="submit">Gem profil</button></form><p id="profileStatus" class="muted"></p></section>`, '/profile');
}

function adminPage(){
  const users = usersStore();
  return shell(`<section class="card"><h2>Admin: Brugerstyring</h2><div class="grid cols2"><form id="adminCreateUserForm"><h3>Opret bruger</h3>${label('Email',input('email','email','',true))}${label('Brugernavn',input('username','text','',true))}${label('Kodeord',input('password','text','',true))}${label('Rolle',select('role',['user','admin'],'user',true))}<button class="btn" type="submit">Opret</button></form><form id="adminEditUserForm"><h3>Redigér bruger</h3>${label('Vælg bruger',`<select class="input" name="userId" required><option value="">Vælg...</option>${users.map((u)=>`<option value="${u.id}">${u.username} (${u.role})</option>`).join('')}</select>`)}${label('Ny email',input('email','email'))}${label('Nyt brugernavn',input('username'))}${label('Nyt kodeord',input('password'))}${label('Rolle',select('role',['user','admin']))}${label('Aktiv',select('active',['Ja','Nej'],'Ja'))}${label('Verificeret',select('verified',['Ja','Nej'],'Ja'))}<button class="btn" type="submit">Gem</button></form></div><h3>Brugeroversigt</h3><div class="card">${users.map((u)=>`<p>${u.username} · ${u.email} · ${u.role} · ${u.verified?'verificeret':'ikke verificeret'} · ${u.active?'aktiv':'deaktiveret'}</p>`).join('')}</div><p id="adminStatus" class="muted"></p></section>`, '/admin');
}

function loginPage(){
  return `<main class="login-main"><section class="login-card"><h1>Vinlager Manager</h1><p>Log ind for at få adgang.</p><form id="loginForm">${label('Brugernavn',input('username','text','',true))}${label('Kodeord',input('password','password','',true))}<button class="btn" type="submit">Log ind</button></form><p id="loginStatus" class="muted"></p><hr/><h3>Opret bruger</h3><form id="registerForm">${label('Email',input('email','email','',true))}${label('Brugernavn',input('username','text','',true))}${label('Kodeord',input('password','password','',true))}<button class="btn" type="submit">Opret profil</button></form><p id="registerStatus" class="muted"></p><h3>Verificér email</h3><form id="verifyForm">${label('Email',input('email','email','',true))}${label('Verifikationskode',input('code','text','',true))}<button class="btn" type="submit">Verificér</button></form><p id="verifyStatus" class="muted"></p></section></main>`;
}

function importPageBlock(){return `<section class="card"><h3>Import / eksport</h3><div class="row-gap"><button class="btn" id="downloadCsvTemplate">Download template CSV</button><button class="btn dark" id="downloadXlsxTemplate">Download template XLSX</button><input id="bulkFile" type="file" class="input" accept=".csv,.xlsx"/><button class="btn" id="previewImportBtn">Preview import</button></div><div id="importPreview" class="card"></div><p id="importStatus" class="muted"></p></section>`;}

function createPage(){
  return shell(`<section class="card"><h2>Opret vin + første køb</h2><p class="muted">Upload et billede af flaskens etiket og få forslag til vinens stamdata.</p><div class="row-gap"><button class="btn dark" id="scanLabelBtn">Scan etiket</button><input type="file" id="labelFile" accept="image/*" class="input" style="max-width:340px"/><span id="scanStatus" class="muted"></span></div><form id="createWineForm"><div class="grid cols2">${label('Producent',input('producer','text','',true))}${label('Vinens navn',input('wineName','text','',true))}${label('Årgang',input('vintage','number','',true,1800))}${label('Land',select('country',OPTIONS.countries,'',true))}${label('Region',`<select class="input" name="region" id="regionSelect"></select>`)}<div id="customRegionWrap" style="display:none">${label('Brugerdefineret region', input('regionCustom'))}</div>${label('Appellation',input('appellation'))}${label('Primær drue',select('primaryGrape',OPTIONS.grapes.concat(['Anden']),'',true))}<div id="customGrapeWrap" style="display:none">${label('Brugerdefineret drue',input('grapeCustom'))}</div>${label('Vintype',select('wineType',OPTIONS.wineTypes,'',true))}${label('Drikkevindue fra (år)',input('drinkFrom','number','',false,1900))}${label('Drikkevindue til (år)',input('drinkTo','number','',false,1900))}${label('Købsdato',input('purchaseDate','date',new Date().toISOString().slice(0,10),true))}${label('Antal flasker',input('quantity','number',1,true,1))}${label('Pris per flaske',input('price','number',0,true,0))}${label('Valuta',select('currency',OPTIONS.currency,'DKK',true))}${label('Forhandler',input('retailer'))}${label('Placering',select('location',OPTIONS.locations,'Vinlager',true))}${label('Flaskevolumen (ml)',select('bottleVolumeMl',OPTIONS.bottleVolumes,'750',false))}<div id="customVolumeWrap" style="display:none">${label('Anden størrelse (ml)',input('bottleVolumeCustom','number','',false,1))}</div>${label('Emballagestatus',select('packagingStatus',OPTIONS.packagingStatus,'Ingen',false))}</div>${label('Blend',`<textarea class="input" name="blend" rows="2"></textarea>`)}${label('Generelle noter',`<textarea class="input" name="notes" rows="3"></textarea>`)}<button class="btn" type="button" id="suggestWindowFromRulesBtn">Foreslå drikkevindue</button><p id="createWindowMsg" class="muted"></p><button class="btn" type="submit">Gem vin og køb</button></form></section>${importPageBlock()}`, '/new');
}

function exportRows(s, includeArchived, filteredIds = null){
  const wines = s.wines.filter((w)=> includeArchived || w.status !== 'ude').filter((w)=> !filteredIds || filteredIds.has(w.id));
  return wines.map((w)=>{
    const st = getWineStats(s,w.id);
    const p = s.purchases.filter((x)=>x.wineId===w.id)[0] || {};
    return {
      producent:w.producer, vinens_navn:w.wineName, årgang:w.vintage, land:w.country, region:w.region, appellation:w.appellation||'', primær_drue:w.primaryGrape, vintype:w.wineType, antal_flasker:st.left,
      pris_per_flaske:p.price||'', placering:p.location||'', drikkevindue_fra:w.drinkFrom||'', drikkevindue_til:w.drinkTo||'', købsdato:p.purchaseDate||'', valuta:p.currency||'DKK', forhandler:p.retailer||'', flaskevolumen_ml:w.bottleVolumeMl||'', emballagestatus:w.packagingStatus||'', blend:w.blend||'', generelle_noter:w.notes||'', status:w.status||'aktiv'
    };
  });
}

function rowsToCsv(rows){
  if(!rows.length) return 'producent,vinens_navn,årgang,land,region,appellation,primær_drue,vintype,antal_flasker,pris_per_flaske,placering,drikkevindue_fra,drikkevindue_til,købsdato,valuta,forhandler,flaskevolumen_ml,emballagestatus,blend,generelle_noter,status';
  const cols = Object.keys(rows[0]);
  const esc = (v)=>`"${String(v??'').replaceAll('"','""')}"`;
  return [cols.join(','), ...rows.map((r)=>cols.map((c)=>esc(r[c])).join(','))].join('\n');
}

function rowsToFakeXlsx(rows){
  // TSV-as-xlsx fallback for offline environment
  if(!rows.length) return 'producent\tvinens_navn\tårgang\tland\tregion\tappellation\tprimær_drue\tvintype\tantal_flasker\tpris_per_flaske\tplacering\tdrikkevindue_fra\tdrikkevindue_til\tkøbsdato\tvaluta\tforhandler\tflaskevolumen_ml\temballagestatus\tblend\tgenerelle_noter\tstatus';
  const cols = Object.keys(rows[0]);
  return [cols.join('\t'), ...rows.map((r)=>cols.map((c)=>String(r[c]??'')).join('\t'))].join('\n');
}

function parseDelimited(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  if(lines.length<2) return { rows:[], errors:['Filen indeholder ingen datarækker.'] };
  const delim = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
  const split = (line)=>line.split(delim).map((x)=>x.trim().replace(/^"|"$/g,''));
  const headers = split(lines[0]).map((h)=>normalize(h));
  const required = ['producent','vinens_navn','årgang','land','region','primær_drue','vintype','antal_flasker','pris_per_flaske','placering'];
  const errors = [];
  required.forEach((r)=>{ if(!headers.includes(normalize(r))) errors.push(`Mangler kolonne: ${r}`); });
  if(errors.length) return { rows:[], errors };

  const idx = (k)=>headers.indexOf(normalize(k));
  const rows = lines.slice(1).map((line, i)=>{
    const c = split(line);
    const row = {
      producer:c[idx('producent')]||'', wineName:c[idx('vinens_navn')]||'', vintage:c[idx('årgang')]||'', country:c[idx('land')]||'', region:c[idx('region')]||'', appellation:c[idx('appellation')]||'', primaryGrape:c[idx('primær_drue')]||'', wineType:c[idx('vintype')]||'', quantity:c[idx('antal_flasker')]||'', price:c[idx('pris_per_flaske')]||'', location:c[idx('placering')]||'', drinkFrom:c[idx('drikkevindue_fra')]||'', drinkTo:c[idx('drikkevindue_til')]||'', purchaseDate:c[idx('købsdato')]||'', currency:c[idx('valuta')]||'DKK', retailer:c[idx('forhandler')]||'', bottleVolumeMl:c[idx('flaskevolumen_ml')]||'', packagingStatus:c[idx('emballagestatus')]||'Ingen', blend:c[idx('blend')]||'', notes:c[idx('generelle_noter')]||'', status:c[idx('status')]||'aktiv'
    };
    const rowErrors = [];
    if(!row.producer || !row.wineName) rowErrors.push('mangler producent/vinens_navn');
    if(!/^\d{4}$/.test(String(row.vintage))) rowErrors.push('ugyldig årgang');
    if(Number(row.quantity)<=0) rowErrors.push('antal_flasker skal være > 0');
    if(Number(row.price)<0) rowErrors.push('pris_per_flaske skal være >= 0');
    if(row.drinkFrom && !/^\d{4}$/.test(String(row.drinkFrom))) rowErrors.push('ugyldig drikkevindue_fra');
    if(row.drinkTo && !/^\d{4}$/.test(String(row.drinkTo))) rowErrors.push('ugyldig drikkevindue_til');
    return { row, rowErrors, line: i+2 };
  });

  return { rows, errors:[] };
}

function applyImport(s, parsedRows){
  let createdWines = 0, updatedWines = 0, createdPurchases = 0, errorRows = 0;
  const report = [];
  const next = JSON.parse(JSON.stringify(s));

  parsedRows.forEach(({row,rowErrors,line})=>{
    if(rowErrors.length){ errorRows += 1; report.push(`Linje ${line}: ${rowErrors.join(', ')}`); return; }

    const key = `${normalize(row.producer)}|${normalize(row.wineName)}|${String(row.vintage).trim()}`;
    const exact = next.wines.find((w)=>normalizeKey(w)===key);
    const uncertain = !exact && next.wines.find((w)=>normalize(w.producer)===normalize(row.producer) && normalize(w.wineName)===normalize(row.wineName));

    let wineId;
    if (exact){
      wineId = exact.id;
      updatedWines += 1;
    } else {
      wineId = uid();
      next.wines.push({ id:wineId, producer:row.producer, wineName:row.wineName, vintage:Number(row.vintage), country:row.country, region:row.region, appellation:row.appellation, primaryGrape:row.primaryGrape, wineType:row.wineType, drinkFrom:row.drinkFrom||'', drinkTo:row.drinkTo||'', blend:row.blend||'', notes:row.notes||'', bottleVolumeMl:row.bottleVolumeMl||'', packagingStatus:row.packagingStatus||'Ingen', status: row.status==='ude'?'ude':'aktiv' });
      createdWines += 1;
      if(uncertain) report.push(`Linje ${line}: muligt usikkert match med eksisterende vin (${uncertain.producer} ${uncertain.wineName}). Køb lagt på ny vin.`);
    }

    next.purchases.push({ id:uid(), wineId, purchaseDate:row.purchaseDate || new Date().toISOString().slice(0,10), quantity:Number(row.quantity), price:Number(row.price), currency:row.currency||'DKK', retailer:row.retailer||'', location:row.location||'Vinlager', bottleVolumeMl:row.bottleVolumeMl||'', packagingStatus:row.packagingStatus||'Ingen', note:'Import' });
    next.inventoryEvents.push({ id:uid(), wineId, date:row.purchaseDate || new Date().toISOString().slice(0,10), type:'purchase', quantity:Number(row.quantity), note:'Import purchase' });
    createdPurchases += 1;
  });

  return { next, summary:{ createdWines, updatedWines, createdPurchases, errorRows, report } };
}

function bindRegionByCountry(countrySelector, regionSelector, customWrapId, customInputName){
  const c = document.querySelector(countrySelector); const r = document.querySelector(regionSelector); if(!c || !r) return;
  const renderRegions = () => {
    const regions = getRegionsForCountry(c.value);
    r.innerHTML = regions.map((x)=>`<option value="${x}">${x}</option>`).join('');
    const customWrap = document.getElementById(customWrapId);
    const customInput = document.querySelector(`[name="${customInputName}"]`);
    const toggle = () => {
      const on = shouldShowCustomRegionInput(r.value);
      if(customWrap) customWrap.style.display = on?'block':'none';
      if(customInput) customInput.required = on;
    };
    r.onchange = toggle;
    toggle();
  };
  c.onchange = renderRegions;
  renderRegions();
}

function attachHandlers(path,s){
  const out = document.getElementById('logoutBtn'); if(out) out.onclick = ()=>{ clearSession(); navigate('/login'); };

  if(path==='/login'){
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    const verForm = document.getElementById('verifyForm');
    const loginStatus = document.getElementById('loginStatus');
    const regStatus = document.getElementById('registerStatus');
    const verStatus = document.getElementById('verifyStatus');

    if(loginForm) loginForm.onsubmit = (e)=>{ e.preventDefault(); const fd=new FormData(loginForm); const u=usersStore().find((x)=>x.username===fd.get('username')&&x.password===fd.get('password')&&x.active); if(!u) return loginStatus.textContent='Forkert login eller bruger deaktiveret.'; if(!u.verified) return loginStatus.textContent='Email ikke verificeret.'; setSession(u.id); navigate(u.role==='admin'?'/admin':'/'); };
    if(regForm) regForm.onsubmit = (e)=>{ e.preventDefault(); const fd=new FormData(regForm); const users=usersStore(); if(users.some((x)=>x.email===fd.get('email'))) return regStatus.textContent='Email findes allerede.'; if(users.some((x)=>x.username===fd.get('username'))) return regStatus.textContent='Brugernavn findes allerede.'; const code=String(Math.floor(100000+Math.random()*900000)); users.push({id:uid(),email:fd.get('email'),username:fd.get('username'),password:fd.get('password'),role:'user',active:true,verified:false,verificationCode:code}); saveUsers(users); regStatus.textContent=`Verifikationskode (demo): ${code}`; };
    if(verForm) verForm.onsubmit = (e)=>{ e.preventDefault(); const fd=new FormData(verForm); const users=usersStore(); const i=users.findIndex((x)=>x.email===fd.get('email')); if(i<0) return verStatus.textContent='Email findes ikke.'; if(users[i].verificationCode!==fd.get('code')) return verStatus.textContent='Forkert kode.'; users[i].verified=true; delete users[i].verificationCode; saveUsers(users); verStatus.textContent='Email verificeret.'; };
  }

  if(path==='/admin'){
    const status = document.getElementById('adminStatus');
    const createForm = document.getElementById('adminCreateUserForm');
    const editForm = document.getElementById('adminEditUserForm');
    if(createForm) createForm.onsubmit=(e)=>{ e.preventDefault(); const fd=new FormData(createForm); const users=usersStore(); if(users.some((x)=>x.email===fd.get('email'))) return status.textContent='Email findes allerede.'; users.push({id:uid(),email:fd.get('email'),username:fd.get('username'),password:fd.get('password'),role:fd.get('role')||'user',active:true,verified:true}); saveUsers(users); status.textContent='Bruger oprettet.'; render(); };
    if(editForm) editForm.onsubmit=(e)=>{ e.preventDefault(); const fd=new FormData(editForm); const users=usersStore(); const i=users.findIndex((x)=>x.id===fd.get('userId')); if(i<0) return; if(fd.get('email')) users[i].email=fd.get('email'); if(fd.get('username')) users[i].username=fd.get('username'); if(fd.get('password')) users[i].password=fd.get('password'); if(fd.get('role')) users[i].role=fd.get('role'); users[i].active=fd.get('active')!=='Nej'; users[i].verified=fd.get('verified')!=='Nej'; saveUsers(users); status.textContent='Bruger opdateret.'; render(); };
  }

  if(path==='/profile'){
    const form=document.getElementById('profileForm'); const status=document.getElementById('profileStatus');
    if(form) form.onsubmit=(e)=>{ e.preventDefault(); const fd=new FormData(form); const me=currentUser(); const users=usersStore(); const i=users.findIndex((x)=>x.id===me.id); if(i<0) return; users[i].username=fd.get('username'); users[i].email=fd.get('email'); if(fd.get('password')) users[i].password=fd.get('password'); saveUsers(users); status.textContent='Profil opdateret.'; };
  }

  if(path==='/wines'){
    const renderList = ()=>{
      const q=(document.querySelector('[name="search"]').value||'').toLowerCase();
      const location=document.querySelector('[name="location"]').value; const country=document.querySelector('[name="country"]').value; const region=(document.querySelector('[name="region"]').value||'').toLowerCase(); const wineType=document.querySelector('[name="wineType"]').value; const grape=(document.querySelector('[name="primaryGrape"]').value||'').toLowerCase(); const status=document.querySelector('[name="status"]').value; const volume=document.querySelector('[name="bottleVolume"]').value; const packaging=document.querySelector('[name="packagingStatus"]').value; const vintageFrom=Number(document.querySelector('[name="vintageFrom"]').value||0); const vintageTo=Number(document.querySelector('[name="vintageTo"]').value||9999); const sortBy=document.querySelector('[name="sortBy"]').value; const showArchived=document.getElementById('showArchived').checked;
      const list=document.getElementById('wine-list'); const empty=document.getElementById('empty');
      const filtered = s.wines.filter((w)=>{
        const st = getWineStats(s,w.id);
        const txt = `${w.producer} ${w.wineName} ${w.region} ${w.country} ${w.primaryGrape} ${w.vintage}`.toLowerCase();
        if(!showArchived && w.status==='ude') return false;
        if(q && !txt.includes(q)) return false;
        if(location && st.perLocation[location] <= 0) return false;
        if(country && w.country!==country) return false;
        if(region && !(w.region||'').toLowerCase().includes(region)) return false;
        if(wineType && w.wineType!==wineType) return false;
        if(grape && !(w.primaryGrape||'').toLowerCase().includes(grape)) return false;
        if(status && (w.status||'aktiv')!==status) return false;
        if(volume && (w.bottleVolumeMl||'')!==volume) return false;
        if(packaging && (w.packagingStatus||'Ingen')!==packaging) return false;
        if(Number(w.vintage||0) < vintageFrom || Number(w.vintage||0) > vintageTo) return false;
        return true;
      });

      filtered.sort((a,b)=>{
        const sa=getWineStats(s,a.id), sb=getWineStats(s,b.id);
        const latestA = s.purchases.filter((p)=>p.wineId===a.id).sort((x,y)=>new Date(y.purchaseDate)-new Date(x.purchaseDate))[0]?.purchaseDate || '';
        const latestB = s.purchases.filter((p)=>p.wineId===b.id).sort((x,y)=>new Date(y.purchaseDate)-new Date(x.purchaseDate))[0]?.purchaseDate || '';
        if(sortBy==='navn') return (a.wineName||'').localeCompare(b.wineName||'');
        if(sortBy==='producent') return (a.producer||'').localeCompare(b.producer||'');
        if(sortBy==='årgang') return Number(b.vintage||0)-Number(a.vintage||0);
        if(sortBy==='antal flasker') return sb.left-sa.left;
        if(sortBy==='pris per flaske') return sb.avgPrice-sa.avgPrice;
        if(sortBy==='samlet værdi') return sb.inventoryValue-sa.inventoryValue;
        if(sortBy==='drikkevindue fra') return Number(a.drinkFrom||0)-Number(b.drinkFrom||0);
        if(sortBy==='drikkevindue til') return Number(a.drinkTo||0)-Number(b.drinkTo||0);
        if(sortBy==='seneste køb') return new Date(latestB)-new Date(latestA);
        return 0;
      });

      list.innerHTML = filtered.map((w)=>wineCard(s,w)).join('');
      empty.style.display = filtered.length?'none':'block';

      const ids = new Set(filtered.map((w)=>w.id));
      document.getElementById('exportCsvActive').onclick=()=>dl('vine_aktive.csv', rowsToCsv(exportRows(s,false,ids)));
      document.getElementById('exportCsvAll').onclick=()=>dl('vine_alle.csv', rowsToCsv(exportRows(s,true,ids)));
      document.getElementById('exportXlsxActive').onclick=()=>dl('vine_aktive.xlsx', rowsToFakeXlsx(exportRows(s,false,ids)), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      document.getElementById('exportXlsxAll').onclick=()=>dl('vine_alle.xlsx', rowsToFakeXlsx(exportRows(s,true,ids)), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    };
    ['search','location','country','region','wineType','primaryGrape','status','bottleVolume','packagingStatus','vintageFrom','vintageTo','sortBy'].forEach((n)=>{ const el=document.querySelector(`[name="${n}"]`); if(el) el.oninput=renderList; });
    document.getElementById('showArchived').onchange = renderList;
    renderList();
  }

  if(path.startsWith('/wines/') && path.endsWith('/edit')){
    const wineId = path.split('/')[2];
    const stockStatus = document.getElementById('stockStatus');

    bindRegionByCountry('[name="country"]', '#editRegionSelect', 'editCustomRegionWrap', 'regionCustom');
    const grapeSel = document.querySelector('[name="primaryGrape"]'); const grapeWrap=document.getElementById('editCustomGrapeWrap'); const grapeCustom=document.querySelector('[name="grapeCustom"]'); if(grapeSel){ const t=()=>{ const on=grapeSel.value==='Anden'; grapeWrap.style.display=on?'block':'none'; grapeCustom.required=on; }; grapeSel.onchange=t; t(); }

    const editForm = document.getElementById('editWineDataForm');
    if(editForm) editForm.onsubmit=(e)=>{ e.preventDefault(); const v=Object.fromEntries(new FormData(editForm).entries()); const next=store(); const i=next.wines.findIndex((w)=>w.id===wineId); if(i<0) return; const region = shouldShowCustomRegionInput(v.region) ? v.regionCustom : v.region; const grape = v.primaryGrape==='Anden' ? v.grapeCustom : v.primaryGrape; if(v.drinkFrom && v.drinkTo && Number(v.drinkFrom)>Number(v.drinkTo)){ stockStatus.textContent='Drikkevindue fra må ikke være større end til.'; return; } next.wines[i] = { ...next.wines[i], ...v, region, primaryGrape:grape }; save(next); stockStatus.textContent='Stamdata opdateret.'; render(); };

    const suggestBtn = document.getElementById('suggestWindowBtn');
    if(suggestBtn) suggestBtn.onclick=()=>{ const f = Object.fromEntries(new FormData(document.getElementById('editWineDataForm')).entries()); const sgg = suggestDrinkWindow({wineType:f.wineType, region:shouldShowCustomRegionInput(f.region)?f.regionCustom:f.region, primaryGrape:f.primaryGrape==='Anden'?f.grapeCustom:f.primaryGrape, vintage:Number(f.vintage||0)}); const msg=document.getElementById('windowSuggestionMsg'); if(!sgg.drinkWindowFromYear){ msg.textContent='Intet forslag (mangler gyldig årgang).'; return; } document.querySelector('[name="drinkFrom"]').value=sgg.drinkWindowFromYear; document.querySelector('[name="drinkTo"]').value=sgg.drinkWindowToYear; msg.textContent=`Foreslået ud fra type/region/drue (${sgg.confidence}): ${sgg.drinkWindowFromYear}-${sgg.drinkWindowToYear}`; };

    const addForm = document.getElementById('addStockForm');
    if(addForm) addForm.onsubmit=(e)=>{ e.preventDefault(); const fd=new FormData(addForm); const qty=Number(fd.get('quantity')); const next=store(); next.inventoryEvents.push({id:uid(),wineId,date:fd.get('date'),type:'add',quantity:qty,note:fd.get('note')||''}); save(next); stockStatus.textContent='Flasker tilføjet.'; render(); };

    const removeForm = document.getElementById('removeStockForm');
    if(removeForm) removeForm.onsubmit=(e)=>{ e.preventDefault(); const fd=new FormData(removeForm); const qty=Number(fd.get('quantity')); const current = getWineStats(store(), wineId).left; if(qty>current){ stockStatus.textContent='Du kan ikke fjerne flere flasker, end der er på lager.'; return; } const next=store(); next.inventoryEvents.push({id:uid(),wineId,date:fd.get('date'),type:'remove',quantity:qty,note:fd.get('note')||''}); save(next); stockStatus.textContent='Flasker fjernet.'; render(); };

    const archiveBtn = document.getElementById('archiveBtn'); if(archiveBtn) archiveBtn.onclick=()=>{ const next=store(); const i=next.wines.findIndex((w)=>w.id===wineId); if(i<0) return; next.wines[i].status='ude'; next.inventoryEvents.push({id:uid(),wineId,date:new Date().toISOString().slice(0,10),type:'archive',quantity:0,note:'Markeret som ude'}); save(next); render(); };
    const reactivateBtn = document.getElementById('reactivateBtn'); if(reactivateBtn) reactivateBtn.onclick=()=>{ const next=store(); const i=next.wines.findIndex((w)=>w.id===wineId); if(i<0) return; next.wines[i].status='aktiv'; next.inventoryEvents.push({id:uid(),wineId,date:new Date().toISOString().slice(0,10),type:'reactivate',quantity:0,note:'Åbnet igen'}); save(next); render(); };
  }

  if(path.startsWith('/wines/') && !path.endsWith('/edit')){
    const wineId = path.split('/')[2];
    const logForm=document.getElementById('logForm');
    if(logForm) logForm.onsubmit=(e)=>{ e.preventDefault(); const fd=new FormData(logForm); const next=store(); next.drinkLogs.push({id:uid(),wineId,date:fd.get('date'),bottlesConsumed:Number(fd.get('bottlesConsumed')||0),quality:fd.get('quality'),readiness:fd.get('readiness'),developmentLevel:fd.get('developmentLevel'),sweetness:fd.get('sweetness'),acidity:fd.get('acidity'),tannin:fd.get('tannin'),body:fd.get('body'),aromaIntensity:fd.get('aromaIntensity'),flavourIntensity:fd.get('flavourIntensity'),notes:fd.get('notes')||''}); save(next); render(); };
  }

  if(path==='/new'){
    bindRegionByCountry('[name="country"]', '#regionSelect', 'customRegionWrap', 'regionCustom');

    const grapeSel=document.querySelector('[name="primaryGrape"]'); const grapeWrap=document.getElementById('customGrapeWrap'); const grapeCustom=document.querySelector('[name="grapeCustom"]'); if(grapeSel){ const t=()=>{ const on=grapeSel.value==='Anden'; grapeWrap.style.display=on?'block':'none'; grapeCustom.required=on; }; grapeSel.onchange=t; t(); }
    const volSel=document.querySelector('[name="bottleVolumeMl"]'); const volWrap=document.getElementById('customVolumeWrap'); const volCustom=document.querySelector('[name="bottleVolumeCustom"]'); if(volSel){ const t=()=>{ const on=volSel.value==='Anden størrelse'; volWrap.style.display=on?'block':'none'; volCustom.required=on; }; volSel.onchange=t; t(); }

    const suggestBtn = document.getElementById('suggestWindowFromRulesBtn');
    if(suggestBtn) suggestBtn.onclick=()=>{ const fd=new FormData(document.getElementById('createWineForm')); const v=Object.fromEntries(fd.entries()); const region=shouldShowCustomRegionInput(v.region)?v.regionCustom:v.region; const grape=v.primaryGrape==='Anden'?v.grapeCustom:v.primaryGrape; const sgg=suggestDrinkWindow({wineType:v.wineType,region,primaryGrape:grape,vintage:Number(v.vintage||0)}); const msg=document.getElementById('createWindowMsg'); if(!sgg.drinkWindowFromYear){ msg.textContent='Intet forslag (mangler gyldig årgang).'; return; } document.querySelector('[name="drinkFrom"]').value=sgg.drinkWindowFromYear; document.querySelector('[name="drinkTo"]').value=sgg.drinkWindowToYear; msg.textContent=`Foreslået ud fra vinens type/region/drue (${sgg.confidence}).`; };

    const scanBtn = document.getElementById('scanLabelBtn');
    if(scanBtn) scanBtn.onclick=async()=>{ const file=document.getElementById('labelFile').files[0]; const status=document.getElementById('scanStatus'); if(!file){ status.textContent='Vælg et billede først.'; return; } status.textContent='Scanner...'; const res=await scanLabelWithProvider(file); if(!res.ok){ status.textContent=res.message; return; } Object.entries(res.data).forEach(([k,v])=>{ const el=document.querySelector(`[name="${k}"]`); if(el){ el.value=v; el.classList.add('auto-filled'); } }); status.textContent='Forslag indsat. Gennemgå og ret felter.'; const country=document.querySelector('[name="country"]'); if(country) country.dispatchEvent(new Event('change')); };

    const createForm = document.getElementById('createWineForm');
    if(createForm) createForm.onsubmit=(e)=>{ e.preventDefault(); const v=Object.fromEntries(new FormData(createForm).entries()); if(v.drinkFrom && v.drinkTo && Number(v.drinkFrom)>Number(v.drinkTo)){ document.getElementById('createWindowMsg').textContent='Drikkevindue fra må ikke være større end til.'; return; }
      const country=v.country; const region=shouldShowCustomRegionInput(v.region)?v.regionCustom:v.region; const grape=v.primaryGrape==='Anden'?v.grapeCustom:v.primaryGrape; const bottleVolumeMl=v.bottleVolumeMl==='Anden størrelse'?String(Number(v.bottleVolumeCustom||0)||''):v.bottleVolumeMl;
      const next=store();
      const key = `${normalize(v.producer)}|${normalize(v.wineName)}|${String(v.vintage).trim()}`;
      const exact = next.wines.find((w)=>normalizeKey(w)===key);

      let wineId;
      if(exact){
        wineId = exact.id;
      } else {
        wineId = uid();
        next.wines.push({ id:wineId, producer:v.producer, wineName:v.wineName, vintage:Number(v.vintage), country, region, appellation:v.appellation||'', primaryGrape:grape, wineType:v.wineType, drinkFrom:v.drinkFrom||'', drinkTo:v.drinkTo||'', blend:v.blend||'', notes:v.notes||'', bottleVolumeMl, packagingStatus:v.packagingStatus||'Ingen', status:'aktiv' });
      }

      next.purchases.push({ id:uid(), wineId, purchaseDate:v.purchaseDate, quantity:Number(v.quantity), price:Number(v.price), currency:v.currency, retailer:v.retailer||'', location:v.location, bottleVolumeMl, packagingStatus:v.packagingStatus||'Ingen', note:'' });
      next.inventoryEvents.push({ id:uid(), wineId, date:v.purchaseDate, type:'purchase', quantity:Number(v.quantity), note:'Køb registreret' });
      save(next);
      navigate(`/wines/${wineId}`);
    };

    document.getElementById('downloadCsvTemplate').onclick=()=>dl('import-template.csv', rowsToCsv([]));
    document.getElementById('downloadXlsxTemplate').onclick=()=>dl('import-template.xlsx', rowsToFakeXlsx([]), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    let previewRows = null;
    document.getElementById('previewImportBtn').onclick=async()=>{
      const file=document.getElementById('bulkFile').files[0]; const status=document.getElementById('importStatus'); const preview=document.getElementById('importPreview');
      if(!file) return status.textContent='Vælg fil først.';
      const parsed = parseDelimited(await file.text());
      if(parsed.errors.length){ previewRows=null; preview.innerHTML = `<h4>Fejl</h4>${parsed.errors.map((e)=>`<p>${e}</p>`).join('')}`; return; }
      previewRows = parsed.rows;
      const valid = parsed.rows.filter((r)=>!r.rowErrors.length).length;
      const invalid = parsed.rows.length-valid;
      preview.innerHTML = `<h4>Preview</h4><p>Rækker: ${parsed.rows.length}</p><p>Gyldige: ${valid}</p><p>Fejl: ${invalid}</p><div>${parsed.rows.slice(0,10).map((r)=>`<p>Linje ${r.line}: ${r.row.producer} ${r.row.wineName} (${r.row.vintage}) ${r.rowErrors.length?`<span class='signal sig-red'>${r.rowErrors.join(', ')}</span>`:''}</p>`).join('')}</div><button class='btn' id='confirmImportBtn'>Bekræft import</button><button class='btn dark' id='downloadErrorReportBtn'>Download fejlrapport</button>`;
      document.getElementById('confirmImportBtn').onclick=()=>{
        const res = applyImport(store(), previewRows);
        save(res.next);
        status.textContent = `Oprettede vine: ${res.summary.createdWines}, opdaterede vine: ${res.summary.updatedWines}, oprettede køb: ${res.summary.createdPurchases}, fejl: ${res.summary.errorRows}.`;
        preview.dataset.report = res.summary.report.join('\n') || 'Ingen fejl.';
      };
      document.getElementById('downloadErrorReportBtn').onclick=()=>dl('import-fejlrapport.txt', preview.dataset.report || 'Ingen fejl.');
    };
  }
}

function render(){
  usersStore();
  if(!currentUser() && location.pathname!=='/login') history.replaceState({},'', '/login');
  const user = currentUser();
  if(location.pathname!=='/login' && user?.role==='admin' && location.pathname!=='/admin') history.replaceState({},'', '/admin');

  const s=store();
  const p=location.pathname;
  let html='';
  if(p==='/login') html=loginPage();
  else if(p==='/') html=dashboard(s);
  else if(p==='/wines') html=winesPage();
  else if(/^\/wines\/[^/]+$/.test(p)) html=wineDetail(s,p.split('/')[2]);
  else if(/^\/wines\/[^/]+\/edit$/.test(p)) html=editWinePage(s,p.split('/')[2]);
  else if(/^\/tastings\//.test(p)) html=tastingDetailPage(s,p.split('/')[2]);
  else if(p==='/new') html=createPage();
  else if(p==='/profile') html=profilePage();
  else if(p==='/admin') html=user?.role==='admin'?adminPage():shell('<section class="card"><h2>Ingen adgang</h2></section>','/');
  else html=shell('<p>Side ikke fundet.</p>','/');

  document.getElementById('app').innerHTML = html;
  attachHandlers(p,s);
}

render();
