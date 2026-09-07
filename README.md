# UPHSD Molino Library Management System

Library management web app for **University of Perpetual Help System DALTA – Molino Campus**.

## Live demo (GitHub Pages)

- **Student portal:** https://v2ies.github.io/Library-mangement-system-UPHSD/
- **Admin console:** https://v2ies.github.io/Library-mangement-system-UPHSD/admin.html

**Admin login:** `admin` / `library123`

## Features

### Student
- Register / log in with Student ID (`25-XXXX-XXX`) and password
- Browse and search books by title, author, category
- Request to borrow available books
- View borrow status (pending / borrowed / overdue / returned)
- Update name and profile photo

### Admin
- Dashboard with stats and recent activity
- Manage books and categories
- Register / delete students
- Approve or reject borrow requests
- Issue and return books
- Full borrow history

## Run locally

```bash
python -m http.server 8000
```

Open http://localhost:8000/ and http://localhost:8000/admin.html

## Tech

HTML, CSS, vanilla JavaScript, `localStorage`. Optional Node backend in `backend/`.
