# ProjectFlow 🚀

A full-stack project management tool with JWT authentication, project tracking, and task management.

**Stack:** Django REST Framework · PostgreSQL/SQLite · React · TypeScript · MUI · Zustand

---

## Features

- **JWT Authentication** — register, login, token refresh, bcrypt-hashed passwords
- **Projects** — create, update, delete; search by title/description; filter by status; pagination
- **Tasks** — CRUD within projects; kanban-style board (todo / in-progress / done); filter by status; due date tracking
- **Form Validation** — React Hook Form + Yup on frontend; Django validators on backend
- **State Management** — Zustand for auth state
- **Unit Tests** — 22 Django tests covering auth, projects, tasks, permissions
- **Docker Support** — one-command startup with PostgreSQL
- **Seed Script** — demo users + sample projects + tasks

---

## Quick Start (Local)

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) PostgreSQL 14+, Docker

---

### Backend Setup

```bash
cd backend

# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env if needed (defaults use SQLite, no changes required)

# 4. Run migrations
python manage.py migrate

# 5. Seed demo data
python seed.py

# 6. Start server
python manage.py runserver
# → API running at http://localhost:8000
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env
# Edit REACT_APP_API_URL if your backend runs on a different port

# 3. Start dev server
npm start
# → App running at http://localhost:3000
```

---

## Docker Setup (Recommended)

Starts PostgreSQL + Django + React in one command:

```bash
# From project root
docker-compose up --build
```

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:8000        |
| API Docs  | http://localhost:8000/api/   |

---

## Running the Seed Script

Creates two demo users with sample projects and tasks:

```bash
cd backend
python seed.py
```

**Demo credentials:**

| Email               | Password     |
|---------------------|--------------|
| demo@example.com    | Demo1234!    |
| alice@example.com   | Alice1234!   |

---

## Running Tests

```bash
cd backend
python manage.py test tests --verbosity=2
```

22 tests covering:
- User registration & login
- JWT token issuance
- Project CRUD + ownership isolation
- Project search & status filtering
- Task CRUD + status filtering
- Authentication guards

---

## API Reference

### Auth

| Method | Endpoint              | Description            | Auth |
|--------|-----------------------|------------------------|------|
| POST   | /api/auth/register/   | Create account         | ✗    |
| POST   | /api/auth/login/      | Login → JWT tokens     | ✗    |
| POST   | /api/auth/refresh/    | Refresh access token   | ✗    |
| GET    | /api/auth/me/         | Current user profile   | ✓    |
| PATCH  | /api/auth/me/         | Update profile         | ✓    |

### Projects

| Method | Endpoint                | Description            | Query Params          |
|--------|-------------------------|------------------------|-----------------------|
| GET    | /api/projects/          | List projects          | `search`, `status`, `page` |
| POST   | /api/projects/          | Create project         |                       |
| GET    | /api/projects/{id}/     | Project detail + tasks |                       |
| PATCH  | /api/projects/{id}/     | Update project         |                       |
| DELETE | /api/projects/{id}/     | Delete project         |                       |

### Tasks

| Method | Endpoint                              | Description  | Query Params |
|--------|---------------------------------------|--------------|--------------|
| GET    | /api/projects/{id}/tasks/             | List tasks   | `status`     |
| POST   | /api/projects/{id}/tasks/             | Create task  |              |
| PATCH  | /api/projects/{id}/tasks/{task_id}/   | Update task  |              |
| DELETE | /api/projects/{id}/tasks/{task_id}/   | Delete task  |              |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Default                      | Description                  |
|-----------------------|------------------------------|------------------------------|
| `SECRET_KEY`          | (insecure default)           | Django secret key            |
| `DEBUG`               | `True`                       | Debug mode                   |
| `DATABASE_URL`        | `sqlite:///db.sqlite3`       | Database connection string   |
| `CORS_ALLOWED_ORIGINS`| `http://localhost:3000`      | Allowed frontend origins     |

### Frontend (`frontend/.env`)

| Variable              | Default                      | Description                  |
|-----------------------|------------------------------|------------------------------|
| `REACT_APP_API_URL`   | `http://localhost:8000/api`  | Backend API URL              |

---

## Project Structure

```
projectflow/
├── backend/
│   ├── config/              # Django settings, URLs
│   ├── users/               # Custom User model, JWT auth views
│   ├── projects/            # Project & Task models, views, serializers
│   ├── tests/               # Unit tests (22 tests)
│   ├── seed.py              # Demo data seeder
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance + API modules
│   │   ├── components/      # ProjectForm, TaskForm, ProtectedRoute
│   │   ├── pages/           # LoginPage, RegisterPage, Dashboard, ProjectDetail
│   │   ├── store/           # Zustand auth store
│   │   └── types/           # TypeScript interfaces
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

## Known Limitations

- No email verification on registration
- No password reset flow
- Task assignment to users not yet implemented
- No real-time updates (WebSocket/polling)
- Frontend tests not yet implemented (Jest setup is present via CRA)
- Docker frontend uses `npm start` (development mode); for production, use `npm run build` + nginx

---

## Deployment Notes

**Backend (Render / Railway):**
1. Set `DEBUG=False`
2. Set a strong `SECRET_KEY`
3. Set `DATABASE_URL` to your PostgreSQL connection string
4. Set `CORS_ALLOWED_ORIGINS` to your frontend domain
5. Run `python manage.py collectstatic` before deploy

**Frontend (Vercel / Netlify):**
1. Set `REACT_APP_API_URL` to your deployed backend URL
2. Build command: `npm run build`
3. Output directory: `build`
