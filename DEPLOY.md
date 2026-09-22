# Deploying BookEase on Render

The repository includes a Render Blueprint for three resources:

- `bookease-db`: PostgreSQL database
- `bookease-backend`: Flask and Gunicorn API
- `bookease-frontend`: React static site

## 1. Create the Blueprint

1. In Render, create a new Blueprint.
2. Connect this GitHub repository.
3. Confirm that Render detected `render.yaml`.
4. Provide values for every environment variable marked `sync: false`.

The database connection is read directly from the managed PostgreSQL resource defined in the Blueprint.

## 2. Configure secrets

Set these backend values:

| Variable | Value |
| --- | --- |
| `JWT_SECRET_KEY` | A unique random value of at least 32 bytes |
| `ADMIN_PASSWORD` | A private initial admin password of at least 12 characters |

The Blueprint sets `FLASK_ENV=production`, configures the frontend origin, and generates the remaining service URLs.

You can generate a JWT secret locally with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Never commit the generated secret or the administrator password.

## 3. Provision initial data

After the backend's first successful deploy, open a backend shell with the configured environment variables and run:

```bash
cd backend
python seed.py
```

The command creates the configured administrator, service catalog, and default working hours. It is safe to run again: existing data is preserved and missing catalog records are added.

There is intentionally no public seed endpoint and no default admin password.

## 4. Verify the deployment

Check the backend health endpoint:

```text
https://bookease-backend.onrender.com/api/health
```

Then open the frontend, sign in with the administrator credentials you configured, and verify:

1. Services load.
2. Working hours appear in the admin area.
3. A client account can be registered.
4. A future slot can be booked.
5. The same slot is no longer offered.
6. The appointment can be rescheduled or cancelled.

## Required environment variables

### Backend

```dotenv
DATABASE_URL=<provided by the Render database>
JWT_SECRET_KEY=<private random secret>
JWT_ACCESS_TOKEN_HOURS=8
CORS_ORIGINS=https://bookease-frontend.onrender.com
FLASK_ENV=production
ADMIN_EMAIL=admin@bookease.com
ADMIN_PASSWORD=<private initial password>
```

### Frontend

```dotenv
VITE_API_URL=https://bookease-backend.onrender.com
```

If you rename either Render service, update the corresponding origin or API URL in `render.yaml`.
