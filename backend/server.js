/**
 * Simple Express backend for UPHSD Molino Library Management System
 * Stores data in data.json (same shape as localStorage key uphsd_library_v3)
 *
 * Run:  cd backend && npm install && npm start
 * API base: http://localhost:3001/api
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

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

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.warn('Could not read data.json, reseeding', e.message);
  }
  const fresh = seed();
  saveDB(fresh);
  return fresh;
}

function saveDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/db', (req, res) => {
  const db = loadDB();
  const t = today();
  let changed = false;
  for (const r of db.records) {
    if (r.status === 'borrowed' && r.dueDate && r.dueDate < t) {
      r.status = 'overdue';
      changed = true;
    }
  }
  if (changed) saveDB(db);
  res.json(db);
});

app.put('/api/db', (req, res) => {
  const body = req.body;
  if (!body || !Array.isArray(body.books)) {
    return res.status(400).json({ error: 'Invalid DB payload' });
  }
  saveDB(body);
  res.json({ ok: true });
});

app.post('/api/students/register', (req, res) => {
  const db = loadDB();
  const { name, sid, password, year, section, course } = req.body || {};
  if (!name || !sid || !password) return res.status(400).json({ error: 'Missing fields' });
  if (!/^25-\d{4}-\d{3}$/.test(sid)) return res.status(400).json({ error: 'Invalid Student ID format' });
  if (db.students.some(s => s.sid === sid)) return res.status(409).json({ error: 'Student ID already registered' });
  const id = 's' + (db.counters.s++);
  const student = { id, sid, name, password, year: year || '1st Year', section: section || 'A', course: course || 'Other', photo: null, createdAt: today() };
  db.students.push(student);
  saveDB(db);
  res.status(201).json(student);
});

app.post('/api/students/login', (req, res) => {
  const db = loadDB();
  const { sid, password } = req.body || {};
  const stu = db.students.find(s => s.sid === sid && s.password === password);
  if (!stu) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ id: stu.id, sid: stu.sid, name: stu.name, role: 'student' });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'admin' && password === 'library123') return res.json({ role: 'admin' });
  res.status(401).json({ error: 'Invalid credentials' });
});

app.listen(PORT, () => {
  console.log('UPHSD Library backend on http://localhost:' + PORT);
  console.log('Frontend: http://localhost:' + PORT + '/');
  console.log('Admin:    http://localhost:' + PORT + '/admin.html');
});
