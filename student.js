/* Student portal logic for UPHSD Molino Library Management System */

function switchGate(mode) {
  var login = document.getElementById('gateLogin');
  var reg = document.getElementById('gateRegister');
  var tabL = document.getElementById('gateTabLogin');
  var tabR = document.getElementById('gateTabReg');
  if (!login || !reg) return;
  if (mode === 'register') {
    login.classList.add('hidden');
    reg.classList.remove('hidden');
    if (tabL) tabL.classList.remove('tab-active', 'active');
    if (tabR) tabR.classList.add('tab-active', 'active');
  } else {
    reg.classList.add('hidden');
    login.classList.remove('hidden');
    if (tabR) tabR.classList.remove('tab-active', 'active');
    if (tabL) tabL.classList.add('tab-active', 'active');
  }
}

function studentLogin() {
  var sid = val('loginSid');
  var pass = val('loginPass');
  var err = document.getElementById('loginErr');
  if (err) { err.classList.add('hidden'); err.textContent = ''; }
  if (!validSid(sid)) { showErr(err, 'Student ID must be in format 25-XXXX-XXX'); return; }
  if (!pass) { showErr(err, 'Password is required'); return; }
  var stu = null;
  for (var i = 0; i < DB.students.length; i++) {
    if (DB.students[i].sid === sid) { stu = DB.students[i]; break; }
  }
  if (!stu || stu.password !== pass) { showErr(err, 'Invalid Student ID or password'); return; }
  saveSession({ role: 'student', studentId: stu.id });
  showScreen('screen-student');
  switchStuTab('browse', document.querySelector('#screen-student .tab-btn'));
  renderStudentPortal();
  toast('Welcome back', stu.name);
}

function studentRegister() {
  var name = val('regName');
  var sid = val('regSid');
  var pw = val('regPassword');
  var pw2 = val('regPasswordConfirm');
  var year = val('regYear');
  var section = val('regSection');
  var course = val('regCourse');
  var err = document.getElementById('regErr');
  if (err) { err.classList.add('hidden'); err.textContent = ''; }
  if (!name) { showErr(err, 'Full name is required'); return; }
  if (!validSid(sid)) { showErr(err, 'Student ID must be in format 25-XXXX-XXX'); return; }
  if (!validPassword(pw)) { showErr(err, 'Password must be at least 6 characters'); return; }
  if (pw !== pw2) { showErr(err, 'Passwords do not match'); return; }
  if (!year) { showErr(err, 'Year level is required'); return; }
  if (!section) { showErr(err, 'Section is required'); return; }
  if (!course) { showErr(err, 'Course is required'); return; }
  for (var i = 0; i < DB.students.length; i++) {
    if (DB.students[i].sid === sid) { showErr(err, 'This Student ID is already registered'); return; }
  }
  var id = 's' + (DB.counters.s++);
  DB.students.push({ id: id, sid: sid, name: name, password: pw, year: year, section: section, course: course, photo: null, createdAt: today() });
  save();
  saveSession({ role: 'student', studentId: id });
  showScreen('screen-student');
  switchStuTab('browse', document.querySelector('#screen-student .tab-btn'));
  renderStudentPortal();
  toast('Account created', 'Welcome, ' + name);
}

function switchStuTab(name, btn) {
  document.querySelectorAll('#screen-student .tab-content').forEach(function (el) { el.classList.remove('active'); });
  document.querySelectorAll('#screen-student .tab-btn').forEach(function (el) { el.classList.remove('active'); });
  var tab = document.getElementById('stab-' + name);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'browse') renderStuBrowse();
  else if (name === 'mybooks') renderStuMyBooks();
  else if (name === 'settings') renderStuSettings();
}

function renderStudentPortal() {
  var stu = studentById(session.studentId);
  if (!stu) { logout(); return; }
  var nameEl = document.getElementById('stuHeaderName');
  if (nameEl) nameEl.textContent = stu.name + ' · ' + stu.sid;
  var active = 0, pending = 0;
  for (var i = 0; i < DB.records.length; i++) {
    var r = DB.records[i];
    if (r.studentId !== stu.id) continue;
    if (r.status === 'borrowed' || r.status === 'overdue') active++;
    if (r.status === 'pending') pending++;
  }
  var aEl = document.getElementById('stuActiveCount');
  var pEl = document.getElementById('stuPendingCount');
  if (aEl) aEl.textContent = active;
  if (pEl) pEl.textContent = pending;
  var av = document.getElementById('stuAvatar');
  if (av) av.innerHTML = avatarHTML(stu.name, stu.photo, 52, 20);
  renderStuBrowse();
  renderStuMyBooks();
  renderStuSettings();
}

function renderStuBrowse() {
  var grid = document.getElementById('stuBooksGrid');
  if (!grid) return;
  var q = (val('stuBookSearch') || '').toLowerCase();
  var cat = val('stuCatFilter');
  var list = books().filter(function (b) {
    if (cat && b.category !== cat) return false;
    if (!q) return true;
    return (b.title + ' ' + b.author + ' ' + (b.isbn || '')).toLowerCase().indexOf(q) !== -1;
  });
  if (!list.length) {
    grid.innerHTML = emptyBox('book', 'No books found', 'Try a different search or category.');
    return;
  }
  var html = '<div class="books-grid">';
  for (var i = 0; i < list.length; i++) {
    var b = list[i];
    var avail = b.availableCopies > 0;
    var st = catStyle(b.category);
    var styleStr = (st && st.color) ? ('color:' + st.color) : '';
    html += '<div class="book-card">';
    html += '<div class="book-top"><span class="cat-pill" style="' + styleStr + '">' + esc(b.category) + '</span>';
    html += statusBadge(avail ? 'available' : 'unavailable') + '</div>';
    html += '<h3>' + esc(b.title) + '</h3>';
    html += '<p class="author">' + esc(b.author) + '</p>';
    if (b.description) html += '<p class="desc">' + esc(b.description) + '</p>';
    html += '<div class="book-meta">' + b.availableCopies + ' of ' + b.totalCopies + ' available</div>';
    if (avail) {
      html += '<button class="btn btn-gold" style="width:100%;margin-top:12px" onclick="requestBorrow(\'' + b.id + '\')">Request Borrow</button>';
    } else {
      html += '<button class="btn btn-outline" style="width:100%;margin-top:12px" disabled>Unavailable</button>';
    }
    html += '</div>';
  }
  html += '</div>';
  grid.innerHTML = html;
}

function requestBorrow(bookId) {
  var stu = studentById(session.studentId);
  var book = bookById(bookId);
  if (!stu || !book) return;
  if (book.availableCopies < 1) { toast('Unavailable', 'No copies left of this book.', true); return; }
  for (var i = 0; i < DB.records.length; i++) {
    var r = DB.records[i];
    if (r.studentId === stu.id && r.bookId === bookId && (r.status === 'pending' || r.status === 'borrowed' || r.status === 'overdue')) {
      toast('Already requested', 'You already have an active request or loan for this book.', true); return;
    }
  }
  var active = 0;
  for (var j = 0; j < DB.records.length; j++) {
    var rr = DB.records[j];
    if (rr.studentId === stu.id && (rr.status === 'pending' || rr.status === 'borrowed' || rr.status === 'overdue')) active++;
  }
  if (active >= 5) { toast('Limit reached', 'You can have at most 5 active requests/loans.', true); return; }
  var rid = 'r' + (DB.counters.r++);
  DB.records.push({ id: rid, bookId: bookId, studentId: stu.id, status: 'pending', requestDate: today(), issueDate: null, dueDate: null, returnDate: null });
  save();
  renderStudentPortal();
  toast('Request submitted', 'Waiting for librarian approval.');
}

function renderStuMyBooks() {
  var wrap = document.getElementById('stuMyBooks');
  if (!wrap) return;
  var stu = studentById(session.studentId);
  if (!stu) return;
  var mine = records().filter(function (r) { return r.studentId === stu.id; });
  mine.sort(function (a, b) { return (b.requestDate || '').localeCompare(a.requestDate || ''); });
  if (!mine.length) { wrap.innerHTML = emptyBox('open', 'No borrow records', 'Request a book from the Browse tab.'); return; }
  var html = '<table class="data-table"><thead><tr><th>Book</th><th>Status</th><th>Requested</th><th>Due</th><th></th></tr></thead><tbody>';
  for (var i = 0; i < mine.length; i++) {
    var r = mine[i];
    var b = bookById(r.bookId);
    html += '<tr>';
    html += '<td><strong>' + esc(b ? b.title : 'Unknown') + '</strong><br><span style="font-size:12px;color:var(--muted)">' + esc(b ? b.author : '') + '</span></td>';
    html += '<td>' + statusBadge(r.status) + '</td>';
    html += '<td>' + esc(r.requestDate || '—') + '</td>';
    html += '<td>' + esc(r.dueDate || '—') + '</td>';
    html += '<td>';
    if (r.status === 'pending') {
      html += '<button class="btn btn-outline" style="padding:6px 10px;font-size:12px" onclick="cancelRequest(\'' + r.id + '\')">Cancel</button>';
    }
    html += '</td></tr>';
  }
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

function cancelRequest(rid) {
  openConfirm('Cancel request?', 'This will remove your pending borrow request.', function () {
    for (var i = 0; i < DB.records.length; i++) {
      if (DB.records[i].id === rid && DB.records[i].status === 'pending') {
        DB.records.splice(i, 1); save(); renderStudentPortal(); toast('Request cancelled', ''); return;
      }
    }
  });
}

function renderStuSettings() {
  var stu = studentById(session.studentId);
  if (!stu) return;
  var nameInput = document.getElementById('settingsName');
  if (nameInput) nameInput.value = stu.name || '';
  var av = document.getElementById('settingsAvatar');
  if (av) av.innerHTML = avatarHTML(stu.name, stu.photo, 72, 26);
  var rm = document.getElementById('settingsRemovePhotoBtn');
  if (rm) rm.style.display = stu.photo ? '' : 'none';
  var err = document.getElementById('settingsErr');
  if (err) { err.classList.add('hidden'); err.textContent = ''; }
}

function handlePhotoChange(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  if (file.size > 800 * 1024) { toast('Photo too large', 'Please choose an image under 800 KB.', true); return; }
  var reader = new FileReader();
  reader.onload = function (e) {
    var stu = studentById(session.studentId);
    if (!stu) return;
    stu.photo = e.target.result; save(); renderStuSettings(); renderStudentPortal(); toast('Photo updated', '');
  };
  reader.readAsDataURL(file);
}

function removeSettingsPhoto() {
  var stu = studentById(session.studentId);
  if (!stu) return;
  stu.photo = null; save(); renderStuSettings(); renderStudentPortal(); toast('Photo removed', '');
}

function saveStuSettings() {
  var stu = studentById(session.studentId);
  if (!stu) return;
  var name = val('settingsName');
  var err = document.getElementById('settingsErr');
  if (!name) { showErr(err, 'Name is required'); return; }
  stu.name = name; save(); renderStudentPortal(); toast('Settings saved', '');
}

document.addEventListener('DOMContentLoaded', function () { boot(); });
