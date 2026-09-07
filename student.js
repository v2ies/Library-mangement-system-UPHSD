function switchGate(mode) {
  var login = document.getElementById('gateLogin');
  var reg = document.getElementById('gateRegister');
  var tl = document.getElementById('gateTabLogin');
  var tr = document.getElementById('gateTabReg');
  if (!login || !reg || !tl || !tr) return;
  if (mode === 'login') {
    login.classList.remove('hidden');
    reg.classList.add('hidden');
    tl.classList.add('tab-active');
    tr.classList.remove('tab-active');
  } else {
    reg.classList.remove('hidden');
    login.classList.add('hidden');
    tr.classList.add('tab-active');
    tl.classList.remove('tab-active');
  }
  var le = document.getElementById('loginErr');
  var re = document.getElementById('regErr');
  if (le) le.classList.add('hidden');
  if (re) re.classList.add('hidden');
}

function studentRegister() {
  var name = document.getElementById('regName').value.trim();
  var sid = document.getElementById('regSid').value.trim();
  var password = document.getElementById('regPassword').value;
  var passwordConfirm = document.getElementById('regPasswordConfirm').value;
  var year = document.getElementById('regYear').value;
  var section = document.getElementById('regSection').value.trim();
  var course = document.getElementById('regCourse').value;
  var err = document.getElementById('regErr');

  if (!name || !sid || !password || !passwordConfirm || !year || !section || !course) {
    showErr(err, 'Please fill in all required fields.');
    return;
  }
  if (!validSid(sid)) {
    showErr(err, 'Student ID must follow the format 25-XXXX-XXX (starts with 25).');
    return;
  }
  for (var i = 0; i < students().length; i++) {
    if (students()[i].studentId === sid) {
      showErr(err, 'This Student ID is already registered. Please log in instead.');
      return;
    }
  }
  if (!validPassword(password)) {
    showErr(err, 'Password must be at least 6 characters.');
    return;
  }
  if (password !== passwordConfirm) {
    showErr(err, 'Passwords do not match.');
    return;
  }

  var s = {
    id: 's' + DB.counters.s++,
    studentId: sid,
    password: password,
    name: name,
    year: year,
    section: section,
    course: course,
    photo: null
  };
  DB.students.push(s);
  save();
  err.classList.add('hidden');
  document.getElementById('regName').value = '';
  document.getElementById('regSid').value = '';
  document.getElementById('regSection').value = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('regPasswordConfirm').value = '';
  document.getElementById('regYear').value = '';
  document.getElementById('regCourse').value = '';
  toast('Registration successful', 'You can now log in with your Student ID and password.');
  enterStudent(s.id);
}

function studentLogin() {
  var sid = document.getElementById('loginSid').value.trim();
  var password = document.getElementById('loginPass').value;
  var err = document.getElementById('loginErr');
  if (!validSid(sid)) {
    showErr(err, 'Enter a valid Student ID (25-XXXX-XXX).');
    return;
  }
  if (!password) {
    showErr(err, 'Please enter your password.');
    return;
  }
  var s = null;
  for (var i = 0; i < students().length; i++) {
    if (students()[i].studentId === sid) {
      s = students()[i];
      break;
    }
  }
  if (!s) {
    showErr(err, 'No account found for that Student ID. Please register first.');
    return;
  }
  if (s.password !== password) {
    showErr(err, 'Incorrect password.');
    return;
  }
  err.classList.add('hidden');
  document.getElementById('loginSid').value = '';
  document.getElementById('loginPass').value = '';
  enterStudent(s.id);
}

function enterStudent(sId, silent) {
  saveSession({ role: 'student', studentId: sId });
  if (!document.getElementById('screen-student')) {
    window.location.href = 'index.html';
    return;
  }
  showScreen('screen-student');
  switchStuTab('browse', document.querySelector('#screen-student .tab-btn'));
  renderStudentPortal();
  if (!silent) {
    var s = studentById(sId);
    if (s) toast('Welcome, ' + s.name.split(' ')[0], 'Browse and request books from the library.');
  }
}

function switchStuTab(name, btn) {
  var pane = document.getElementById('stab-' + name);
  if (!pane) return;
  var tabs = document.querySelectorAll('#screen-student .tab-content');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  var btns = document.querySelectorAll('#screen-student .tab-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('tab-active');
  pane.classList.add('active');
  if (btn) btn.classList.add('tab-active');
  if (name === 'browse') renderStuBrowse();
  if (name === 'mybooks') renderStuMyBooks();
  if (name === 'settings') renderStuSettings();
}

function renderStudentPortal() {
  if (!document.getElementById('screen-student')) return;
  var s = studentById(session.studentId);
  if (!s) {
    logout();
    return;
  }
  var hn = document.getElementById('stuHeaderName');
  if (hn) hn.textContent = s.name;
  document.getElementById('stuAvatar').outerHTML = avatarHTML(s.name, s.photo, 52, 20)
    .replace('class="avatar"', 'class="avatar" id="stuAvatar"')
    .replace('style="', 'style="background:var(--gold);color:#3a2c07;');
  document.getElementById('stuName').textContent = s.name;
  document.getElementById('stuMeta').textContent = s.studentId + ' · ' + s.course + ' · ' + s.section + ' · ' + s.year;
  var my = [];
  for (var i = 0; i < records().length; i++) {
    if (records()[i].studentId === s.id) my.push(records()[i]);
  }
  var activeCount = 0, pendingCount = 0;
  for (var i = 0; i < my.length; i++) {
    if (my[i].status === 'borrowed' || my[i].status === 'overdue') activeCount++;
    if (my[i].status === 'pending') pendingCount++;
  }
  document.getElementById('stuActiveCount').textContent = activeCount;
  document.getElementById('stuPendingCount').textContent = pendingCount;
  renderStuBrowse();
  renderStuMyBooks();
}

var pendingPhotoData = undefined;

function renderStuSettings() {
  if (!document.getElementById('settingsName')) return;
  var s = studentById(session.studentId);
  if (!s) return;
  pendingPhotoData = undefined;
  document.getElementById('settingsName').value = s.name;
  var av = document.getElementById('settingsAvatar');
  if (av) {
    av.outerHTML = avatarHTML(s.name, s.photo, 72, 26)
      .replace('class="avatar"', 'class="avatar" id="settingsAvatar"')
      .replace('style="', 'style="background:var(--gold);color:#3a2c07;');
  }
  var rm = document.getElementById('settingsRemovePhotoBtn');
  if (rm) {
    if (s.photo) rm.classList.remove('hidden');
    else rm.classList.add('hidden');
  }
  var e = document.getElementById('settingsErr');
  if (e) e.classList.add('hidden');
}

function handlePhotoChange(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Invalid file', 'Please choose an image file.', true);
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast('File too large', 'Please choose an image under 2MB.', true);
    return;
  }
  var reader = new FileReader();
  reader.onload = function () {
    pendingPhotoData = reader.result;
    var s = studentById(session.studentId);
    document.getElementById('settingsAvatar').outerHTML = avatarHTML(s.name, pendingPhotoData, 72, 26)
      .replace('class="avatar"', 'class="avatar" id="settingsAvatar"');
    document.getElementById('settingsRemovePhotoBtn').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function removeSettingsPhoto() {
  pendingPhotoData = null;
  var s = studentById(session.studentId);
  document.getElementById('settingsAvatar').outerHTML = avatarHTML(s.name, null, 72, 26)
    .replace('class="avatar"', 'class="avatar" id="settingsAvatar"')
    .replace('style="', 'style="background:var(--gold);color:#3a2c07;');
  document.getElementById('settingsRemovePhotoBtn').classList.add('hidden');
}

function saveStuSettings() {
  var s = studentById(session.studentId);
  if (!s) return;
  var name = document.getElementById('settingsName').value.trim();
  var err = document.getElementById('settingsErr');
  if (!name) {
    showErr(err, 'Name cannot be empty.');
    return;
  }
  err.classList.add('hidden');
  s.name = name;
  if (pendingPhotoData !== undefined) s.photo = pendingPhotoData;
  pendingPhotoData = undefined;
  save();
  renderStudentPortal();
  renderStuSettings();
  toast('Settings saved', 'Your profile has been updated.');
}

function renderStuBrowse() {
  var searchEl = document.getElementById('stuBookSearch');
  var catEl = document.getElementById('stuCatFilter');
  var grid = document.getElementById('stuBooksGrid');
  if (!searchEl || !catEl || !grid) return;
  var search = (searchEl.value || '').toLowerCase();
  var cat = catEl.value;
  var my = [];
  for (var i = 0; i < records().length; i++) {
    if (records()[i].studentId === session.studentId) my.push(records()[i]);
  }
  var filtered = [];
  for (var i = 0; i < books().length; i++) {
    var b = books()[i];
    var matchCat = !cat || b.category === cat;
    var matchSearch = !search || b.title.toLowerCase().indexOf(search) !== -1 || b.author.toLowerCase().indexOf(search) !== -1;
    if (matchCat && matchSearch) filtered.push(b);
  }
  if (filtered.length === 0) {
    grid.innerHTML = emptyBox('book', 'No books found', 'Try a different search.');
    return;
  }
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">';
  for (var i = 0; i < filtered.length; i++) {
    var b = filtered[i];
    var st = catStyle(b.category);
    var av = b.availableCopies > 0;
    var existing = null;
    for (var j = 0; j < my.length; j++) {
      if (my[j].bookId === b.id && (my[j].status === 'pending' || my[j].status === 'borrowed' || my[j].status === 'overdue')) {
        existing = my[j];
        break;
      }
    }
    var action = '';
    if (existing && existing.status === 'pending') {
      action = '<button class="btn btn-outline" style="width:100%;cursor:default" disabled>Request Pending</button>';
    } else if (existing) {
      action = '<button class="btn btn-outline" style="width:100%;cursor:default" disabled>Already Borrowed</button>';
    } else if (!av) {
      action = '<button class="btn btn-outline" style="width:100%;opacity:.6;cursor:not-allowed" disabled>Out of Stock</button>';
    } else {
      action = '<button class="btn btn-gold" style="width:100%" onclick="requestBook(\'' + b.id + '\')">Request to Borrow</button>';
    }
    html += '<div class="card"><div style="padding:20px;display:flex;flex-direction:column;gap:12px;height:100%">';
    html += '<span class="badge ' + st.badge + '" style="align-self:flex-start"><span class="dot" style="background:' + st.color + '"></span>' + b.category + '</span>';
    html += '<div style="flex:1"><h3 style="font-size:15px;font-weight:800;line-height:1.3">' + esc(b.title) + '</h3>';
    html += '<p style="margin:4px 0 0;font-size:13px;color:var(--muted)">by ' + esc(b.author) + '</p>';
    if (b.description) {
      html += '<p style="margin:8px 0 0;font-size:12px;color:#b0a596;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">' + esc(b.description) + '</p>';
    }
    html += '</div>';
    html += '<p style="margin:0;font-size:13px"><b style="color:' + (av ? 'var(--green)' : 'var(--red)') + '">' + b.availableCopies + '</b> <span style="color:var(--muted)">/ ' + b.totalCopies + ' available</span></p>';
    html += action + '</div></div>';
  }
  html += '</div>';
  grid.innerHTML = html;
}

function requestBook(bId) {
  var bk = bookById(bId);
  if (!bk) return;
  var my = [];
  for (var i = 0; i < records().length; i++) {
    if (records()[i].studentId === session.studentId) my.push(records()[i]);
  }
  for (var i = 0; i < my.length; i++) {
    if (my[i].bookId === bId && (my[i].status === 'pending' || my[i].status === 'borrowed' || my[i].status === 'overdue')) {
      toast('Already requested', 'You already have this book or a pending request.', true);
      return;
    }
  }
  DB.records.push({
    id: 'r' + DB.counters.r++,
    studentId: session.studentId,
    bookId: bId,
    requestDate: today(),
    borrowDate: null,
    dueDate: null,
    returnDate: null,
    status: 'pending'
  });
  save();
  toast('Request sent', 'Your request for "' + bk.title + '" is awaiting admin approval.');
  renderStudentPortal();
}

function renderStuMyBooks() {
  var el = document.getElementById('stuMyBooks');
  if (!el) return;
  var my = [];
  for (var i = 0; i < records().length; i++) {
    if (records()[i].studentId === session.studentId) my.push(records()[i]);
  }
  my.sort(function (a, b) {
    return new Date(b.requestDate) - new Date(a.requestDate);
  });
  if (my.length === 0) {
    el.innerHTML = emptyBox('open', 'No books yet', 'Request a book from the Browse tab.');
    return;
  }
  var html = '<div style="overflow-x:auto"><table><thead><tr><th>Book</th><th>Requested</th><th>Due Date</th><th style="text-align:center">Status</th></tr></thead><tbody>';
  for (var i = 0; i < my.length; i++) {
    var r = my[i];
    var bk = bookById(r.bookId);
    if (!bk) continue;
    var cs = catStyle(bk.category);
    var due = r.returnDate ? 'Returned ' + r.returnDate : (r.dueDate || '—');
    html += '<tr><td><div style="display:flex;align-items:center;gap:8px"><span class="dot" style="background:' + cs.color + '"></span>';
    html += '<div><p style="margin:0;font-size:13px;font-weight:700">' + esc(bk.title) + '</p>';
    html += '<p style="margin:0;font-size:11px;color:#b0a596">by ' + esc(bk.author) + ' · ' + bk.category + '</p></div></div></td>';
    html += '<td style="font-size:12px;color:var(--muted)">' + r.requestDate + '</td>';
    html += '<td style="font-size:12px;color:' + (r.status === 'overdue' ? 'var(--red)' : 'var(--muted)') + ';font-weight:' + (r.status === 'overdue' ? '700' : '400') + '">' + due + '</td>';
    html += '<td style="text-align:center">' + statusBadge(r.status) + '</td></tr>';
  }
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

boot();
