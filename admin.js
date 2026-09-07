/* Admin console logic for UPHSD Molino Library Management System */

function adminLogin() {
  var user = val('adminUser');
  var pass = val('adminPass');
  var err = document.getElementById('adminLoginErr');
  if (err) { err.classList.add('hidden'); err.textContent = ''; }
  if (user === 'admin' && pass === 'library123') {
    saveSession({ role: 'admin', studentId: null });
    showScreen('screen-admin');
    switchTab('dashboard', document.querySelector('#screen-admin .tab-btn'));
    toast('Admin login', 'Welcome, librarian.');
    return;
  }
  showErr(err, 'Invalid username or password');
}

function switchTab(name, btn) {
  document.querySelectorAll('#screen-admin .tab-content').forEach(function (el) { el.classList.remove('active'); });
  document.querySelectorAll('#screen-admin .tab-btn').forEach(function (el) { el.classList.remove('active'); });
  var tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'dashboard') renderDashboard();
  else if (name === 'books') renderBooks();
  else if (name === 'students') renderStudents();
  else if (name === 'requests') renderRequests();
  else if (name === 'borrow') renderBorrow();
  else if (name === 'history') renderHistory();
  updateReqBadge();
}

function updateReqBadge() {
  var n = 0;
  for (var i = 0; i < DB.records.length; i++) {
    if (DB.records[i].status === 'pending') n++;
  }
  var badge = document.getElementById('reqBadge');
  if (badge) { badge.textContent = n; badge.style.display = n > 0 ? '' : 'none'; }
}

function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

function renderDashboard() {
  var totalBooks = DB.books.length, totalCopies = 0, avail = 0;
  for (var i = 0; i < DB.books.length; i++) { totalCopies += DB.books[i].totalCopies; avail += DB.books[i].availableCopies; }
  var totalStu = DB.students.length, pending = 0, borrowed = 0, overdue = 0;
  for (var j = 0; j < DB.records.length; j++) {
    var s = DB.records[j].status;
    if (s === 'pending') pending++; if (s === 'borrowed') borrowed++; if (s === 'overdue') overdue++;
  }
  setText('dashBooks', totalBooks); setText('dashCopies', totalCopies); setText('dashAvail', avail);
  setText('dashStudents', totalStu); setText('dashPending', pending); setText('dashBorrowed', borrowed); setText('dashOverdue', overdue);
  var recent = DB.records.slice().sort(function (a, b) { return (b.requestDate || '').localeCompare(a.requestDate || ''); }).slice(0, 8);
  var wrap = document.getElementById('dashRecent');
  if (!wrap) return;
  if (!recent.length) { wrap.innerHTML = emptyBox('clock', 'No activity yet', 'Borrow requests will appear here.'); return; }
  var html = '<table class="data-table"><thead><tr><th>Student</th><th>Book</th><th>Status</th><th>Date</th></tr></thead><tbody>';
  for (var k = 0; k < recent.length; k++) {
    var r = recent[k], st = studentById(r.studentId), bk = bookById(r.bookId);
    html += '<tr><td>' + esc(st ? st.name : '—') + '</td><td>' + esc(bk ? bk.title : '—') + '</td><td>' + statusBadge(r.status) + '</td><td>' + esc(r.requestDate || '—') + '</td></tr>';
  }
  html += '</tbody></table>'; wrap.innerHTML = html;
}

function renderBooks() {
  var wrap = document.getElementById('booksTable'); if (!wrap) return; refreshCategorySelects();
  var q = (val('bookSearch') || '').toLowerCase(), cat = val('bookCatFilter');
  var list = books().filter(function (b) {
    if (cat && b.category !== cat) return false;
    if (!q) return true;
    return (b.title + ' ' + b.author + ' ' + (b.isbn || '')).toLowerCase().indexOf(q) !== -1;
  });
  if (!list.length) { wrap.innerHTML = emptyBox('book', 'No books', 'Add a book using the form above.'); return; }
  var html = '<table class="data-table"><thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Copies</th><th></th></tr></thead><tbody>';
  for (var i = 0; i < list.length; i++) {
    var b = list[i];
    html += '<tr><td><strong>' + esc(b.title) + '</strong><br><span style="font-size:12px;color:var(--muted)">' + esc(b.isbn || '') + '</span></td>';
    html += '<td>' + esc(b.author) + '</td><td><span class="cat-pill" style="' + catStyle(b.category) + '">' + esc(b.category) + '</span></td>';
    html += '<td>' + b.availableCopies + ' / ' + b.totalCopies + '</td>';
    html += '<td><button class="btn btn-outline" style="padding:6px 10px;font-size:12px;color:var(--danger)" onclick="deleteBook(\'' + b.id + '\')">Delete</button></td></tr>';
  }
  html += '</tbody></table>'; wrap.innerHTML = html;
}

function addBook() {
  var title = val('bTitle'), author = val('bAuthor'), category = val('bCategory'), isbn = val('bIsbn'), desc = val('bDesc');
  var copies = parseInt(val('bCopies') || '1', 10), err = document.getElementById('bookErr');
  if (err) { err.classList.add('hidden'); err.textContent = ''; }
  if (!title || !author) { showErr(err, 'Title and author are required'); return; }
  if (!category) { showErr(err, 'Category is required'); return; }
  if (isNaN(copies) || copies < 1) { showErr(err, 'Copies must be at least 1'); return; }
  var id = 'b' + (DB.counters.b++);
  DB.books.push({ id: id, title: title, author: author, category: category, isbn: isbn || '', description: desc || '', totalCopies: copies, availableCopies: copies });
  if (DEFAULT_CATEGORIES.indexOf(category) === -1 && DB.customCategories.indexOf(category) === -1) DB.customCategories.push(category);
  save(); clearBookForm(); renderBooks(); toast('Book added', title);
}

function clearBookForm() {
  ['bTitle', 'bAuthor', 'bIsbn', 'bDesc', 'bCopies'].forEach(function (id) {
    var el = document.getElementById(id); if (el) el.value = id === 'bCopies' ? '1' : '';
  });
}

function deleteBook(id) {
  openConfirm('Delete book?', 'This cannot be undone. Active loans will remain in history.', function () {
    for (var i = 0; i < DB.books.length; i++) {
      if (DB.books[i].id === id) { DB.books.splice(i, 1); save(); renderBooks(); renderDashboard(); toast('Book deleted', ''); return; }
    }
  });
}

function renderStudents() {
  var wrap = document.getElementById('studentsTable'); if (!wrap) return;
  var q = (val('stuSearch') || '').toLowerCase();
  var list = students().filter(function (s) {
    if (!q) return true;
    return (s.name + ' ' + s.sid + ' ' + s.course).toLowerCase().indexOf(q) !== -1;
  });
  if (!list.length) { wrap.innerHTML = emptyBox('users', 'No students', 'Students register from the student portal, or add them here.'); return; }
  var html = '<table class="data-table"><thead><tr><th>Name</th><th>Student ID</th><th>Course / Year</th><th></th></tr></thead><tbody>';
  for (var i = 0; i < list.length; i++) {
    var s = list[i];
    html += '<tr><td><div style="display:flex;align-items:center;gap:10px">' + avatarHTML(s.name, s.photo, 36, 14) + '<strong>' + esc(s.name) + '</strong></div></td>';
    html += '<td>' + esc(s.sid) + '</td><td>' + esc(s.course) + '<br><span style="font-size:12px;color:var(--muted)">' + esc(s.year) + ' · ' + esc(s.section) + '</span></td>';
    html += '<td><button class="btn btn-outline" style="padding:6px 10px;font-size:12px;color:var(--danger)" onclick="deleteStudent(\'' + s.id + '\')">Delete</button></td></tr>';
  }
  html += '</tbody></table>'; wrap.innerHTML = html;
}

function adminAddStudent() {
  var name = val('asName'), sid = val('asSid'), pw = val('asPass') || 'student123', year = val('asYear'), section = val('asSection'), course = val('asCourse');
  var err = document.getElementById('asErr');
  if (err) { err.classList.add('hidden'); err.textContent = ''; }
  if (!name || !validSid(sid)) { showErr(err, 'Valid name and Student ID (25-XXXX-XXX) required'); return; }
  for (var i = 0; i < DB.students.length; i++) { if (DB.students[i].sid === sid) { showErr(err, 'Student ID already exists'); return; } }
  var id = 's' + (DB.counters.s++);
  DB.students.push({ id: id, sid: sid, name: name, password: pw, year: year || '1st Year', section: section || 'A', course: course || 'Other', photo: null, createdAt: today() });
  save();
  ['asName', 'asSid', 'asPass', 'asYear', 'asSection', 'asCourse'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
  renderStudents(); toast('Student added', name);
}

function deleteStudent(id) {
  openConfirm('Delete student?', 'Their borrow history will remain.', function () {
    for (var i = 0; i < DB.students.length; i++) {
      if (DB.students[i].id === id) { DB.students.splice(i, 1); save(); renderStudents(); toast('Student deleted', ''); return; }
    }
  });
}

function renderRequests() {
  var wrap = document.getElementById('requestsTable'); if (!wrap) return;
  var list = records().filter(function (r) { return r.status === 'pending'; });
  if (!list.length) { wrap.innerHTML = emptyBox('check', 'No pending requests', 'All caught up.'); return; }
  var html = '<table class="data-table"><thead><tr><th>Student</th><th>Book</th><th>Requested</th><th></th></tr></thead><tbody>';
  for (var i = 0; i < list.length; i++) {
    var r = list[i], st = studentById(r.studentId), bk = bookById(r.bookId);
    html += '<tr><td>' + esc(st ? st.name + ' (' + st.sid + ')' : '—') + '</td><td>' + esc(bk ? bk.title : '—') + '</td><td>' + esc(r.requestDate) + '</td>';
    html += '<td style="white-space:nowrap"><button class="btn btn-gold" style="padding:6px 12px;font-size:12px;margin-right:6px" onclick="approveRequest(\'' + r.id + '\')">Approve</button>';
    html += '<button class="btn btn-outline" style="padding:6px 12px;font-size:12px" onclick="rejectRequest(\'' + r.id + '\')">Reject</button></td></tr>';
  }
  html += '</tbody></table>'; wrap.innerHTML = html;
}

function approveRequest(rid) {
  var r = null;
  for (var i = 0; i < DB.records.length; i++) { if (DB.records[i].id === rid) { r = DB.records[i]; break; } }
  if (!r || r.status !== 'pending') return;
  var book = bookById(r.bookId);
  if (!book || book.availableCopies < 1) { toast('Cannot approve', 'No available copies.', true); return; }
  book.availableCopies--; r.status = 'borrowed'; r.issueDate = today(); r.dueDate = plusDays(LOAN_DAYS);
  save(); renderRequests(); renderBorrow(); updateReqBadge(); toast('Approved', 'Book issued. Due ' + r.dueDate);
}

function rejectRequest(rid) {
  openConfirm('Reject request?', 'The student will need to request again.', function () {
    for (var i = 0; i < DB.records.length; i++) {
      if (DB.records[i].id === rid && DB.records[i].status === 'pending') { DB.records.splice(i, 1); save(); renderRequests(); updateReqBadge(); toast('Request rejected', ''); return; }
    }
  });
}

function renderBorrow() {
  var wrap = document.getElementById('borrowTable'); if (!wrap) return;
  var list = records().filter(function (r) { return r.status === 'borrowed' || r.status === 'overdue'; });
  list.sort(function (a, b) { return (a.dueDate || '').localeCompare(b.dueDate || ''); });
  if (!list.length) { wrap.innerHTML = emptyBox('open', 'No active loans', 'Approved books will show here.'); return; }
  var html = '<table class="data-table"><thead><tr><th>Student</th><th>Book</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>';
  for (var i = 0; i < list.length; i++) {
    var r = list[i], st = studentById(r.studentId), bk = bookById(r.bookId);
    html += '<tr><td>' + esc(st ? st.name : '—') + '</td><td>' + esc(bk ? bk.title : '—') + '</td><td>' + esc(r.issueDate || '—') + '</td><td>' + esc(r.dueDate || '—') + '</td><td>' + statusBadge(r.status) + '</td>';
    html += '<td><button class="btn btn-gold" style="padding:6px 12px;font-size:12px" onclick="returnBook(\'' + r.id + '\')">Mark Returned</button></td></tr>';
  }
  html += '</tbody></table>'; wrap.innerHTML = html;
}

function returnBook(rid) {
  var r = null;
  for (var i = 0; i < DB.records.length; i++) { if (DB.records[i].id === rid) { r = DB.records[i]; break; } }
  if (!r || (r.status !== 'borrowed' && r.status !== 'overdue')) return;
  var book = bookById(r.bookId);
  if (book) book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
  r.status = 'returned'; r.returnDate = today();
  save(); renderBorrow(); renderHistory(); renderDashboard(); toast('Book returned', '');
}

function renderHistory() {
  var wrap = document.getElementById('historyTable'); if (!wrap) return;
  var statusF = val('histStatus');
  var list = records().filter(function (r) { if (statusF && r.status !== statusF) return false; return true; });
  list.sort(function (a, b) { return (b.requestDate || '').localeCompare(a.requestDate || ''); });
  if (!list.length) { wrap.innerHTML = emptyBox('clock', 'No records', 'History will appear as students borrow books.'); return; }
  var html = '<table class="data-table"><thead><tr><th>Student</th><th>Book</th><th>Status</th><th>Requested</th><th>Issued</th><th>Due</th><th>Returned</th></tr></thead><tbody>';
  for (var i = 0; i < list.length; i++) {
    var r = list[i], st = studentById(r.studentId), bk = bookById(r.bookId);
    html += '<tr><td>' + esc(st ? st.name : '—') + '</td><td>' + esc(bk ? bk.title : '—') + '</td><td>' + statusBadge(r.status) + '</td>';
    html += '<td>' + esc(r.requestDate || '—') + '</td><td>' + esc(r.issueDate || '—') + '</td><td>' + esc(r.dueDate || '—') + '</td><td>' + esc(r.returnDate || '—') + '</td></tr>';
  }
  html += '</tbody></table>'; wrap.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function () { boot(); });
