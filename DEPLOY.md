# Deploy Guide - BookEase Platform

Ky udhëzues do të të ndihmojë të deploy-osh aplikacionin BookEase në internet. Ka disa opsione, por ne rekomandojmë **Render.com** sepse është e lehtë dhe ka plan free.

## Opsionet e Deploy

### 1. Render.com (Rekomanduar) ⭐

Render.com është më e lehta dhe më e shpejtë për full-stack aplikacione. Mbështet PostgreSQL dhe mund të deploy-ojë edhe backend edhe frontend.

#### Hapat për Deploy në Render.com:

**A. Krijo llogari në Render.com**
1. Shko në https://render.com
2. Regjistrohu me GitHub account tënd
3. Autorizo Render.com të aksesojë repository-n tënde

**B. Deploy Database (PostgreSQL)**
1. Në dashboard, kliko "New +" → "PostgreSQL"
2. Emër: `bookease-db`
3. Plan: **Free**
4. Database Name: `bookease_db`
5. Kliko "Create Database"
6. **RUAJ** connection string-in që do të shfaqet (do ta përdorësh më vonë)

**C. Deploy Backend**
1. Në dashboard, kliko "New +" → "Web Service"
2. Lidh repository-n tënde: `flaviadervishaj/Book-Ease`
3. Emër: `bookease-backend`
4. Runtime: **Python 3**
5. Plan: **Free**
6. Root Directory: `backend`
7. Build Command: `pip install -r requirements.txt`
8. Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
9. Environment Variables:
   - `DATABASE_URL` = (connection string nga database që krijove)
   - `JWT_SECRET_KEY` = (gjenero një string të rastësishëm, p.sh. `openssl rand -hex 32`)
   - `CORS_ORIGINS` = `https://bookease-frontend.onrender.com` (do ta ndryshosh pas deploy të frontend)
   - `FLASK_ENV` = `production`
10. Kliko "Create Web Service"

**D. Deploy Frontend**
1. Në dashboard, kliko "New +" → "Static Site"
2. Lidh repository-n tënde: `flaviadervishaj/Book-Ease`
3. Emër: `bookease-frontend`
4. Root Directory: `frontend`
5. Build Command: `npm install && npm run build`
6. Publish Directory: `frontend/dist`
7. Environment Variables:
   - `VITE_API_URL` = (URL e backend service që krijove, p.sh. `https://bookease-backend.onrender.com`)
8. Kliko "Create Static Site"

**E. Përditëso CORS në Backend**
1. Pas deploy të frontend, merr URL-n e frontend (do të jetë diçka si `https://bookease-frontend.onrender.com`)
2. Shko te backend service → Environment Variables
3. Përditëso `CORS_ORIGINS` me URL-n e re të frontend
4. Kliko "Save Changes" dhe prit që të restart-ohet

**F. Seed Database**
1. Shko te backend service → "Shell"
2. Ekzekuto:
   ```bash
   cd backend
   python seed.py
   ```
3. Kjo do të krijojë tabelat dhe të shtojë të dhëna demo

**G. Testo Aplikacionin**
1. Shko te URL e frontend
2. Provo të bësh login me:
   - Admin: `admin@bookease.com` / `admin123`
   - Client: `client@example.com` / `client123`

---

### 2. Vercel (Frontend) + Railway (Backend)

#### Frontend në Vercel:
1. Shko në https://vercel.com
2. Regjistrohu me GitHub
3. Import repository: `flaviadervishaj/Book-Ease`
4. Root Directory: `frontend`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variable: `VITE_API_URL` = (URL e backend)
8. Deploy

#### Backend në Railway:
1. Shko në https://railway.app
2. Regjistrohu me GitHub
3. New Project → Deploy from GitHub repo
4. Zgjidh repository-n tënde
5. Add PostgreSQL service
6. Në web service, shto environment variables:
   - `DATABASE_URL` = (nga PostgreSQL service)
   - `JWT_SECRET_KEY` = (gjenero)
   - `CORS_ORIGINS` = (URL e Vercel frontend)
7. Start Command: `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT`

---

### 3. Heroku (Opsion i vjetër, por ende funksionon)

**Backend:**
1. Krijo `Procfile` në root:
   ```
   web: cd backend && gunicorn app:app --bind 0.0.0.0:$PORT
   ```
2. Heroku CLI:
   ```bash
   heroku create bookease-backend
   heroku addons:create heroku-postgresql:mini
   heroku config:set JWT_SECRET_KEY=your-secret-key
   heroku config:set CORS_ORIGINS=https://your-frontend-url.vercel.app
   git push heroku main
   ```

**Frontend:**
- Deploy në Vercel ose Netlify (si më sipër)

---

## Environment Variables

### Backend (.env ose në platform)
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET_KEY=your-very-secret-key-here
CORS_ORIGINS=https://your-frontend-url.com
FLASK_ENV=production
```

### Frontend (në platform)
```env
VITE_API_URL=https://your-backend-url.com
```

---

## Troubleshooting

### Backend nuk start-on
- Kontrollo logs në Render dashboard
- Sigurohu që `gunicorn` është në `requirements.txt`
- Kontrollo që `DATABASE_URL` është e saktë

### Frontend nuk lidhet me backend
- Kontrollo `CORS_ORIGINS` në backend
- Sigurohu që `VITE_API_URL` është e saktë në frontend
- Kontrollo network tab në browser console

### Database errors
- Sigurohu që database është krijuar dhe running
- Kontrollo connection string
- Ekzekuto `python seed.py` për të krijuar tabelat

### CORS errors
- Shto frontend URL në `CORS_ORIGINS` në backend
- Sigurohu që ka `supports_credentials=True` në CORS config

---

## Tips për Production

1. **Security:**
   - Përdor JWT_SECRET_KEY të fortë (gjenero me `openssl rand -hex 32`)
   - Aktivizo HTTPS (Render e bën automatikisht)
   - Mos e commit-o `.env` file

2. **Performance:**
   - Plan free në Render ka cold starts (aplikacioni "fjet" pas 15 min pa aktivitet)
   - Për production real, konsidero plan paid

3. **Monitoring:**
   - Render ka built-in logs
   - Mund të shtosh monitoring services si Sentry

4. **Database Backups:**
   - Render free plan nuk ka automatic backups
   - Konsidero të bësh manual backup periodik

---

## Pas Deploy

1. Testo të gjitha features:
   - Login/Register
   - Browse services
   - Book appointment
   - Admin dashboard
   - Working hours

2. Përditëso README.md me live URLs

3. Konsidero të shtosh:
   - Custom domain
   - SSL certificate (Render e bën automatikisht)
   - Analytics (Google Analytics, etc.)

---

## Support

Nëse ke probleme:
1. Kontrollo logs në platform dashboard
2. Verifiko environment variables
3. Testo lokal për të siguruar që funksionon
4. Kontrollo dokumentacionin e platform-ës

---

**Deploy i suksesshëm! 🚀**

