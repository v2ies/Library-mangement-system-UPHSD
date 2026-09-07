# UPHSD Molino Library Management System

Library management web app for **University of Perpetual Help System DALTA – Molino Campus**.

Students can register, log in, browse books, and request borrows.  
Admins can manage books, students, approve requests, issue/return books, and view history.

---

## Live demo (GitHub Pages)

> After you push these fixed files and enable GitHub Pages (Settings → Pages → Deploy from branch `main` / root):

- **Student portal:** https://v2ies.github.io/Library-mangement-system-UPHSD/
- **Admin console:** https://v2ies.github.io/Library-mangement-system-UPHSD/admin.html

---

## What was fixed

The original repo had `admin.html`, `admin.js`, and `student.js` as empty `PLACEHOLDER` files, so nothing worked.  
Those files are now fully implemented. The app runs purely client-side with `localStorage` (perfect for GitHub Pages).

---

## Features

### Student
- Register / log in with Student ID (`25-XXXX-XXX`) and password
- Browse and search books by title, author, or category
- Request to borrow available books (max 5 active)
- View own borrow status (pending, borrowed, overdue, returned)
- Cancel pending requests
- Update display name and profile photo

### Admin
- Login: username `admin` / password `library123`
- Dashboard with stats and recent activity
- Add / delete books and manage categories
- Register / delete students
- Approve or reject borrow requests
- Issue books and mark returns
- Full borrow history with filters

---

## Tech stack

| Part | Details |
|------|---------|
| Frontend | HTML, CSS, vanilla JavaScript |
| Storage (Pages / demo) | `localStorage` key `uphsd_library_v3` |
| Optional backend | Node.js + Express + JSON file (`backend/`) |

---

## How to run (static – GitHub Pages / local)

1. Clone or download this repo.
2. Serve the folder with any static server (required so student + admin share the same origin / localStorage):

```bash
# Python
python -m http.server 8000

# or VS Code Live Server
```

3. Open:
   - Student: http://localhost:8000/
   - Admin: http://localhost:8000/admin.html

Opening with `file://` will show a warning and data will **not** sync between tabs.

---

## Optional backend (Node.js)

For a real shared database (instead of per-browser localStorage):

```bash
cd backend
npm install
npm start
```

Then open:
- http://localhost:3001/          (student)
- http://localhost:3001/admin.html (admin)
- http://localhost:3001/api/db     (raw JSON DB)

Data is stored in `backend/data.json`.  
The frontend still uses localStorage by default; the backend is ready if you want to wire `fetch('/api/db')` later.

---

## Project structure

```
Library-mangement-system-UPHSD/
├── index.html      # Student landing, login/register, portal
├── admin.html      # Admin landing, login, console
├── common.js       # Shared DB, session, helpers
├── student.js      # Student-side logic
├── admin.js        # Admin-side logic
├── styles.css      # Styles
├── public/
│   └── uphsd-logo.png
├── backend/        # Optional Express + JSON API
│   ├── server.js
│   ├── package.json
│   └── data.json   (created on first run)
└── README.md
```

---

## Default data

- Sample books (Noli Me Tangere, El Filibusterismo, etc.)
- Categories: Fiction, Science, History, Reference (+ custom)
- Loan period: 14 days
- Admin credentials: `admin` / `library123`

Clearing site data (or deleting `backend/data.json`) resets the library.

---

## Notes for school use

- Built as a simple client-side system suitable for a college project.
- Student ID format is fixed to `25-XXXX-XXX` (starts with 25).
- Passwords are stored in plain text (demo only — not for real production).
- For production, hash passwords and use a real database.

---

## Author

**v2ies** — UPHSD Molino related coursework / demo project.  
Frontend + backend restored / completed so GitHub Pages and local use work.
