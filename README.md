# BookEase

BookEase is a full-stack appointment platform for service businesses. Clients can discover services, view real-time availability, book or reschedule appointments, and manage their schedule. Administrators get a dedicated dashboard for services, appointments, working hours, and booking analytics.

## Highlights

- Secure client registration and JWT authentication with expiring sessions
- Role-based access control for client and administrator workflows
- Availability generated from service duration, working hours, buffer time, and existing bookings
- Conflict protection for concurrent PostgreSQL booking requests
- Appointment cancellation and rescheduling with ownership checks
- Admin analytics, service management, status updates, and working-hour controls
- Responsive light/dark interface with lazy-loaded admin pages
- Structured validation and safe API errors
- Automated API tests for authentication, authorization, and booking conflicts

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, React Router, Axios, Recharts, Vite |
| Backend | Python, Flask, Flask-JWT-Extended, Flask-SQLAlchemy |
| Database | PostgreSQL |
| Testing | pytest |
| Deployment | Render Blueprint, Gunicorn |

## Architecture

The React frontend communicates with a Flask REST API. The API owns authentication, authorization, availability calculation, and all database access. Appointment writes for the same calendar day are serialized on PostgreSQL before availability is rechecked, reducing the risk of simultaneous requests taking the same slot.

## Local setup

### Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer
- PostgreSQL 14 or newer

### 1. Backend

From the project root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

On Windows PowerShell, activate the environment with:

```powershell
.venv\Scripts\Activate.ps1
```

Update `backend/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/bookease_db
JWT_SECRET_KEY=replace-with-a-long-random-value
JWT_ACCESS_TOKEN_HOURS=8
CORS_ORIGINS=http://localhost:5173
FLASK_ENV=development
ADMIN_EMAIL=admin@bookease.com
ADMIN_PASSWORD=replace-with-at-least-12-characters
```

Create the schema and seed the service catalog, working hours, and your first administrator:

```bash
python backend/seed.py
```

No shared or default password is included in the repository. The seed command requires your own `ADMIN_PASSWORD`.

Start the API:

```bash
python backend/app.py
```

The API runs at `http://localhost:5000`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies local `/api` requests to Flask.

## Verification

Run the backend tests:

```bash
pip install -r backend/requirements-dev.txt
pytest backend/tests -q
```

Build the production frontend:

```bash
npm --prefix frontend run build
```

The test suite covers input validation, session restoration, role-escalation prevention, removal of the public seed route, booking conflicts, appointment privacy, and client permissions.

## API overview

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a client account |
| `POST` | `/api/auth/login` | Public | Sign in |
| `GET` | `/api/auth/me` | Authenticated | Validate and restore a session |
| `GET` | `/api/services` | Public | List services |
| `POST` | `/api/services` | Admin | Create a service |
| `PUT` | `/api/services/:id` | Admin | Update a service |
| `DELETE` | `/api/services/:id` | Admin | Delete an unused service |
| `GET` | `/api/availability` | Public | List available slots |
| `GET` | `/api/appointments` | Authenticated | List permitted appointments |
| `POST` | `/api/appointments` | Authenticated | Book an available slot |
| `PUT` | `/api/appointments/:id` | Authenticated | Cancel, reschedule, or update status |
| `DELETE` | `/api/appointments/:id` | Admin | Remove an appointment |
| `GET` | `/api/admin/dashboard/stats` | Admin | Load booking analytics |
| `GET/POST` | `/api/admin/working-hours` | Admin | Read or update opening hours |
| `GET` | `/api/health` | Public | Check API availability |

## Project structure

```text
Book-Ease/
├── backend/
│   ├── app.py                  # Application factory and API setup
│   ├── config.py               # Environment-based configuration
│   ├── models.py               # SQLAlchemy data model and constraints
│   ├── routes/                 # Auth, services, bookings, and admin endpoints
│   ├── utils/booking_logic.py  # Availability and concurrency logic
│   ├── seed.py                 # Explicit initial data provisioning
│   └── tests/                  # API test suite
├── frontend/
│   ├── src/components/         # Shared interface components
│   ├── src/contexts/           # Auth, theme, and toast state
│   ├── src/pages/              # Client and admin views
│   └── src/services/api.js     # Axios client and auth handling
├── render.yaml                 # Backend, frontend, and database blueprint
└── DEPLOY.md                   # Production deployment guide
```

## Security notes

- Public registration always creates a client account; role fields from the request are ignored.
- Admin credentials are supplied through environment variables and are never committed.
- Production startup requires both `DATABASE_URL` and `JWT_SECRET_KEY`.
- JWT sessions expire after a configurable duration.
- CORS is restricted to configured frontend origins.
- API responses do not expose database exceptions or tracebacks.
- Clients can only access their own appointments and can only cancel them; administrative actions are enforced by the backend.

## Deployment

The included `render.yaml` provisions a PostgreSQL database, Flask web service, and React static site. See [DEPLOY.md](./DEPLOY.md) for the environment variables and first-time provisioning steps.

## License

This project is available under the [MIT License](./LICENSE).
