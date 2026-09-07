const STORE_KEY = 'uphsd_library_v3';
const SESSION_KEY = 'uphsd_session';
const FLASH_KEY = 'uphsd_flash';
const DEFAULT_CATEGORIES = ['Fiction', 'Science', 'History', 'Reference'];
const LOAN_DAYS = 14;

function seed() {
  return {
    books: [
      { id: 'b1', title: 'Noli Me Tangere', author: 'Jose Rizal', category: 'Fiction', isbn: '978-9710579891', description: 'The classic Filipino novel of colonial society.', totalCopies: 4, availableCopies: 2 },
      { id: 'b2', title: 'El Filibusterismo', author: 'Jose Rizal', category: 'Fiction', isbn: '978-9710579907', description: 'The sequel to Noli Me Tangere.', totalCopies: 3, availableCopies: 3 },
      { id: 'b3', title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', isbn: '978-0553380163', description: 'From the Big Bang to black holes.', totalCopies: 3, availableCopies: 1 },
      { id: 'b4', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'History', isbn: '978-0062316097', description: 'A groundbreaking narrative of humanity.', totalCopies: 2, availableCopies: 0 },
      { id: 'b5', title: 'The Filipino Primitive', author: 'Nick Joaquin', category: 'History', isbn: '978-9715505543', description: 'Essays on Philippine culture and history.', totalCopies: 2, availableCopies: 2 },
      { id: 'b6', title: 'Cosmos', author: 'Carl Sagan', category: 'Science', isbn: '978-0345539434', description: 'A personal voyage through the universe.', totalCopies: 3, availableCopies: 2 },
      { id: 'b7', title: 'Oxford English Dictionary', author: 'Oxford University Press', category: 'Reference', isbn: '978-0199571123', description: 'Comprehensive reference dictionary.', totalCopies: 5, availableCopies: 5 },
      { id: 'b8', title: 'Florante at Laura', author: 'Francisco Balagtas', category: 'Fiction', isbn: '978-9712300011', description: 'A classic Filipino awit.', totalCopies: 3, availableCopies: 3 }
    ],
    students: [],
    records: [],
    counters: { b: 9, s: 1, r: 1 },
    customCategories: []
  };
}

function load() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  var fresh = seed();
  localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
  return fresh;
}

var DB = load();

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(DB));
}

function books() { return DB.books; }
function students() { return DB.students; }
function records() { return DB.records; }
function bookById(id) {
  for (var i = 0; i < DB.books.length; i++) {
    if (DB.books[i].id === id) return DB.books[i];
  }
  return null;
}
function studentById(id) {
  for (var i = 0; i < DB.students.length; i++) {
    if (DB.students[i].id === id) return DB.students[i];
  }
  return null;
}

function getCategories() {
  var list = DEFAULT_CATEGORIES.slice();
  if (DB.customCategories) {
    for (var i = 0; i < DB.customCategories.length; i++) {
      if (list.indexOf(DB.customCategories[i]) === -1) list.push(DB.customCategories[i]);
    }
  }
  for (var j = 0; j < DB.books.length; j++) {
    var c = DB.books[j].category;
    if (list.indexOf(c) === -1) list.push(c);
  }
  return list;
}

function refreshCategorySelects() {
  var cats = getCategories();
  var bookFilter = document.getElementById('bookCatFilter');
  var stuFilter = document.getElementById('stuCatFilter');
  var bCat = document.getElementById('bCategory');
  if (bookFilter) {
    var cur = bookFilter.value;
    var html = '<option value="">All Categories</option>';
    for (var i = 0; i < cats.length; i++) html += '<option>' + esc(cats[i]) + '</option>';
    bookFilter.innerHTML = html;
    if (cats.indexOf(cur) !== -1) bookFilter.value = cur;
  }
  if (stuFilter) {
    var cur2 = stuFilter.value;
    var html2 = '<option value="">All Categories</option>';
    for (var i = 0; i < cats.length; i++) html2 += '<option>' + esc(cats[i]) + '</option>';
    stuFilter.innerHTML = html2;
    if (cats.indexOf(cur2) !== -1) stuFilter.value = cur2;
  }
  if (bCat) {
    var cur3 = bCat.value;
    var html3 = '';
    for (var i = 0; i < cats.length; i++) html3 += '<option>' + esc(cats[i]) + '</option>';
    bCat.innerHTML = html3;
    if (cats.indexOf(cur3) !== -1) bCat.value = cur3;
  }
}

function loadSession() {
  try {
    var raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      var s = JSON.parse(raw);
      if (s && (s.role === 'admin' || s.role === 'student')) return s;
    }
  } catch (e) {}
  return { role: null, studentId: null };
}

function saveSession(s) {
  session = s || { role: null, studentId: null };
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
}

var session = loadSession();

function flashToast(title, desc) {
  try { sessionStorage.setItem(FLASH_KEY, JSON.stringify({ title: title, desc: desc })); } catch (e) {}
}

function showFlashToast() {
  try {
    var raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return;
    sessionStorage.removeItem(FLASH_KEY);
    var f = JSON.parse(raw);
    if (f && f.title) toast(f.title, f.desc || '');
  } catch (e) {}
}

function refreshOverdue() {
  var todayStr = today();
  for (var i = 0; i < DB.records.length; i++) {
    var r = DB.records[i];
    if (r.status === 'borrowed' && r.dueDate && r.dueDate < todayStr) r.status = 'overdue';
  }
  save();
}

function toast(title, desc, isError) {
  var wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  var el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.innerHTML = '<strong>' + esc(title) + '</strong>' + (desc ? '<span>' + esc(desc) + '</span>' : '');
  wrap.appendChild(el);
  setTimeout(function () { el.remove(); }, 3000);
}

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#39;');
}

function openModal(id) { var m = document.getElementById(id); if (m) m.classList.add('open'); }
function closeModal(id) { var m = document.getElementById(id); if (m) m.classList.remove('open'); }
document.querySelectorAll('.overlay').forEach(function (m) {
  m.addEventListener('click', function (e) { if (e.target === m) m.classList.remove('open'); });
});

function openConfirm(title, desc, cb) {
  var t = document.getElementById('confirmTitle');
  var d = document.getElementById('confirmDesc');
  var ok = document.getElementById('confirmOk');
  var ov = document.getElementById('confirmOverlay');
  if (!t || !d || !ok || !ov) { cb(); return; }
  t.textContent = title;
  d.textContent = desc;
  ok.onclick = function () { cb(); closeConfirm(); };
  ov.classList.add('open');
}
function closeConfirm() { var ov = document.getElementById('confirmOverlay'); if (ov) ov.classList.remove('open'); }

var CAT_STYLES = {
  Fiction: { badge: 'b-fic', color: '#8a4b06' },
  Science: { badge: 'b-sci', color: '#1a4b8f' },
  History: { badge: 'b-his', color: '#5b2c9a' },
  Reference: { badge: 'b-ref', color: '#1f6b41' }
};
var CUSTOM_COLORS = ['#b3261e', '#8a6a00', '#1f6b41', '#6b3fa0', '#1a4b8f', '#0e7490', '#7c3aed', '#c2410c'];

function catStyle(cat) {
  if (CAT_STYLES[cat]) return CAT_STYLES[cat];
  var hash = 0;
  for (var i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  var color = CUSTOM_COLORS[Math.abs(hash) % CUSTOM_COLORS.length];
  CAT_STYLES[cat] = { badge: '', color: color };
  return CAT_STYLES[cat];
}

function statusBadge(s) {
  if (s === 'returned') return '<span class="badge b-returned">Returned</span>';
  if (s === 'overdue') return '<span class="badge b-overdue">Overdue</span>';
  if (s === 'pending') return '<span class="badge b-pending">Pending</span>';
  return '<span class="badge b-borrowed">Borrowed</span>';
}

function today() { return new Date().toISOString().slice(0, 10); }
function plusDays(n) { return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10); }

function formatSid(input) {
  var v = input.value.replace(/\D/g, '').slice(0, 9);
  var out = v.slice(0, 2);
  if (v.length > 2) out += '-' + v.slice(2, 6);
  if (v.length > 6) out += '-' + v.slice(6, 9);
  input.value = out;
}
function validSid(sid) { return /^25-\d{4}-\d{3}$/.test(sid); }
function validPassword(pw) { return typeof pw === 'string' && pw.length >= 6; }

function avatarHTML(name, photo, size, fontSize) {
  size = size || 38; fontSize = fontSize || 14;
  if (photo) return '<div class="avatar" style="width:' + size + 'px;height:' + size + 'px;padding:0;overflow:hidden"><img src="' + photo + '" alt="' + esc(name) + '" style="width:100%;height:100%;object-fit:cover"></div>';
  var letter = (name || '?')[0].toUpperCase();
  return '<div class="avatar" style="width:' + size + 'px;height:' + size + 'px;font-size:' + fontSize + 'px">' + esc(letter) + '</div>';
}

function showScreen(id) {
  var screens = ['screen-landing', 'screen-admin-landing', 'screen-admin-login', 'screen-student-gate', 'screen-admin', 'screen-student'];
  for (var i = 0; i < screens.length; i++) {
    var el = document.getElementById(screens[i]);
    if (el) el.classList.add('hidden');
  }
  var target = document.getElementById(id);
  if (!target) {
    if (id === 'screen-admin' || id === 'screen-admin-login' || id === 'screen-admin-landing') { window.location.href = 'admin.html'; return; }
    window.location.href = 'index.html';
    return;
  }
  target.classList.remove('hidden');
  window.scrollTo(0, 0);
}

function goLanding() {
  saveSession({ role: null, studentId: null });
  if (document.getElementById('screen-landing')) showScreen('screen-landing');
  else window.location.href = 'index.html';
}
function goAdminLogin() {
  if (document.getElementById('screen-admin-login')) {
    var e = document.getElementById('adminErr');
    if (e) e.classList.add('hidden');
    showScreen('screen-admin-login');
  } else window.location.href = 'admin.html';
}
function chooseRole(role) {
  if (role === 'admin') goAdminLogin();
  else {
    if (document.getElementById('screen-student-gate')) { switchGate('login'); showScreen('screen-student-gate'); }
    else window.location.href = 'index.html';
  }
}
function logout() {
  saveSession({ role: null, studentId: null });
  if (document.getElementById('screen-landing')) { showScreen('screen-landing'); toast('Logged out', 'You have been signed out.'); }
  else if (document.getElementById('screen-admin-landing')) { showScreen('screen-admin-landing'); toast('Logged out', 'You have been signed out.'); }
  else window.location.href = 'index.html';
}

function emptyBox(icon, title, sub) {
  var svgs = {
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    open: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
  };
  var path = svgs[icon] || svgs.book;
  return '<div class="empty"><svg width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">' + path + '</svg><p>' + esc(title) + '</p><span>' + esc(sub) + '</span></div>';
}

function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
function showErr(el, msg) { if (!el) return; el.textContent = msg; el.classList.remove('hidden'); }

window.addEventListener('storage', function (e) {
  if (!e) return;
  if (e.key === STORE_KEY) {
    try { DB = load(); } catch (err) { return; }
    refreshOverdue();
    refreshCategorySelects();
    try {
      var adminEl = document.getElementById('screen-admin');
      if (adminEl && !adminEl.classList.contains('hidden')) {
        var active = document.querySelector('#screen-admin .tab-content.active');
        var id = active ? active.id : 'tab-dashboard';
        if (id === 'tab-dashboard') renderDashboard();
        else if (id === 'tab-books') renderBooks();
        else if (id === 'tab-students') renderStudents();
        else if (id === 'tab-requests') renderRequests();
        else if (id === 'tab-borrow') renderBorrow();
        else if (id === 'tab-history') renderHistory();
        updateReqBadge();
      }
      var stuEl = document.getElementById('screen-student');
      if (stuEl && !stuEl.classList.contains('hidden') && session.role === 'student' && studentById(session.studentId)) renderStudentPortal();
    } catch (err) {}
  }
});

function boot() {
  refreshOverdue();
  refreshCategorySelects();
  showFlashToast();
  try {
    if (window.location && window.location.protocol === 'file:') {
      var w = document.getElementById('fileWarn');
      if (w) w.classList.remove('hidden');
    }
  } catch (e) {}
  session = loadSession();
  var isAdminPage = !!document.getElementById('screen-admin');
  var isIndexPage = !!document.getElementById('screen-landing');
  if (isAdminPage) {
    if (session.role === 'admin') {
      showScreen('screen-admin');
      switchTab('dashboard', document.querySelector('#screen-admin .tab-btn'));
    } else showScreen('screen-admin-landing');
    return;
  }
  if (isIndexPage) {
    if (session.role === 'student' && studentById(session.studentId)) {
      showScreen('screen-student');
      switchStuTab('browse', document.querySelector('#screen-student .tab-btn'));
      renderStudentPortal();
    } else {
      saveSession({ role: null, studentId: null });
      showScreen('screen-landing');
    }
  }
}
