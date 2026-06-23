# 📚 LibraryOS — Full-Stack Library Management System

A production-ready Library Management System built for placement showcase.

**Tech Stack:** React.js • Node.js • Express.js • MySQL • JWT Auth

---

## 🚀 Features

- 🔐 **JWT Authentication** — Secure login with Admin & Student roles
- 📚 **Book Management** — Full CRUD with copy tracking
- 📤 **Borrow/Return System** — Real library workflow with 14-day due dates
- 💰 **Fine Calculation** — Auto ₹2/day overdue fine engine
- 📊 **Admin Dashboard** — Stats, charts (Recharts), recent activity
- 🔍 **Search & Filter** — Real-time search by title, author, ID
- 💾 **Persistent Storage** — MySQL database (not localStorage)

---

## 🏗️ Project Structure

```
LMS/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/   # DB connection + schema.sql
│   │   ├── controllers/
│   │   ├── middleware/  # JWT + Role guards
│   │   └── routes/
│   ├── server.js
│   └── .env
└── frontend/         # React + Vite
    └── src/
        ├── context/  # AuthContext
        ├── pages/    # Login, Register, Books, Dashboard, MyBooks, Borrows
        ├── components/
        └── services/ # Axios API client
```

---

## ⚙️ Setup Instructions

### 1. Database
```bash
# Open MySQL shell and run:
mysql -u root -p < backend/src/config/schema.sql
```

### 2. Backend
```bash
cd backend
# Edit .env — set DB_PASSWORD to your MySQL root password
npm run dev        # Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm run dev        # Runs on http://localhost:5173
```

---

## 🔑 Default Credentials

| Role    | Email                   | Password  |
|---------|-------------------------|-----------|
| Admin   | admin@libraryos.com     | Admin@123 |
| Student | Register at /register   | Any       |

---

## 🌐 API Endpoints

| Method | Route                      | Auth     | Description        |
|--------|----------------------------|----------|--------------------|
| POST   | /api/auth/register         | Public   | Student register   |
| POST   | /api/auth/login            | Public   | Login              |
| GET    | /api/books                 | Auth     | List books         |
| POST   | /api/books                 | Admin    | Add book           |
| PUT    | /api/books/:id             | Admin    | Update book        |
| DELETE | /api/books/:id             | Admin    | Delete book        |
| POST   | /api/borrows               | Student  | Borrow book        |
| POST   | /api/borrows/:id/return    | Auth     | Return book        |
| GET    | /api/borrows/my            | Student  | My borrows         |
| GET    | /api/borrows               | Admin    | All borrows        |
| GET    | /api/dashboard/stats       | Admin    | Dashboard data     |

---

## 📦 Deployment

- **Backend** → [Render.com](https://render.com) (free Node.js)
- **Database** → [Railway.app](https://railway.app) (free MySQL)
- **Frontend** → [Vercel.com](https://vercel.com) (free React)
