# UPHSD Molino Library Management System

Library management web app for **University of Perpetual Help System DALTA – Molino Campus**.

Students can register, log in, browse books, and request borrows.  
Admins can manage books, students, approve requests, issue/return books, and view history.

---

## Live demo (GitHub Pages)

- **Student portal:** https://v2ies.github.io/Library-mangement-system-UPHSD/
- **Admin console:** https://v2ies.github.io/Library-mangement-system-UPHSD/admin.html

---

## Features

### Student
- Register / log in with Student ID (`25-XXXX-XXX`) and password
- Browse and search books by title, author, or category
- Request to borrow available books
- View own borrow status (pending, borrowed, overdue, returned)
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
| Storage | `localStorage` (shared between pages when served from the same origin) |
| No backend | Pure client-side — no server or database required |

---

## How to run locally

1. Download or clone this repo.
2. Serve the folder with any static server (important so student + admin share data):

```bash
# Python
python -m http.server 8000

# or VS Code Live Server
```

3. Open:
   - Student: http://localhost:8000/
   - Admin: http://localhost:8000/admin.html

Opening files with `file://` will show a warning and data will **not** sync between tabs.

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
└── README.md
```

---

## Default data

- Sample books (Noli Me Tangere, El Filibusterismo, etc.)
- Categories: Fiction, Science, History, Reference (+ custom)
- Loan period: 14 days
- Admin credentials: `admin` / `library123`

Data is stored in the browser under key `uphsd_library_v3`. Clearing site data resets the library.

---

## Notes for school use

- Built as a simple client-side system suitable for a 1st-year college project.
- No dark mode.
- Student ID format is fixed to `25-XXXX-XXX` (starts with 25).
- Passwords are stored in plain text in localStorage (demo only — not for real production).

---

## Author

**v2ies** — UPHSD Molino related coursework / demo project.
