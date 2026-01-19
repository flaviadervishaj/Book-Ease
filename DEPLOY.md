# BookEase - Deployment Guide

Complete guide for deploying BookEase service booking platform to production.

## Quick Start - Render.com (Recommended)

### Prerequisites
- GitHub account
- Render.com account (free)

### Step 1: Create PostgreSQL Database

1. Go to https://render.com
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name:** `bookease-db`
   - **Database:** `bookease_db`
   - **Region:** Choose closest (e.g., Frankfurt for Europe)
   - **PostgreSQL Version:** 15+
   - **Plan:** Free
4. Click "Create Database"
5. **Save** the connection string (External Database URL)

### Step 2: Deploy Backend

1. Click "New +" → "Web Service"
2. Connect repository: `flaviadervishaj/Book-Ease`
3. Configure:
   - **Name:** `bookease-backend`
   - **Environment:** Python 3
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
   - **Plan:** Free
4. Add Environment Variables:
   - `DATABASE_URL` = (connection string from database)
   - `JWT_SECRET_KEY` = (generate random string)
   - `CORS_ORIGINS` = `https://bookease-frontend.onrender.com` (update after frontend deploy)
   - `FLASK_ENV` = `production`
5. Click "Create Web Service"

### Step 3: Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect repository: `flaviadervishaj/Book-Ease`
3. Configure:
   - **Name:** `bookease-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = (backend URL, e.g., `https://bookease-backend.onrender.com`)
5. Click "Create Static Site"

### Step 4: Update CORS

1. Get frontend URL from Static Site dashboard
2. Go to Backend Service → Environment
3. Update `CORS_ORIGINS` with frontend URL
4. Save changes (backend will restart)

### Step 5: Seed Database

Backend auto-seeds on startup if database is empty. To manually seed:

1. Open backend URL: `https://bookease-backend.onrender.com/api/admin/seed`
2. Or use POST request to the same endpoint

**Demo Accounts:**
- Admin: `admin@bookease.com` / `admin123`
- Client: `client@example.com` / `client123`

### Step 6: Setup Keep-Alive (Prevent Cold Starts)

**Option 1: cron-job.org (Free)**

1. Go to https://cron-job.org
2. Sign up (free)
3. Create cronjob:
   - **Title:** `BookEase Keep-Alive`
   - **URL:** `https://bookease-backend.onrender.com/api/ping`
   - **Schedule:** Every 10 minutes (`*/10 * * * *`)
   - **Method:** GET
4. Click "Create cronjob"

**Option 2: UptimeRobot (Alternative)**

1. Go to https://uptimerobot.com
2. Sign up (free)
3. Add Monitor → HTTP(s)
4. Configure:
   - **URL:** `https://bookease-backend.onrender.com/api/ping`
   - **Interval:** 5 minutes
5. Click "Create Monitor"

## Environment Variables

### Backend
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://your-frontend-url.com
FLASK_ENV=production
```

### Frontend
```env
VITE_API_URL=https://your-backend-url.com
```

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify `DATABASE_URL` is correct
- Ensure `gunicorn` is in `requirements.txt`
- Check build/start commands

### Frontend can't connect to backend
- Verify `VITE_API_URL` in frontend environment
- Check `CORS_ORIGINS` in backend environment
- Check browser console for errors
- Verify backend URL is accessible

### Database errors
- Verify `DATABASE_URL` connection string
- Check database is running
- Ensure SSL mode is enabled (auto-handled in code)

### CORS errors
- Add frontend URL to `CORS_ORIGINS` in backend
- Ensure no trailing slash in URLs
- Restart backend after changes

### Keep-alive not working
- Verify cron job URL is correct
- Check cron job execution history
- Test endpoint manually: `https://your-backend.onrender.com/api/ping`

## Alternative Platforms

### Railway.app
- Free tier with $5 credit/month
- No sleep mode
- Easy PostgreSQL setup

### Vercel (Frontend) + Railway (Backend)
- Vercel for static hosting
- Railway for backend and database

## Production Tips

1. **Security:**
   - Use strong `JWT_SECRET_KEY` (generate with `openssl rand -hex 32`)
   - Enable HTTPS (automatic on Render)
   - Never commit `.env` files

2. **Performance:**
   - Use keep-alive ping to prevent cold starts
   - Monitor usage to stay within free tier limits
   - Consider paid plan for production use

3. **Monitoring:**
   - Use Render built-in logs
   - Set up error tracking (e.g., Sentry)
   - Monitor database usage

4. **Backups:**
   - Free plan doesn't include automatic backups
   - Consider manual backups for important data

## Support

For issues:
1. Check Render logs
2. Verify environment variables
3. Test locally first
4. Check platform documentation
