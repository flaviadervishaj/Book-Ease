# Deploy Steps - Render Free + Keep-Alive (100% Falas, Pa Cold Starts)

Ky udhëzues do të të çojë hap pas hapi për deploy në Render free plan me keep-alive ping për të shmangur cold starts.

---

## Hapi 1: Krijo Llogari në Render.com

1. Shko në **https://render.com**
2. Kliko **"Get Started for Free"**
3. Zgjidh **"Sign up with GitHub"**
4. Autorizo Render.com të aksesojë repository-n tënde
5. Verifiko email-in nëse kërkohet

---

## Hapi 2: Deploy PostgreSQL Database

1. Në Render dashboard, kliko **"New +"** → **"PostgreSQL"**
2. Plotëso formën:
   - **Name:** `bookease-db`
   - **Database:** `bookease_db`
   - **User:** `bookease_user` (ose lëre default)
   - **Region:** Zgjidh më të afërtin (p.sh. Frankfurt për Europë)
   - **PostgreSQL Version:** 15 (ose më i ri)
   - **Plan:** **Free**
3. Kliko **"Create Database"**
4. **IMPORTANTE:** RUAJ connection string-in që do të shfaqet:
   - Do të duket si: `postgresql://bookease_user:password@dpg-xxxxx-a/bookease_db`
   - Kliko "Copy" dhe ruaje në një vend të sigurt
   - Do ta përdorësh në hapin tjetër

---

## Hapi 3: Deploy Backend (Flask API)

### Opsioni A: Me render.yaml (Automatik - Rekomanduar)

1. Në Render dashboard, kliko **"New +"** → **"Blueprint"**
2. Lidh repository-n:
   - Kliko **"Connect account"** nëse nuk e ke lidhur GitHub
   - Zgjidh repository-n: **`flaviadervishaj/Book-Ease`**
   - Kliko **"Connect"**
3. Render do të lexojë `render.yaml` automatikisht
4. Do të shohësh 3 services që do të krijohen:
   - `bookease-db` (database)
   - `bookease-backend` (backend)
   - `bookease-frontend` (frontend)
5. Kliko **"Apply"**
6. Render do të fillojë deploy

### Opsioni B: Manual (Nëse render.yaml nuk funksionon)

1. Në Render dashboard, kliko **"New +"** → **"Web Service"**
2. Lidh repository-n:
   - Kliko **"Connect account"** nëse nuk e ke lidhur GitHub
   - Zgjidh repository-n: **`flaviadervishaj/Book-Ease`**
   - Kliko **"Connect"**
3. Plotëso formën:
   - **Name:** `bookease-backend`
   - **Environment:** `Python 3`
   - **Region:** I njëjti si database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
   - **Plan:** **Free**
4. Kliko **"Advanced"** dhe shto Environment Variables:
   - **DATABASE_URL:** (paste connection string nga database)
   - **JWT_SECRET_KEY:** (gjenero me PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`)
   - **CORS_ORIGINS:** `https://bookease-frontend.onrender.com` (do ta ndryshosh pas deploy të frontend)
   - **FLASK_ENV:** `production`
5. Kliko **"Create Web Service"**
6. Render do të fillojë build dhe deploy (mund të zgjasë 5-10 minuta)

---

## Hapi 4: Deploy Frontend (React)

1. Në Render dashboard, kliko **"New +"** → **"Static Site"**
2. Lidh repository-n (nëse nuk e ke lidhur):
   - Zgjidh repository-n: **`flaviadervishaj/Book-Ease`**
3. Plotëso formën:
   - **Name:** `bookease-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
4. Kliko **"Advanced"** dhe shto Environment Variable:
   - **VITE_API_URL:** `https://bookease-backend.onrender.com` (URL e backend që krijove)
5. Kliko **"Create Static Site"**
6. Render do të fillojë build dhe deploy (mund të zgjasë 3-5 minuta)

---

## Hapi 5: Përditëso CORS në Backend

1. Pas deploy të frontend, merr URL-n e frontend:
   - Do të jetë diçka si: `https://bookease-frontend.onrender.com`
   - Shiko në Static Site dashboard
2. Shko te **Backend Service** → **Environment**
3. Përditëso **CORS_ORIGINS** me URL-n e re të frontend:
   - Vlera: `https://bookease-frontend.onrender.com`
4. Kliko **"Save Changes"**
5. Render do të restart-ojë backend automatikisht

---

## Hapi 6: Seed Database (Krijo Tabelat dhe Të Dhëna Demo)

1. Shko te **Backend Service** → **"Shell"** (në sidebar)
2. Nëse nuk shfaqet Shell, kliko **"Events"** dhe prit që deploy të përfundojë
3. Në Shell, ekzekuto:
   ```bash
   cd backend
   python seed.py
   ```
4. Do të shohësh mesazhe si:
   - "Created admin user: admin@bookease.com / admin123"
   - "Created demo client..."
   - "Created services..."
5. Nëse shfaqet error për database connection, kontrollo që `DATABASE_URL` është e saktë në Environment Variables

---

## Hapi 7: Setup Keep-Alive Ping (Shmang Cold Starts)

### Metoda: Cron-Job.org (Falas)

1. **Krijo account:**
   - Shko në **https://cron-job.org**
   - Kliko **"Sign Up"** (falas)
   - Regjistrohu me email ose GitHub

2. **Krijo Cron Job:**
   - Pas login, kliko **"Create cronjob"**
   - Plotëso formën:
     - **Title:** `BookEase Keep-Alive`
     - **Address (URL):** `https://bookease-backend.onrender.com/api/ping`
     - **Schedule:** Zgjidh **"Every 10 minutes"** ose vendos manual: `*/10 * * * *`
     - **Request Method:** `GET`
     - **Notification:** (opsionale) Aktivizo nëse dëshiron email alerts
   - Kliko **"Create cronjob"**

3. **Verifikimi:**
   - Cron job do të fillojë menjëherë
   - Shko te **"Executions"** për të parë historikun
   - Duhet të shohësh status **200 OK** çdo 10 minuta
   - Nëse shfaqet error, kontrollo që backend URL është i saktë

4. **Rezultati:**
   - Backend do të marrë ping çdo 10 minuta
   - Nuk do të pushojë në sleep mode
   - Do të jetë **gjithmonë i zgjuar** dhe pa cold starts!

---

## Hapi 8: Testo Aplikacionin

1. **Shko te Frontend URL:**
   - P.sh.: `https://bookease-frontend.onrender.com`

2. **Testo Login:**
   - **Admin:** `admin@bookease.com` / `admin123`
   - **Client:** `client@example.com` / `client123`

3. **Testo Features:**
   - Browse services
   - Book appointment
   - View appointments
   - Admin dashboard (nëse je logged in si admin)

4. **Kontrollo që nuk ka Cold Starts:**
   - Prit 20 minuta pa aktivitet
   - Provë të hapësh aplikacionin përsëri
   - Duhet të hapet **menjëherë** (nëse cron job funksionon)

---

## Troubleshooting

### Backend nuk start-on
- **Kontrollo logs:** Backend Service → "Logs"
- **Verifiko:** `DATABASE_URL` është e saktë
- **Verifiko:** `gunicorn` është në `requirements.txt`
- **Kontrollo:** Build Command dhe Start Command janë të sakta

### Frontend nuk lidhet me backend
- **Kontrollo:** `VITE_API_URL` në frontend environment variables
- **Kontrollo:** `CORS_ORIGINS` në backend environment variables
- **Kontrollo:** Browser console për errors (F12 → Console)
- **Verifiko:** Backend URL është i saktë dhe funksionon (`/api/health`)

### Database errors
- **Kontrollo:** `DATABASE_URL` connection string
- **Verifiko:** Database është running (në Render dashboard)
- **Ekzekuto:** `python seed.py` përsëri nëse ka probleme

### CORS errors
- **Shto:** Frontend URL në `CORS_ORIGINS` në backend
- **Format:** `https://bookease-frontend.onrender.com` (pa trailing slash)
- **Restart:** Backend pas ndryshimit të environment variables

### Cron job nuk funksionon
- **Kontrollo:** URL është i saktë (`/api/ping`)
- **Verifiko:** Backend është running dhe `/api/ping` kthen 200 OK
- **Testo manual:** Hap URL-n në browser: `https://bookease-backend.onrender.com/api/ping`
- **Kontrollo:** Cron job executions në cron-job.org dashboard

---

## URLs që Do të Kesh

Pas deploy, do të kesh:

- **Frontend:** `https://bookease-frontend.onrender.com`
- **Backend API:** `https://bookease-backend.onrender.com`
- **Health Check:** `https://bookease-backend.onrender.com/api/health`
- **Keep-Alive Ping:** `https://bookease-backend.onrender.com/api/ping`

---

## Tips

1. **Monitorimi:**
   - Render ka built-in logs për çdo service
   - Cron-job.org ka execution history
   - Kontrollo periodikisht që gjithçka funksionon

2. **Backups:**
   - Render free plan nuk ka automatic backups
   - Konsidero të bësh manual backup të database periodikisht

3. **Performance:**
   - Me keep-alive ping, aplikacioni do të jetë gjithmonë i zgjuar
   - Nuk do të ketë cold starts
   - 750 orë/muaj në Render free plan mjafton për 24/7

4. **Security:**
   - `JWT_SECRET_KEY` duhet të jetë i fortë dhe sekret
   - Mos e share-o URL-et publike nëse nuk dëshiron
   - Konsidero të shtosh rate limiting për production

---

## Sukses! 🎉

Nëse ke ndjekur të gjitha hapat, aplikacioni yt duhet të jetë:
- ✅ Deploy-uar në Render (falas)
- ✅ Pa cold starts (me keep-alive ping)
- ✅ Funksional dhe i gatshëm për përdorim

**Nëse ke probleme, kontrollo Troubleshooting seksionin ose pyetje në GitHub Issues.**

