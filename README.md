# BookEase

BookEase is a service booking application built with React, Flask, and PostgreSQL. Visitors can explore services before signing in. Clients can reserve an available time, then review, move, or cancel their appointments. Administrators manage services, working hours, and booking statuses.

**Demo:** [BookEase preview](https://bookease-preview-ui.onrender.com/services) · **Status:** preview branch; the free preview database is temporary.

## What it does

- Public service catalog with search, price filter, and sorting
- Client registration and sign-in; booking is available after authentication
- Available time slots based on service duration, working hours, and existing bookings
- Confirmation with booking number, service, local date and time, and price
- Client appointment history, rescheduling, and cancellation
- Administrator dashboard, service management, appointments, and working hours
- Responsive layout and light/dark theme

The catalog uses illustrative salon services and a clearly marked demo location. Prices are displayed in euros. No payment is collected by the application.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Axios, Recharts, CSS |
| API | Flask, Flask-JWT-Extended, Flask-SQLAlchemy |
| Data | PostgreSQL (SQLite in the booking flow test) |
| Hosting | Render static site, web service, and Postgres |

## Run locally

Requirements: Python 3.10+, Node.js 18+, and PostgreSQL.

```bash
git clone https://github.com/flaviadervishaj/Book-Ease.git
cd Book-Ease
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

Create `backend/.env` with your own local connection and a random signing key:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bookease_db
JWT_SECRET_KEY=replace-with-a-long-random-value
CORS_ORIGINS=http://localhost:5173
BOOKING_TIMEZONE=Europe/Tirane
```

Create the database named in `DATABASE_URL`, then start the API from the `backend` directory. The application creates its tables and adds sample services and working hours when the service table is empty.

```bash
cd backend
python app.py
```

In another terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and uses `http://localhost:5000` for the API unless `VITE_API_URL` is set.

## Accounts and access

Public registration creates client accounts only. Administrator accounts are provisioned from a trusted shell with `python backend/create_admin.py`; the command prompts for credentials. No demo password is included in the repository. Keep `.env` files and connection strings out of commits.

## Verification

From `backend/`, after installing the Python dependencies:

```bash
python -m unittest test_booking.py
```

The test covers client registration, access control, slot selection, competing bookings, and rescheduling. Run `npm run build` from `frontend/` to check the production frontend bundle.

## Deployment

The frontend and API are separate Render services. Set `VITE_API_URL` to the API URL on the static site, `DATABASE_URL` to the Render Postgres **internal** URL on the API, and `CORS_ORIGINS` to the static site's origin. Set `JWT_SECRET_KEY` and `FLASK_ENV=production` on the API. Add a static-site rewrite from `/*` to `/index.html` so direct links work. See [DEPLOY.md](DEPLOY.md) for the full setup.

The preview uses a free Render Postgres database, which expires 30 days after creation. A durable database is needed before using the demo link as a long-term CV link.
