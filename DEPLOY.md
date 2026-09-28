# Deploy BookEase on Render

BookEase needs a PostgreSQL database, a Python web service, and a static site. The web service and static site run on Render; the database can be hosted separately.

## 1. Database

Create a PostgreSQL database with a provider that fits the expected lifetime of the demo. Render's free Postgres databases expire after 30 days. A separate provider such as Neon can be used for a longer-lived free demo, subject to its usage limits. Copy its connection string with SSL enabled. If using a paid Render database instead, use its **Internal Database URL**. Do not add a connection string to GitHub or to the frontend.

## 2. API web service

Connect this repository and select the branch you want to deploy. With the repository root unchanged, use:

| Setting | Value |
| --- | --- |
| Runtime | Python 3 |
| Build command | `pip install -r backend/requirements.txt` |
| Start command | `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 1` |

Set these environment variables on the **web service**:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string from step 1, with SSL for external databases |
| `JWT_SECRET_KEY` | A unique, long random value |
| `FLASK_ENV` | `production` |
| `BOOKING_TIMEZONE` | `Europe/Tirane` |
| `CORS_ORIGINS` | Exact frontend origin, with no trailing slash |
| `PYTHON_VERSION` | `3.11.0` |

The application creates tables and seeds sample services and working hours when the service table is empty. Public registration does not create administrator accounts. Use `python backend/create_admin.py` from a trusted shell with the same database and signing key when an administrator is needed.

## 3. Static site

Connect the same repository and branch. With the repository root unchanged, use:

| Setting | Value |
| --- | --- |
| Build command | `cd frontend && npm install && npm run build` |
| Publish directory | `frontend/dist` |
| Environment variable | `VITE_API_URL` = exact public URL of the API service |

Under **Redirects/Rewrites**, add a **Rewrite** from `/*` to `/index.html`. Return to the API service and set `CORS_ORIGINS` to the static site's exact origin, then save and deploy.

## Check the deployment

1. Open the static site's `/services` page; the sample services should load without signing in.
2. Register a client and book an available slot. Check that the confirmation and appointment list show the same booking.
3. Sign out, sign in again, and verify that the booking remains visible. Reschedule or cancel it to check the full flow.
4. If an action fails, inspect the web service's **Logs** and confirm its database URL and the two cross-origin URLs in Render. Never paste secrets into an issue or a screenshot.

Before switching an existing deployment to a new database, export its data and import it into the new database if existing accounts and appointments must be retained. Change only the backend's `DATABASE_URL`, then verify registration, sign-in, availability, and an existing appointment. Render's free web service may still take time to wake after inactivity.
