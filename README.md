# Tessera — Team Task Manager

A small but full-featured team task management app with role-based access control, project workspaces, kanban-style task tracking, and an interactive dashboard.

**Stack:** Spring Boot 3.3 (Java 17) + React 18 (Vite) + JPA + JWT auth. Postgres in production, H2 in-memory for local dev.

---

## Features

- **Auth & RBAC:** Signup / login with JWT. Inside each project, users are either `ADMIN` or `MEMBER`.
  - **Admin** — creates the project, adds/removes members, creates and assigns tasks, edits any task.
  - **Member** — sees tasks, but can only change the status of tasks assigned to them.
- **Projects:** Each user can create projects and become their admin. Projects are isolated workspaces.
- **Tasks:** Title, description, due date, priority (Low / Medium / High), status (To Do / In Progress / Done), assignee.
- **Kanban board** with filtering (All / Mine / Overdue) and full-text search.
- **Interactive dashboard:** KPI cards (Total, Pending, In Progress, Completed, Overdue, Mine), SVG donut chart for status breakdown, overdue task list, your pending tasks, per-member workload bars and completion %.
- **Single-JAR deployment:** The React build is bundled into Spring Boot's `static/` so one process serves both the API and the SPA. No separate frontend host needed.

---

## Running locally

### Prerequisites
- Java 17
- Maven 3.9+
- Node.js 20+

### Backend
```bash
cd backend
mvn spring-boot:run
```
Backend starts on **http://localhost:8080** with an in-memory H2 database. The H2 console is at `/h2-console`.

### Frontend (separate dev server with hot reload)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. Vite proxies `/api/*` to the Spring Boot backend.

### One-shot full build (frontend baked into the JAR)
```bash
cd frontend && npm install && npm run build && cd ..
cp -r frontend/dist/* backend/src/main/resources/static/
cd backend && mvn clean package -DskipTests
java -jar target/app.jar
```
Now everything is on **http://localhost:8080**.

---

## Deploying to Railway

Railway is the recommended target. The repo is set up so Railway auto-detects the `Dockerfile` and `railway.json`.

### Step 1 — Push to GitHub
Create a fresh repo and push this project.

### Step 2 — Provision the services on Railway
1. Create a new Railway project from your GitHub repo. Railway will pick up the **Dockerfile** at the root automatically.
2. In the same Railway project, click **+ New → Database → Add PostgreSQL**.

### Step 3 — Wire the database to the backend service
On the backend service, go to **Variables** and add these (Railway lets you reference the Postgres service's variables with `${{Postgres.PGHOST}}` etc.):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `DATABASE_USERNAME` | `${{Postgres.PGUSER}}` |
| `DATABASE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `DATABASE_DRIVER` | `org.postgresql.Driver` |
| `HIBERNATE_DIALECT` | `org.hibernate.dialect.PostgreSQLDialect` |
| `JWT_SECRET` | A long base64 string (generate with `openssl rand -base64 48`) |

`PORT` is injected by Railway automatically — don't set it manually.

### Step 4 — Generate a public domain
On the backend service → **Settings → Networking → Generate Domain**. You'll get something like `your-app.up.railway.app`.

### Step 5 — Deploy
Railway will build the Dockerfile (which builds both the React frontend and the Spring Boot backend in one go) and start the JAR. The healthcheck hits `/api/health`.

Once deployed, open the public URL and sign up. The first user who creates a project becomes its admin.

---

## Project structure

```
team-task-manager/
├── Dockerfile               # Multi-stage build: Node → Maven → JRE
├── railway.json             # Railway deploy config
├── backend/                 # Spring Boot
│   ├── pom.xml              # Java 17, Spring Boot 3.3.5
│   └── src/main/
│       ├── java/com/taskmanager/
│       │   ├── config/      # SecurityConfig (JWT + CORS)
│       │   ├── controller/  # AuthController, ProjectController, TaskController, HealthController, SpaForwardController
│       │   ├── dto/         # Request/response DTOs
│       │   ├── entity/      # User, Project, ProjectMember, Task + enums
│       │   ├── exception/   # ApiException + GlobalExceptionHandler
│       │   ├── repository/  # Spring Data JPA repositories
│       │   ├── security/    # JwtService, JwtAuthFilter, UserPrincipal
│       │   └── service/     # AuthService, ProjectService, TaskService
│       └── resources/
│           ├── application.properties
│           └── static/      # React build lands here at Docker-build time
└── frontend/                # React + Vite
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── components/      # TasksBoard, DashboardPanel, MembersPanel, Modal, TopBar
        ├── context/         # AuthContext
        ├── pages/           # Login, Signup, ProjectsList, ProjectDetail
        ├── services/        # api.js
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

---

## API summary

All endpoints under `/api` (except `/api/auth/**` and `/api/health`) require `Authorization: Bearer <jwt>`.

### Auth
- `POST /api/auth/signup` → `{ name, email, password }`
- `POST /api/auth/login` → `{ email, password }`
- `GET  /api/auth/me`

### Projects
- `GET    /api/projects`
- `POST   /api/projects` → `{ name, description }`
- `GET    /api/projects/{id}`
- `POST   /api/projects/{id}/members` → `{ email, role: 'ADMIN'|'MEMBER' }`
- `DELETE /api/projects/{id}/members/{userId}`

### Tasks
- `GET    /api/projects/{id}/tasks`
- `POST   /api/projects/{id}/tasks` → `{ title, description, dueDate, priority, assigneeId }`
- `PUT    /api/tasks/{id}` (admin only — full update)
- `PATCH  /api/tasks/{id}/status` (admin or assignee)
- `DELETE /api/tasks/{id}` (admin only)

### Dashboard
- `GET /api/projects/{id}/dashboard`

### Health
- `GET /api/health` (public)

---

## What's fixed compared to v1

- **Add Task button now appears in the new-task modal.** Previously the Save button was hidden because `isAdmin` wasn't being passed through to the modal, so users only saw "Cancel."
- **Dashboard rebuilt** with KPI cards (Total / Pending / In Progress / Completed / Overdue / Assigned to me), an SVG donut chart for the status mix, an overdue task list with priority pills, your personal pending-task feed, and per-member workload cards with completion %.
- **Login page now states "Admin and user login required"** and shows what each role can do.
- **Task board** got a toolbar with filters (All / Mine / Overdue), a search box, and overdue tasks visually flagged with a red side border and badge.
- **Public `/api/health` endpoint** added so Railway's healthcheck doesn't get a 401.
- **Railway deploy config** points to `/api/health` with a 60s timeout.
- **`DATABASE_URL` / `DATABASE_DRIVER` / `HIBERNATE_DIALECT`** are all env-driven for clean Railway → Postgres setup.

Java 17 retained (LTS, well-supported on Railway).
