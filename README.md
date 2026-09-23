# BookEase – Service Booking Platform

A full-stack web application for managing service bookings and appointments. Clients can browse services, book appointments, and manage their bookings, while administrators can manage services, set working hours, and view all appointments.

## Features

### Client Features
- **User Authentication**: Secure registration and login with JWT
- **Browse Services**: View all available services with images, descriptions, prices, and addresses
- **Book Appointments**: Select service, date, and available time slots
- **Manage Appointments**: View, cancel, or reschedule your appointments
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Admin Features
- **Dashboard**: View statistics, charts, and recent appointments
- **Service Management**: Add, edit, or delete services with images and addresses
- **Appointment Management**: View all appointments, filter by status/date, and update status
- **Working Hours**: Set and manage business hours for each day of the week
- **Analytics**: View booking statistics and popular services

## Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Recharts** for data visualization
- **CSS3** with CSS Variables for theming
- **Responsive Design** with mobile-first approach

### Backend
- **Python 3.10+**
- **Flask** web framework
- **Flask-JWT-Extended** for authentication
- **Flask-SQLAlchemy** ORM
- **Flask-Migrate** for database migrations
- **PostgreSQL** database
- **Flask-CORS** for cross-origin requests

## Prerequisites

- Python 3.10 or higher
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd smart-job-application-tracker
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Copy the example below and adjust values:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bookease_db
# JWT_SECRET_KEY=your-secret-key-here
# CORS_ORIGINS=http://localhost:5173

# Initialize database
# Make sure PostgreSQL is running
python -c "from app import create_app; from models import db; app = create_app(); app.app_context().push(); db.create_all()"

# Seed database with demo data
python seed.py
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Run the Application

**Backend** (from `backend/` directory):
```bash
python app.py
```
Backend will run on `http://localhost:5000`

**Frontend** (from `frontend/` directory):
```bash
npm run dev
```
Frontend will run on `http://localhost:5173`

## Default Accounts

After seeding the database:

- **Admin**: 
  - Email: `admin@bookease.com`
  - Password: `admin123`

- **Client**: 
  - Email: `client@example.com`
  - Password: `client123`

## Project Structure

```
smart-job-application-tracker/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── config.py              # Configuration settings
│   ├── models.py              # Database models
│   ├── seed.py                # Database seeding script
│   ├── requirements.txt       # Python dependencies
│   ├── routes/                # API route handlers
│   │   ├── auth.py           # Authentication routes
│   │   ├── services.py       # Service CRUD routes
│   │   ├── appointments.py   # Appointment routes
│   │   ├── availability.py  # Availability calculation
│   │   └── admin.py          # Admin routes
│   └── utils/
│       └── booking_logic.py  # Booking slot generation logic
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts (Auth, Toast)
│   │   ├── pages/            # Page components
│   │   │   └── admin/       # Admin pages
│   │   ├── services/         # API service layer
│   │   └── utils/           # Utility functions
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
│
└── README.md                # This file
```

## Features in Detail

### Booking System
- **Slot-based booking**: Generates available time slots based on:
  - Service duration
  - Business working hours
  - Existing appointments
  - Buffer time between appointments
- **Prevents double bookings**
- **Future bookings only** (no past dates)
- **Cancellation and rescheduling** support

### Service Management
- Each service includes:
  - Name and description
  - Duration (in minutes)
  - Price
  - Address (where service is provided)
  - Image URL (for visual representation)

### Working Hours
- Set different hours for each day of the week
- Enable/disable specific days
- Used for availability calculation

## Security

- Password hashing with Werkzeug
- JWT-based authentication
- Role-based access control (Admin/Client)
- Protected routes on frontend
- CORS configuration
- SQL injection prevention with SQLAlchemy ORM

## Responsive Design

The application is fully responsive and optimized for:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

## Deployment

Për udhëzime të detajuara për deploy, shiko [DEPLOY.md](./DEPLOY.md)

### Quick Start me Render.com

1. **Krijo llogari në Render.com** dhe lidh repository-n tënde
2. **Deploy Database:**
   - Krijo PostgreSQL database në Render
   - RUAJ connection string-in
3. **Deploy Backend:**
   - Krijo Web Service me Python
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
   - Environment Variables:
     - `DATABASE_URL` = (nga PostgreSQL)
     - `JWT_SECRET_KEY` = (gjenero me `openssl rand -hex 32`)
     - `CORS_ORIGINS` = (URL e frontend pas deploy)
4. **Deploy Frontend:**
   - Krijo Static Site
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `frontend/dist`
   - Environment Variable: `VITE_API_URL` = (URL e backend)
5. **Seed Database:**
   - Shko te backend Shell dhe ekzekuto: `cd backend && python seed.py`

Ose përdor `render.yaml` për automated deployment:
- Render do të lexojë `render.yaml` dhe do të konfigurojë gjithçka automatikisht

Për opsione të tjera (Vercel, Railway, Heroku), shiko [DEPLOY.md](./DEPLOY.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Author

Built as a portfolio project demonstrating full-stack development skills.

## Support

For issues or questions, please open an issue on the repository.
