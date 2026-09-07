const ADMIN_CREDENTIALS = { username: 'admin', password: 'library123' };

function addCategory() {
  var input = document.getElementById('bNewCat');
  var name = input.value.trim();
  if (!name) return;
  if (!DB.customCategories) DB.customCategories = [];
  var cats = getCategories();
  for (var i = 0; i < cats.length; i++) {
    if (cats[i].toLowerCase() === name.toLowerCase()) {
      toast('Duplicate', 'This category already exists.', true);
      return;
    }
  }
  DB.customCategories.push(name);
  save();
  input.value = '';
  refreshCategorySelects();
  document.getElementById('bCategory').value = name;
  toast('Category added', '"' + name + '" is now available.');
}

function openManageCategories() {
  renderManageCatList();
  openModal('manageCatModal');
}

function renderManageCatList() {
  var cats = getCategories();
  var el = document.getElementById('manageCatList');
  var html = '';
  for (var i = 0; i < cats.length; i++) {
    var cat = cats[i];
    var isDefault = DEFAULT_CATEGORIES.indexOf(cat) !== -1;
    var count = 0;
    for (var j = 0; j < books().length; j++) {
      if (books()[j].category === cat) count++;
    }
    var cs = catStyle(cat);
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#faf7f1;border:1px solid var(--line);border-radius:10px">';
    html += '<div style="display:flex;align-items:center;gap:10px">';
    html += '<span class="dot" style="background:' + cs.color + '"></span>';
    html += '<span style="font-weight:700;font-size:14px">' + esc(cat) + '</span>';
    html += '<span style="font-size:12px;color:var(--muted)">' + count + ' book(s)</span>';
    if (isDefault) html += '<span style="font-size:11px;color:var(--muted);background:var(--line);padding:2px 8px;border-radius:6px">Default</span>';
    html += '</div>';
    if (!isDefault) {
      html += '<button class="icon-btn" onclick="deleteCategoryFromManager(\'' + esc(cat) + '\')" title="Delete category">';
      html += '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></button>';
    }
    html += '</div>';
  }
  el.innerHTML = html;
}

function deleteCategoryFromManager(cat) {
  var count = 0;
  for (var i = 0; i < books().length; i++) {
    if (books()[i].category === cat) count++;
  }
  if (count) {
    toast('Cannot delete', count + ' book(s) are assigned to "' + cat + '". Reassign or remove them first.', true);
    return;
  }
  openConfirm('Delete category "' + cat + '"?', 'This will permanently remove the category.', function () {
    if (!DB.customCategories) DB.customCategories = [];
    var newCats = [];
    for (var i = 0; i < DB.customCategories.length; i++) {
      if (DB.customCategories[i] !== cat) newCats.push(DB.customCategories[i]);
    }
    DB.customCategories = newCats;
    save();
    refreshCategorySelects();
    renderManageCatList();
    toast('Category deleted', '"' + cat + '" has been removed.');
  });
}

function adminLogin() {
  var uEl = document.getElementById('adminUser');
  var pEl = document.getElementById('adminPass');
  var err = document.getElementById('adminErr');
  if (!uEl || !pEl) {
    window.location.href = 'admin.html';
    return;
  }
  var u = uEl.value.trim();
  var p = pEl.value;
  if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
    if (err) err.classList.add('hidden');
    saveSession({ role: 'admin', studentId: null });
    pEl.value = '';
    showScreen('screen-admin');
    switchTab('dashboard', document.querySelector('#screen-admin .tab-btn'));
    toast('Welcome, Admin', 'You are logged in to the library console.');
  } else if (err) {
    err.textContent = 'Invalid username or password.';
    err.classList.remove('hidden');
  }
}

function switchTab(name, btn) {
  if (!document.getElementById('tab-' + name)) return;
  var tabs = document.querySelectorAll('#screen-admin .tab-content');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  var btns = document.querySelectorAll('#screen-admin .tab-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('tab-active');
  document.getElementById('tab-' + name).classList.add('active');
  if (btn) btn.classList.add('tab-active');
  if (name === 'dashboard') renderDashboard();
  if (name === 'books') renderBooks();
  if (name === 'students') renderStudents();
  if (name === 'requests') renderRequests();
  if (name === 'borrow') renderBorrow();
  if (name === 'history') renderHistory();
  updateReqBadge();
}

function updateReqBadge() {
  var b = document.getElementById('reqBadge');
  if (!b) return;
  var n = 0;
  for (var i = 0; i < records().length; i++) {
    if (records()[i].status === 'pending') n++;
  }
  b.textContent = n || '';
  b.style.display = n ? '' : 'none';
}

function renderDashboard() {
  if (!document.getElementById('statCards')) return;
  var recs = records();
  var active = 0, overdue = 0, pending = 0;
  for (var i = 0; i < recs.length; i++) {
    if (recs[i].status === 'borrowed' || recs[i].status === 'overdue') active++;
    if (recs[i].status === 'overdue') overdue++;
    if (recs[i].status === 'pending') pending++;
  }
  var totalCopies = 0, availCopies = 0;
  for (var i = 0; i < books().length; i++) {
    totalCopies += books()[i].totalCopies;
    availCopies += books()[i].availableCopies;
  }
  var borrowed = totalCopies - availCopies;
  var util = totalCopies ? Math.round(borrowed / totalCopies * 100) : 0;

  var cards = [
    { label: 'Total Books', value: books().length, sub: totalCopies + ' copies in library', color: '#7a0c0c', ic: 'book' },
    { label: 'Students', value: students().length, sub: 'Registered members', color: '#8a6a00', ic: 'users' },
    { label: 'Active Borrows', value: active, sub: pending + ' pending request(s)', color: '#6b3fa0', ic: 'open' },
    { label: 'Overdue', value: overdue, sub: 'Needs attention', color: '#b3261e', ic: 'clock' }
  ];
  var icons = {
    book: '<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    users: '<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    open: '<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    clock: '<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  };
  var cardsHtml = '';
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i];
    cardsHtml += '<div class="stat-card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div>';
    cardsHtml += '<p style="margin:0 0 4px;font-size:13px;color:var(--muted);font-weight:600">' + c.label + '</p>';
    cardsHtml += '<p style="margin:0 0 2px;font-size:30px;font-weight:800;line-height:1">' + c.value + '</p>';
    cardsHtml += '<p style="margin:0;font-size:12px;color:var(--muted)">' + c.sub + '</p></div>';
    cardsHtml += '<div class="stat-ic" style="color:' + c.color + '">' + icons[c.ic] + '</div></div></div>';
  }
  document.getElementById('statCards').innerHTML = cardsHtml;

  var cats = getCategories();
  var catHtml = '<div style="padding:16px 16px 12px;border-bottom:1px solid var(--line)"><strong>Collection by Category</strong></div><div style="padding:20px;display:flex;flex-direction:column;gap:20px">';
  for (var i = 0; i < cats.length; i++) {
    var cat = cats[i];
    var bs = [];
    for (var j = 0; j < books().length; j++) {
      if (books()[j].category === cat) bs.push(books()[j]);
    }
    var tot = 0, av = 0;
    for (var j = 0; j < bs.length; j++) {
      tot += bs[j].totalCopies;
      av += bs[j].availableCopies;
    }
    var br = tot - av;
    var pct = tot ? Math.round(br / tot * 100) : 0;
    var st = catStyle(cat);
    catHtml += '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px">';
    catHtml += '<div style="display:flex;align-items:center;gap:8px"><span class="dot" style="background:' + st.color + '"></span><span style="font-weight:700">' + cat + '</span>';
    catHtml += '<span class="badge ' + st.badge + '">' + bs.length + ' titles</span></div>';
    catHtml += '<span style="color:var(--muted)">' + br + '/' + tot + ' out · ' + av + ' available</span></div>';
    catHtml += '<div class="progress"><div style="width:' + pct + '%"></div></div></div>';
  }
  catHtml += '<div style="background:#faf7f1;border:1px solid var(--line);border-radius:10px;padding:16px;display:flex;justify-content:space-between;align-items:center">';
  catHtml += '<div><p style="margin:0 0 2px;font-size:14px;font-weight:700">Overall Utilization</p><p style="margin:0;font-size:12px;color:var(--muted)">' + borrowed + ' of ' + totalCopies + ' copies currently out</p></div>';
  catHtml += '<span style="font-size:28px;font-weight:800;color:var(--maroon)">' + util + '%</span></div></div>';
  document.getElementById('categoryCard').innerHTML = catHtml;

  var sorted = recs.slice().sort(function (a, b) {
    return new Date(b.requestDate) - new Date(a.requestDate);
  });
  var recent = sorted.slice(0, 7);
  var actHtml = '<div style="padding:16px 16px 12px;border-bottom:1px solid var(--line)"><strong>Recent Activity</strong></div>';
  actHtml += '<div style="padding:12px;display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto">';
  if (recent.length === 0) {
    actHtml += '<p style="text-align:center;color:var(--muted);padding:20px;font-size:13px">No activity yet.</p>';
  } else {
    for (var i = 0; i < recent.length; i++) {
      var r = recent[i];
      var bk = bookById(r.bookId);
      var st = studentById(r.studentId);
      if (!bk || !st) continue;
      var cs = catStyle(bk.category);
      actHtml += '<div style="display:flex;align-items:flex-start;gap:10px;border:1px solid #f2ece2;border-radius:8px;padding:10px">';
      actHtml += '<span class="dot" style="background:' + cs.color + ';margin-top:4px"></span>';
      actHtml += '<div style="flex:1;min-width:0"><p style="margin:0;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(st.name) + '</p>';
      actHtml += '<p style="margin:0;font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">"' + esc(bk.title) + '"</p>';
      actHtml += '<p style="margin:0;font-size:11px;color:#b0a596">' + r.requestDate + '</p></div>' + statusBadge(r.status) + '</div>';
    }
  }
  actHtml += '</div>';
  document.getElementById('activityCard').innerHTML = actHtml;
}

function renderBooks() {
  var searchEl = document.getElementById('bookSearch');
  var catEl = document.getElementById('bookCatFilter');
  var grid = document.getElementById('booksGrid');
  if (!searchEl || !catEl || !grid) return;
  var search = searchEl.value.toLowerCase();
  var cat = catEl.value;
  var filtered = [];
  for (var i = 0; i < books().length; i++) {
    var b = books()[i];
    var matchCat = !cat || b.category === cat;
    var matchSearch = !search || b.title.toLowerCase().indexOf(search) !== -1 || b.author.toLowerCase().indexOf(search) !== -1 || b.isbn.toLowerCase().indexOf(search) !== -1;
    if (matchCat && matchSearch) filtered.push(b);
  }
  if (filtered.length === 0) {
    grid.innerHTML = emptyBox('book', 'No books found', 'Try adjusting filters or add a new book.');
    return;
  }
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">';
  for (var i = 0; i < filtered.length; i++) {
    var b = filtered[i];
    var st = catStyle(b.category);
    var av = b.availableCopies > 0;
    html += '<div class="card"><div style="padding:20px;display:flex;flex-direction:column;gap:12px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    html += '<span class="badge ' + st.badge + '"><span class="dot" style="background:' + st.color + '"></span>' + b.category + '</span>';
    html += '<button class="icon-btn" title="Delete" onclick="deleteBook(\'' + b.id + '\')"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></button></div>';
    html += '<div><h3 style="font-size:15px;font-weight:800;line-height:1.3">' + esc(b.title) + '</h3><p style="margin:4px 0 0;font-size:13px;color:var(--muted)">by ' + esc(b.author) + '</p></div>';
    if (b.description) {
      html += '<p style="margin:0;font-size:12px;color:#b0a596;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(b.description) + '</p>';
    }
    html += '<div style="border-top:1px solid #f2ece2;padding-top:12px;display:flex;justify-content:space-between;align-items:center">';
    html += '<span style="font-size:13px"><b style="color:' + (av ? 'var(--green)' : 'var(--red)') + '">' + b.availableCopies + '</b> <span style="color:var(--muted)">/ ' + b.totalCopies + ' available</span></span>';
    html += '<span style="font-family:monospace;font-size:10px;color:#b0a596">' + esc(b.isbn) + '</span></div></div></div>';
  }
  html += '</div>';
  grid.innerHTML = html;
}

function addBook() {
  var title = val('bTitle');
  var author = val('bAuthor');
  var isbn = val('bISBN');
  if (!title || !author || !isbn) {
    toast('Missing fields', 'Please fill in all required fields.', true);
    return;
  }
  var copies = parseInt(document.getElementById('bCopies').value) || 1;
  var category = document.getElementById('bCategory').value;
  if (!category) {
    toast('Missing category', 'Please select or add a category.', true);
    return;
  }
  if (!DB.customCategories) DB.customCategories = [];
  if (getCategories().indexOf(category) === -1) {
    DB.customCategories.push(category);
    save();
  }
  DB.books.push({
    id: 'b' + DB.counters.b++,
    title: title,
    author: author,
    category: category,
    isbn: isbn,
    description: val('bDesc') || null,
    totalCopies: copies,
    availableCopies: copies
  });
  save();
  toast('Book added', '"' + title + '" has been added.');
  closeModal('addBookModal');
  document.getElementById('bTitle').value = '';
  document.getElementById('bAuthor').value = '';
  document.getElementById('bISBN').value = '';
  document.getElementById('bDesc').value = '';
  document.getElementById('bNewCat').value = '';
  document.getElementById('bCopies').value = '1';
  refreshCategorySelects();
  renderBooks();
  renderDashboard();
}

function deleteBook(id) {
  openConfirm('Delete this book?', 'This removes the book and its borrow history permanently.', function () {
    var newBooks = [];
    for (var i = 0; i < DB.books.length; i++) {
      if (DB.books[i].id !== id) newBooks.push(DB.books[i]);
    }
    DB.books = newBooks;
    var newRecs = [];
    for (var i = 0; i < DB.records.length; i++) {
      if (DB.records[i].bookId !== id) newRecs.push(DB.records[i]);
    }
    DB.records = newRecs;
    save();
    toast('Book removed', 'The book has been deleted.');
    renderBooks();
    renderDashboard();
    updateReqBadge();
  });
}

function renderStudents() {
  var searchEl = document.getElementById('studentSearch');
  var el = document.getElementById('studentsTable');
  if (!searchEl || !el) return;
  var search = searchEl.value.toLowerCase();
  var filtered = [];
  for (var i = 0; i < students().length; i++) {
    var s = students()[i];
    if (!search || (s.name || '').toLowerCase().indexOf(search) !== -1 ||
        (s.studentId || '').toLowerCase().indexOf(search) !== -1 ||
        (s.course || '').toLowerCase().indexOf(search) !== -1 ||
        (s.section || '').toLowerCase().indexOf(search) !== -1 ||
        (s.year || '').toLowerCase().indexOf(search) !== -1) {
      filtered.push(s);
    }
  }
  if (filtered.length === 0) {
    el.innerHTML = emptyBox('users', 'No students found', 'Register a student to get started.');
    return;
  }
  var html = '<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Student ID</th><th>Course / Section</th><th>Year</th><th style="text-align:center">Active</th><th style="text-align:right">Actions</th></tr></thead><tbody>';
  for (var i = 0; i < filtered.length; i++) {
    var s = filtered[i];
    var active = 0;
    for (var j = 0; j < records().length; j++) {
      var r = records()[j];
      if (r.studentId === s.id && (r.status === 'borrowed' || r.status === 'overdue')) active++;
    }
    html += '<tr><td><div style="display:flex;align-items:center;gap:10px">' + avatarHTML(s.name, s.photo) + '<div><p style="margin:0;font-weight:700">' + esc(s.name) + '</p></div></div></td>';
    html += '<td><span style="font-family:monospace;font-size:12px;color:var(--muted)">' + esc(s.studentId) + '</span></td>';
    html += '<td style="color:var(--muted);font-size:13px">' + esc(s.course) + '<br><span style="font-size:12px;color:#b0a596">' + esc(s.section) + '</span></td>';
    html += '<td style="color:var(--muted);font-size:13px">' + esc(s.year) + '</td>';
    html += '<td style="text-align:center"><span class="badge ' + (active ? 'b-borrowed' : '') + '" style="' + (active ? '' : 'background:#efe7da;color:var(--muted)') + '">' + active + '</span></td>';
    html += '<td style="text-align:right"><button class="icon-btn" onclick="deleteStudent(\'' + s.id + '\')"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></button></td></tr>';
  }
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function addStudentAdmin() {
  var name = val('sName');
  var sid = val('sId');
  var password = document.getElementById('sPassword').value;
  var year = document.getElementById('sYear').value;
  var section = val('sSection');
  var course = document.getElementById('sCourse').value;
  if (!name || !sid || !password || !section) {
    toast('Missing fields', 'Please fill in all required fields.', true);
    return;
  }
  if (!validSid(sid)) {
    toast('Invalid Student ID', 'Use the format 25-XXXX-XXX.', true);
    return;
  }
  for (var i = 0; i < students().length; i++) {
    if (students()[i].studentId === sid) {
      toast('Duplicate ID', 'That Student ID is already registered.', true);
      return;
    }
  }
  if (!validPassword(password)) {
    toast('Weak password', 'Password must be at least 6 characters.', true);
    return;
  }
  DB.students.push({
    id: 's' + DB.counters.s++,
    studentId: sid,
    password: password,
    name: name,
    year: year,
    section: section,
    course: course,
    photo: null
  });
  save();
  toast('Student registered', name + ' has been added.');
  closeModal('addStudentModal');
  document.getElementById('sName').value = '';
  document.getElementById('sId').value = '';
  document.getElementById('sSection').value = '';
  document.getElementById('sPassword').value = '';
  renderStudents();
  renderDashboard();
  renderBorrow();
}

function deleteStudent(id) {
  openConfirm('Delete this student?', 'This removes the student and their borrow history.', function () {
    var newStudents = [];
    for (var i = 0; i < DB.students.length; i++) {
      if (DB.students[i].id !== id) newStudents.push(DB.students[i]);
    }
    DB.students = newStudents;
    var newRecs = [];
    for (var i = 0; i < DB.records.length; i++) {
      if (DB.records[i].studentId !== id) newRecs.push(DB.records[i]);
    }
    DB.records = newRecs;
    save();
    toast('Student removed', 'The student record has been deleted.');
    renderStudents();
    renderDashboard();
    updateReqBadge();
  });
}

function renderRequests() {
  var el = document.getElementById('requestsTable');
  if (!el) return;
  var pending = [];
  for (var i = 0; i < records().length; i++) {
    if (records()[i].status === 'pending') pending.push(records()[i]);
  }
  if (pending.length === 0) {
    el.innerHTML = emptyBox('check', 'No pending requests', 'Book requests from students will appear here.');
    return;
  }
  var html = '<div style="overflow-x:auto"><table><thead><tr><th>Student</th><th>Book</th><th>Requested</th><th style="text-align:right">Action</th></tr></thead><tbody>';
  for (var i = 0; i < pending.length; i++) {
    var r = pending[i];
    var bk = bookById(r.bookId);
    var st = studentById(r.studentId);
    if (!bk || !st) continue;
    var cs = catStyle(bk.category);
    var canApprove = bk.availableCopies > 0;
    html += '<tr><td><div style="display:flex;align-items:center;gap:10px">' + avatarHTML(st.name, st.photo, 32, 12);
    html += '<div><p style="margin:0;font-weight:700;font-size:13px">' + esc(st.name) + '</p><p style="margin:0;font-size:11px;color:#b0a596">' + esc(st.studentId) + '</p></div></div></td>';
    html += '<td><div style="display:flex;align-items:center;gap:6px"><span class="dot" style="background:' + cs.color + '"></span><div><p style="margin:0;font-size:13px;font-weight:600">' + esc(bk.title) + '</p><p style="margin:0;font-size:11px;color:#b0a596">' + bk.availableCopies + ' available</p></div></div></td>';
    html += '<td style="font-size:12px;color:var(--muted)">' + r.requestDate + '</td>';
    html += '<td style="text-align:right"><div style="display:flex;gap:8px;justify-content:flex-end">';
    html += '<button class="btn btn-primary" style="padding:7px 14px;font-size:13px;' + (canApprove ? '' : 'opacity:.5;cursor:not-allowed') + '" ' + (canApprove ? '' : 'disabled') + ' onclick="approveRequest(\'' + r.id + '\')">Approve</button>';
    html += '<button class="btn btn-outline" style="padding:7px 14px;font-size:13px" onclick="rejectRequest(\'' + r.id + '\')">Reject</button></div></td></tr>';
  }
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function approveRequest(id) {
  var r = null;
  for (var i = 0; i < records().length; i++) {
    if (records()[i].id === id) { r = records()[i]; break; }
  }
  if (!r) return;
  var bk = bookById(r.bookId);
  if (!bk || bk.availableCopies <= 0) {
    toast('No copies available', 'This book is currently out of stock.', true);
    return;
  }
  bk.availableCopies--;
  r.status = 'borrowed';
  r.borrowDate = today();
  r.dueDate = plusDays(LOAN_DAYS);
  save();
  toast('Request approved', 'The book has been issued to the student.');
  renderRequests();
  renderDashboard();
  updateReqBadge();
  renderBorrow();
}

function rejectRequest(id) {
  openConfirm('Reject this request?', 'The borrow request will be removed.', function () {
    var newRecs = [];
    for (var i = 0; i < DB.records.length; i++) {
      if (DB.records[i].id !== id) newRecs.push(DB.records[i]);
    }
    DB.records = newRecs;
    save();
    toast('Request rejected', 'The request has been removed.');
    renderRequests();
    renderDashboard();
    updateReqBadge();
  });
}

function renderBorrow() {
  var ss = document.getElementById('borrowStudent');
  var sb = document.getElementById('borrowBook');
  if (!ss || !sb) return;
  var curS = ss.value;
  var curB = sb.value;
  var sHtml = '<option value="">Select a student</option>';
  for (var i = 0; i < students().length; i++) {
    var s = students()[i];
    sHtml += '<option value="' + s.id + '">' + esc(s.name) + ' · ' + esc(s.studentId) + '</option>';
  }
  ss.innerHTML = sHtml;
  var bHtml = '<option value="">Select an available book</option>';
  for (var i = 0; i < books().length; i++) {
    var b = books()[i];
    if (b.availableCopies > 0) {
      bHtml += '<option value="' + b.id + '">' + esc(b.title) + ' (' + b.availableCopies + ' left)</option>';
    }
  }
  sb.innerHTML = bHtml;
  if (curS) ss.value = curS;
  if (curB) sb.value = curB;
  if (!document.getElementById('borrowDue').value) {
    document.getElementById('borrowDue').value = plusDays(LOAN_DAYS);
  }

  var active = [];
  for (var i = 0; i < records().length; i++) {
    if (records()[i].status === 'borrowed' || records()[i].status === 'overdue') active.push(records()[i]);
  }
  var cnt = document.getElementById('activeBorrowCount');
  cnt.textContent = active.length || '';
  cnt.style.display = active.length ? '' : 'none';

  var el = document.getElementById('activeBorrowsTable');
  if (active.length === 0) {
    el.innerHTML = emptyBox('open', 'No active borrows', 'Issued books will appear here.');
    return;
  }
  var html = '<div style="max-height:440px;overflow-y:auto"><table><thead><tr><th>Student / Book</th><th>Due</th><th style="text-align:right">Action</th></tr></thead><tbody>';
  for (var i = 0; i < active.length; i++) {
    var r = active[i];
    var bk = bookById(r.bookId);
    var st = studentById(r.studentId);
    if (!bk || !st) continue;
    var cs = catStyle(bk.category);
    var ov = r.status === 'overdue';
    html += '<tr><td><div style="display:flex;flex-direction:column;gap:2px">';
    html += '<div style="display:flex;align-items:center;gap:6px"><span class="dot" style="background:' + cs.color + '"></span><span style="font-weight:700;font-size:14px">' + esc(st.name) + '</span></div>';
    html += '<div style="padding-left:14px;font-size:12px;color:var(--muted)">' + esc(bk.title) + '</div></div></td>';
    html += '<td><span style="color:' + (ov ? 'var(--red)' : 'var(--muted)') + ';font-weight:' + (ov ? '700' : '400') + ';font-size:13px">' + r.dueDate + '</span>';
    if (ov) html += '<br><span class="badge b-overdue" style="font-size:10px;margin-top:2px">Overdue</span>';
    html += '</td><td style="text-align:right"><button class="btn btn-outline" style="padding:6px 12px;font-size:13px" onclick="returnBook(\'' + r.id + '\')">Return</button></td></tr>';
  }
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function issueBorrow() {
  var sId = document.getElementById('borrowStudent').value;
  var bId = document.getElementById('borrowBook').value;
  if (!sId || !bId) {
    toast('Missing information', 'Select both a student and a book.', true);
    return;
  }
  var bk = bookById(bId);
  if (!bk || bk.availableCopies <= 0) {
    toast('No copies available', 'This book is out of stock.', true);
    return;
  }
  var due = document.getElementById('borrowDue').value || plusDays(LOAN_DAYS);
  DB.records.push({
    id: 'r' + DB.counters.r++,
    studentId: sId,
    bookId: bId,
    requestDate: today(),
    borrowDate: today(),
    dueDate: due,
    returnDate: null,
    status: 'borrowed'
  });
  bk.availableCopies--;
  save();
  var st = studentById(sId);
  toast('Book issued', st.name + ' borrowed "' + bk.title + '".');
  document.getElementById('borrowStudent').value = '';
  document.getElementById('borrowBook').value = '';
  renderBorrow();
  renderDashboard();
}

function returnBook(id) {
  var r = null;
  for (var i = 0; i < records().length; i++) {
    if (records()[i].id === id) { r = records()[i]; break; }
  }
  if (!r) return;
  r.status = 'returned';
  r.returnDate = today();
  var bk = bookById(r.bookId);
  if (bk) bk.availableCopies++;
  save();
  toast('Book returned', '"' + (bk ? bk.title : 'Book') + '" has been returned.');
  renderBorrow();
  renderDashboard();
  if (session.role === 'student') renderStudentPortal();
}

function renderHistory() {
  var filterEl = document.getElementById('historyFilter');
  if (!filterEl || !document.getElementById('historyTable')) return;
  var filter = filterEl.value;
  var recs = [];
  for (var i = 0; i < records().length; i++) {
    if (records()[i].status !== 'pending') recs.push(records()[i]);
  }
  var filtered = [];
  for (var i = 0; i < recs.length; i++) {
    if (filter === 'all' || recs[i].status === filter) filtered.push(recs[i]);
  }
  var counts = { borrowed: 0, returned: 0, overdue: 0 };
  for (var i = 0; i < recs.length; i++) {
    if (recs[i].status === 'borrowed') counts.borrowed++;
    if (recs[i].status === 'returned') counts.returned++;
    if (recs[i].status === 'overdue') counts.overdue++;
  }
  var countsHtml = '<span style="font-size:12px;color:var(--muted)">' + filtered.length + ' records</span>';
  if (filter === 'all') {
    countsHtml += '<span class="badge b-borrowed">Borrowed: ' + counts.borrowed + '</span>';
    countsHtml += '<span class="badge b-returned">Returned: ' + counts.returned + '</span>';
    countsHtml += '<span class="badge b-overdue">Overdue: ' + counts.overdue + '</span>';
  }
  document.getElementById('historyCounts').innerHTML = countsHtml;

  var el = document.getElementById('historyTable');
  if (filtered.length === 0) {
    el.innerHTML = emptyBox('clock', 'No history records', 'Borrowing activity will show here.');
    return;
  }
  var html = '<div style="max-height:540px;overflow:auto"><table><thead><tr><th>Student</th><th>Book</th><th>Borrowed</th><th>Due / Returned</th><th style="text-align:center">Status</th><th style="text-align:right">Action</th></tr></thead><tbody>';
  for (var i = 0; i < filtered.length; i++) {
    var r = filtered[i];
    var bk = bookById(r.bookId);
    var st = studentById(r.studentId);
    if (!bk || !st) continue;
    var cs = catStyle(bk.category);
    var dateCol = r.returnDate
      ? '<span style="color:var(--green)">' + r.returnDate + '</span>'
      : '<span style="color:' + (r.status === 'overdue' ? 'var(--red)' : 'var(--muted)') + '">' + (r.dueDate || '—') + '</span>';
    html += '<tr><td><div style="display:flex;align-items:center;gap:8px">' + avatarHTML(st.name, st.photo, 32, 12);
    html += '<div><p style="margin:0;font-size:13px;font-weight:700">' + esc(st.name) + '</p><p style="margin:0;font-size:11px;color:#b0a596">' + esc(st.studentId) + '</p></div></div></td>';
    html += '<td><div style="display:flex;align-items:center;gap:6px"><span class="dot" style="background:' + cs.color + '"></span><div><p style="margin:0;font-size:13px;font-weight:600">' + esc(bk.title) + '</p><p style="margin:0;font-size:11px;color:#b0a596">' + esc(bk.author) + '</p></div></div></td>';
    html += '<td style="font-size:12px;color:var(--muted)">' + (r.borrowDate || '—') + '</td>';
    html += '<td style="font-size:12px">' + dateCol + '</td>';
    html += '<td style="text-align:center">' + statusBadge(r.status) + '</td>';
    html += '<td style="text-align:right"><button class="icon-btn" onclick="deleteRecord(\'' + r.id + '\')"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></button></td></tr>';
  }
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function deleteRecord(id) {
  openConfirm('Delete this record?', 'The borrow record will be permanently removed.', function () {
    var r = null;
    for (var i = 0; i < records().length; i++) {
      if (records()[i].id === id) { r = records()[i]; break; }
    }
    if (r && (r.status === 'borrowed' || r.status === 'overdue')) {
      var bk = bookById(r.bookId);
      if (bk) bk.availableCopies++;
    }
    var newRecs = [];
    for (var i = 0; i < DB.records.length; i++) {
      if (DB.records[i].id !== id) newRecs.push(DB.records[i]);
    }
    DB.records = newRecs;
    save();
    toast('Record deleted', 'The borrow record has been removed.');
    renderHistory();
    renderDashboard();
    updateReqBadge();
  });
}

boot();
