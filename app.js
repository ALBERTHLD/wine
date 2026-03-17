const IDENTITY_URL = '/.netlify/identity';
const API_URL = '/.netlify/functions/wines';
const TOKEN_KEY = 'winecellar.auth';

const descriptors = [
  ['jordbaer', 'Jordbær', 'Frugt'], ['kirsebaer', 'Kirsebær', 'Frugt'], ['hindbaer', 'Hindbær', 'Frugt'],
  ['citrus', 'Citrus', 'Frugt'], ['lime', 'Lime', 'Frugt'], ['stenfrugt', 'Stenfrugt', 'Frugt'],
  ['blomst', 'Blomst', 'Blomst'], ['urter', 'Urter', 'Krydderi'], ['peber', 'Peber', 'Krydderi'],
  ['vanilje', 'Vanilje', 'Fad'], ['skovbund', 'Skovbund', 'Tertiær udvikling'], ['svamp', 'Svamp', 'Tertiær udvikling'], ['mineral', 'Salt mineralitet', 'Tertiær udvikling']
].map(([id, name, category]) => ({ id, name, category }));

const defaultProfiles = {
  'Pinot Noir': ['jordbaer', 'kirsebaer', 'hindbaer', 'skovbund', 'svamp', 'urter', 'vanilje'],
  'Syrah': ['kirsebaer', 'peber', 'urter', 'vanilje'],
  'Cabernet Sauvignon': ['kirsebaer', 'urter', 'vanilje'],
  'Riesling': ['citrus', 'lime', 'blomst', 'mineral'],
  'Sauvignon Blanc': ['citrus', 'lime', 'urter'],
  'Chardonnay': ['stenfrugt', 'citrus', 'vanilje']
};

const seed = { wines: [], purchases: [], drinkLogs: [], grapeProfiles: defaultProfiles };
const uid = () => Math.random().toString(36).slice(2, 10);

/* ── Auth state ─────────────────────────────────────────── */
let currentUser = null;
let authToken = null;
let refreshToken = null;
let dataCache = null;

function loadAuthFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(TOKEN_KEY));
    if (saved && saved.access_token) {
      authToken = saved.access_token;
      refreshToken = saved.refresh_token;
      currentUser = saved.user || null;
      return true;
    }
  } catch {}
  return false;
}

function saveAuthToStorage(tokenData) {
  authToken = tokenData.access_token;
  refreshToken = tokenData.refresh_token;
  currentUser = tokenData.user || currentUser;
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: authToken, refresh_token: refreshToken, user: currentUser }));
}

function clearAuth() {
  currentUser = null;
  authToken = null;
  refreshToken = null;
  dataCache = null;
  localStorage.removeItem(TOKEN_KEY);
}

async function doLogin(email, password) {
  const res = await fetch(`${IDENTITY_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.msg || 'Login fejlede');
  }
  const data = await res.json();
  // Fetch user profile
  const userRes = await fetch(`${IDENTITY_URL}/user`, { headers: { Authorization: `Bearer ${data.access_token}` } });
  if (userRes.ok) data.user = await userRes.json();
  saveAuthToStorage(data);
}

async function doSignup(email, password) {
  const res = await fetch(`${IDENTITY_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.msg || 'Oprettelse fejlede');
  }
  const user = await res.json();
  if (user.confirmed_at || user.email_verified) {
    // Autoconfirm is on — log in immediately
    await doLogin(email, password);
  }
  return user;
}

async function doRefreshToken() {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${IDENTITY_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
    });
    if (!res.ok) return false;
    const data = await res.json();
    data.user = currentUser;
    saveAuthToStorage(data);
    return true;
  } catch { return false; }
}

/* ── Data sync (Netlify Blobs via function) ─────────────── */
async function apiFetch(url, options = {}) {
  const headers = { ...options.headers };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  let res = await fetch(url, { ...options, headers });
  // If unauthorized, try refreshing the token once
  if (res.status === 401 && refreshToken) {
    const refreshed = await doRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${authToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }
  return res;
}

async function loadData() {
  try {
    const res = await apiFetch(API_URL);
    if (res.ok) {
      const data = await res.json();
      dataCache = data && data.wines ? data : { ...seed };
    } else if (res.status === 401) {
      clearAuth();
      render();
      return seed;
    } else {
      dataCache = { ...seed };
    }
  } catch {
    dataCache = { ...seed };
  }
  return dataCache;
}

function saveData(data) {
  dataCache = data;
  // Fire-and-forget save to server for snappy UI
  apiFetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(() => {});
}

const store = () => dataCache || { ...seed };
const save = (s) => saveData(s);

/* ── UI helpers ─────────────────────────────────────────── */
function shell(content, active = '/') {
  const userEmail = currentUser?.email || '';
  return `
  <header class="topbar">
    <div class="container top-row">
      <h1>Vinlager Manager</h1>
      <nav>
        ${pill('/', 'Dashboard', active)}
        ${pill('/wines', 'Alle vine', active)}
        ${pill('/new', 'Tilføj data', active)}
        <span class="user-info">${userEmail}</span>
        <a href="#" id="logoutBtn" class="pill">Log ud</a>
      </nav>
    </div>
  </header>
  <main class="container">${content}</main>`;
}
const pill = (path, label, active) => `<a href="${path}" class="pill ${active === path ? 'active' : ''}" data-link>${label}</a>`;

function authPage() {
  return `
  <div class="container" style="max-width:420px;margin:80px auto">
    <div class="card">
      <h2 style="text-align:center">Vinlager Manager 🍷</h2>
      <p id="authError" style="color:#c0392b;display:none"></p>
      <div id="authTabs" style="display:flex;gap:8px;margin-bottom:16px">
        <button class="btn dark" id="tabLogin" style="flex:1">Log ind</button>
        <button class="btn" id="tabSignup" style="flex:1">Opret konto</button>
      </div>
      <form id="authForm">
        <label>E-mail<input name="email" type="email" class="input" required /></label>
        <label>Adgangskode<input name="password" type="password" class="input" required minlength="6" /></label>
        <button class="btn dark" type="submit" id="authSubmit" style="width:100%;margin-top:12px">Log ind</button>
      </form>
      <p id="authMsg" style="color:#27ae60;display:none"></p>
    </div>
  </div>`;
}

function navigate(path) { history.pushState({}, '', path); render(); }
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-link]');
  if (!a) return;
  e.preventDefault();
  navigate(a.getAttribute('href'));
});
window.addEventListener('popstate', render);

/* ── Page renderers (unchanged logic) ──────────────────── */
function bottlesLeft(s, wineId) {
  const bought = s.purchases.filter((p) => p.wineId === wineId).reduce((n, p) => n + Number(p.quantity || 0), 0);
  const used = s.drinkLogs.filter((d) => d.wineId === wineId).reduce((n, d) => n + Number(d.bottlesConsumed || 0), 0);
  return { bought, used, left: bought - used };
}

function dashboard(s) {
  const totalBottles = s.purchases.reduce((n, p) => n + Number(p.quantity || 0), 0) - s.drinkLogs.reduce((n, d) => n + Number(d.bottlesConsumed || 0), 0);
  const totalValue = s.purchases.reduce((n, p) => n + Number(p.price || 0) * Number(p.quantity || 0), 0);
  const latest = [...s.drinkLogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  return shell(`
    <section class="hero card"><h2>Dit personlige vinlager 🍷</h2><p>Få overblik over flasker, købsværdi, smagninger og vinens udvikling over tid.</p></section>
    <section class="grid cols3">
      <article class="card"><small>Antal vine</small><h3>${s.wines.length}</h3></article>
      <article class="card"><small>Flasker tilbage</small><h3>${totalBottles}</h3></article>
      <article class="card"><small>Samlet købsværdi</small><h3>${totalValue.toFixed(2)} DKK</h3></article>
    </section>
    <section class="grid cols2">
      <article class="card"><h3>Seneste smagninger</h3>${latest.length ? latest.map((l) => `<p>${l.date} · ${l.notes || 'Ingen note'}</p>`).join('') : '<p>Ingen smagninger endnu.</p>'}</article>
      <article class="card"><h3>Hurtig navigation</h3><a class="btn dark" href="/wines" data-link>Gå til alle vine</a><a class="btn" href="/new" data-link>Tilføj vin / køb / smagning</a></article>
    </section>
  `, '/');
}

function winesPage(s) {
  return shell(`
    <section><h2>Alle vine</h2><input id="search" class="input" placeholder="Søg på producent, region, drue eller årgang" />
    <div id="wine-list" class="grid cols3"></div><p id="empty" style="display:none">Ingen vine matcher din søgning.</p></section>
  `, '/wines');
}

function wineCard(w) {
  return `<a class="card wine-card" href="/wines/${w.id}" data-link><h3>${w.producer}</h3><p>${w.wineName} (${w.vintage})</p><p>${w.region}, ${w.country}</p><span class="chip">${w.primaryGrape}</span></a>`;
}

function wineDetail(s, id) {
  const wine = s.wines.find((w) => w.id === id);
  if (!wine) return shell('<p>Vin ikke fundet.</p>', '/wines');
  const purchases = s.purchases.filter((p) => p.wineId === id);
  const logs = s.drinkLogs.filter((d) => d.wineId === id).sort((a, b) => new Date(a.date) - new Date(b.date));
  const stat = bottlesLeft(s, id);
  const profile = s.grapeProfiles[wine.primaryGrape] || [];
  return shell(`
    <article class="card"><h2>${wine.producer} — ${wine.wineName}</h2><p>${wine.vintage} · ${wine.appellation}, ${wine.region}, ${wine.country}</p>
      <p>Drikkevindue: ${wine.drinkFrom || '-'} til ${wine.drinkTo || '-'}</p>
      <p>Købt: ${stat.bought} · Drukket: ${stat.used} · <b>Tilbage: ${stat.left}</b></p>
    </article>
    <section class="grid cols2">
      <article class="card"><h3>Køb & placering</h3>${purchases.length ? purchases.map((p) => `<p>${p.purchaseDate}: ${p.quantity} flasker i ${p.location}</p>`).join('') : '<p>Ingen køb.</p>'}</article>
      <article class="card"><h3>Udviklingshistorik</h3>${logs.length ? logs.map((l) => `<p>${l.date}: ${l.notes || ''}</p>`).join('') : '<p>Ingen smagninger.</p>'}</article>
    </section>
    <article class="card"><h3>Druebaserede noteforslag</h3><div class="chips">${profile.map((id) => `<span class="chip">${descriptors.find((d) => d.id === id)?.name || id}</span>`).join('')}</div>
      ${!profile.length ? '<p><b>Drue ikke genkendt. Vil du tilføje referenceprofil?</b></p><button id="addProfile" class="btn">Tilføj standardprofil fra valgte deskriptorer</button>' : ''}
    </article>
    <form id="logForm" class="card">
      <h3>Log smagning / åbning</h3>
      <div class="grid cols3">
        ${['date','bottlesConsumed','quality','readiness','developmentLevel','sweetness','acidity','tannin','body','aromaIntensity','flavourIntensity'].map((f) => `<label>${f}<input name="${f}" class="input" value="${f==='date'?new Date().toISOString().slice(0,10):f==='bottlesConsumed'?'1':''}" /></label>`).join('')}
      </div>
      <h4>Smagsdeskriptorer</h4>
      <div class="chips">${descriptors.map((d) => `<label class="chip"><input type="checkbox" name="descriptors" value="${d.id}" /> ${d.name}</label>`).join('')}</div>
      <label>Fri tekst<input name="notes" class="input" /></label><button class="btn" type="submit">Gem smagning</button>
    </form>
  `, '/wines');
}

function newPage(s) {
  return shell(`
    <section class="grid cols2">
      <form id="wineForm" class="card"><h3>Opret vin</h3>
        ${['producer','wineName','vintage','country','region','appellation','primaryGrape','blend','wineType','drinkFrom','drinkTo','notes'].map((f) => `<label>${f}<input name="${f}" class="input" /></label>`).join('')}
        <button class="btn" type="submit">Gem vin</button>
      </form>
      <div>
        <form id="purchaseForm" class="card"><h3>Registrer køb</h3>
          <label>Vin<select name="wineId" class="input"><option value="">Vælg vin</option>${s.wines.map((w) => `<option value="${w.id}">${w.producer} ${w.wineName}</option>`).join('')}</select></label>
          <label>Købsdato<input class="input" name="purchaseDate" /></label>
          <label>Antal flasker<input class="input" name="quantity" value="1" /></label>
          <label>Pris per flaske<input class="input" name="price" value="0" /></label>
          <label>Valuta<input class="input" name="currency" value="DKK" /></label>
          <label>Forhandler<input class="input" name="retailer" /></label>
          <label>Placering<select class="input" name="location"><option>Vinlager</option><option>Kælder</option></select></label>
          <button class="btn" type="submit">Gem køb</button>
        </form>
        <article class="card"><h3>Import</h3><p>Download importark.</p><button class="btn" id="xls">Excel</button> <button class="btn dark" id="csv">CSV</button></article>
      </div>
    </section>
  `, '/new');
}

/* ── Event handlers ────────────────────────────────────── */
function attachHandlers(path, s) {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = (e) => { e.preventDefault(); clearAuth(); render(); };

  if (path === '/wines') {
    const list = document.getElementById('wine-list');
    const empty = document.getElementById('empty');
    const search = document.getElementById('search');
    const renderList = () => {
      const q = search.value.toLowerCase();
      const filtered = s.wines.filter((w) => `${w.producer} ${w.wineName} ${w.region} ${w.primaryGrape} ${w.vintage}`.toLowerCase().includes(q));
      list.innerHTML = filtered.map(wineCard).join('');
      empty.style.display = filtered.length ? 'none' : 'block';
    };
    search.oninput = renderList; renderList();
  }

  if (path.startsWith('/wines/')) {
    const id = path.split('/')[2];
    const logForm = document.getElementById('logForm');
    if (logForm) logForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(logForm);
      const next = store();
      next.drinkLogs.push({
        id: uid(), wineId: id,
        date: fd.get('date'), bottlesConsumed: Number(fd.get('bottlesConsumed') || 0), quality: fd.get('quality'), readiness: fd.get('readiness'), developmentLevel: fd.get('developmentLevel'),
        sweetness: fd.get('sweetness'), acidity: fd.get('acidity'), tannin: fd.get('tannin'), body: fd.get('body'), aromaIntensity: fd.get('aromaIntensity'), flavourIntensity: fd.get('flavourIntensity'), notes: fd.get('notes'), descriptorIds: fd.getAll('descriptors')
      });
      save(next); render();
    };
    const addProfile = document.getElementById('addProfile');
    if (addProfile) addProfile.onclick = () => {
      const next = store();
      const wine = next.wines.find((w) => w.id === id);
      next.grapeProfiles[wine.primaryGrape] = ['citrus', 'lime', 'stenfrugt'];
      save(next); render();
    };
  }

  if (path === '/new') {
    document.getElementById('wineForm').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const wine = Object.fromEntries(fd.entries());
      const next = store();
      next.wines.push({ id: uid(), ...wine });
      save(next); navigate('/wines');
    };
    document.getElementById('purchaseForm').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const p = Object.fromEntries(fd.entries());
      if (!p.wineId) return;
      const next = store();
      next.purchases.push({ id: uid(), ...p, quantity: Number(p.quantity), price: Number(p.price) });
      save(next); render();
    };
    document.getElementById('csv').onclick = () => dl('wine_import_template.csv', 'producer,wine_name,vintage,country,region,appellation,wine_type,primary_grape,blend,drink_from,drink_to,notes');
    document.getElementById('xls').onclick = () => dl('wine_import_template.xls', '<table><tr><th>producer</th><th>wine_name</th><th>vintage</th><th>country</th><th>region</th><th>appellation</th><th>wine_type</th><th>primary_grape</th><th>blend</th><th>drink_from</th><th>drink_to</th><th>notes</th></tr></table>', 'application/vnd.ms-excel');
  }
}

function attachAuthHandlers() {
  let mode = 'login';
  const form = document.getElementById('authForm');
  const errEl = document.getElementById('authError');
  const msgEl = document.getElementById('authMsg');
  const submitBtn = document.getElementById('authSubmit');
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');

  function setMode(m) {
    mode = m;
    submitBtn.textContent = m === 'login' ? 'Log ind' : 'Opret konto';
    tabLogin.className = m === 'login' ? 'btn dark' : 'btn';
    tabSignup.className = m === 'signup' ? 'btn dark' : 'btn';
    errEl.style.display = 'none';
    msgEl.style.display = 'none';
  }

  tabLogin.onclick = () => setMode('login');
  tabSignup.onclick = () => setMode('signup');

  form.onsubmit = async (e) => {
    e.preventDefault();
    errEl.style.display = 'none';
    msgEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Vent...';
    const fd = new FormData(form);
    const email = fd.get('email');
    const password = fd.get('password');
    try {
      if (mode === 'login') {
        await doLogin(email, password);
        await loadData();
        render();
      } else {
        const user = await doSignup(email, password);
        if (currentUser) {
          // Auto-confirmed and logged in
          await loadData();
          render();
        } else {
          msgEl.textContent = 'Tjek din e-mail for at bekræfte din konto.';
          msgEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Opret konto';
        }
      }
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'login' ? 'Log ind' : 'Opret konto';
    }
  };
}

function dl(name, content, type = 'text/csv') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}

/* ── Main render ───────────────────────────────────────── */
function render() {
  const app = document.getElementById('app');

  if (!currentUser || !authToken) {
    app.innerHTML = authPage();
    attachAuthHandlers();
    return;
  }

  const s = store();
  const path = location.pathname;
  let html = '';
  if (path === '/') html = dashboard(s);
  else if (path === '/wines') html = winesPage(s);
  else if (path.startsWith('/wines/')) html = wineDetail(s, path.split('/')[2]);
  else if (path === '/new') html = newPage(s);
  else html = shell('<p>Side ikke fundet.</p>');
  app.innerHTML = html;
  attachHandlers(path, s);
}

/* ── Boot ──────────────────────────────────────────────── */
async function handleHashCallback() {
  const hash = window.location.hash;
  if (!hash) return;
  const params = new URLSearchParams(hash.substring(1));
  const confirmationToken = params.get('confirmation_token');
  const recoveryToken = params.get('recovery_token');

  if (confirmationToken) {
    try {
      await fetch(`${IDENTITY_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: confirmationToken, type: 'signup' })
      });
    } catch {}
    window.location.hash = '';
  }
  if (recoveryToken) {
    try {
      await fetch(`${IDENTITY_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recoveryToken, type: 'recovery' })
      });
    } catch {}
    window.location.hash = '';
  }
}

async function boot() {
  const app = document.getElementById('app');
  await handleHashCallback();
  if (loadAuthFromStorage()) {
    app.innerHTML = '<div class="container" style="text-align:center;margin-top:100px"><p>Indlæser data...</p></div>';
    await loadData();
  }
  render();
}

boot();
