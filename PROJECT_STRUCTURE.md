# BookEase - Project Structure

## Overview
This document describes the complete structure of the BookEase service booking platform.

## Root Directory
```
smart-job-application-tracker/
├── backend/          # Python Flask backend
├── frontend/         # React frontend
├── README.md         # Main project documentation
├── .gitignore        # Git ignore rules
└── PROJECT_STRUCTURE.md  # This file
```

## Backend Structure

```
backend/
├── __init__.py              # Package initialization
├── app.py                   # Flask application factory
├── config.py                # Configuration settings
├── models.py                # SQLAlchemy database models
├── requirements.txt         # Python dependencies
├── seed.py                  # Database seeding script
│
├── routes/                  # API route handlers
│   ├── __init__.py
│   ├── auth.py             # Authentication routes (login, register)
│   ├── services.py         # Service CRUD routes
│   ├── appointments.py     # Appointment CRUD routes
│   ├── availability.py     # Availability calculation endpoint
│   └── admin.py            # Admin-specific routes
│
└── utils/                   # Utility modules
    ├── __init__.py
    └── booking_logic.py    # Slot generation logic
```

### Backend Files Description

- **app.py**: Main Flask application entry point, initializes extensions and registers blueprints
- **config.py**: Application configuration (database URI, JWT secret, CORS origins)
- **models.py**: Database models (User, Service, Appointment, WorkingHours)
- **seed.py**: Populates database with demo data (users, services, working hours)
- **routes/auth.py**: User registration and login endpoints
- **routes/services.py**: CRUD operations for services (admin only)
- **routes/appointments.py**: CRUD operations for appointments
- **routes/availability.py**: Calculates and returns available time slots
- **routes/admin.py**: Admin dashboard stats, working hours management
- **utils/booking_logic.py**: Core logic for generating available booking slots

## Frontend Structure

```
frontend/
├── index.html              # Main HTML file
├── package.json            # Frontend dependencies
├── vite.config.js         # Vite configuration
│
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main App component with routing
    ├── App.css            # Global application styles
    ├── index.css          # Global CSS variables and base styles
    │
    ├── components/        # Reusable React components
    │   ├── AdminRoute.jsx           # Route protection for admin
    │   ├── ConfirmationDialog.jsx  # Confirmation dialog component
    │   ├── ConfirmationDialog.css
    │   ├── Icons.jsx               # SVG icon components
    │   ├── Icons.css
    │   ├── Layout.jsx              # Main layout with navigation
    │   ├── Layout.css
    │   ├── LoadingSkeleton.jsx    # Loading skeleton components
    │   ├── LoadingSkeleton.css
    │   ├── Logo.jsx                # Logo component
    │   ├── Logo.css
    │   ├── ProtectedRoute.jsx      # Route protection for authenticated users
    │   ├── Toast.jsx               # Toast notification component
    │   └── Toast.css
    │
    ├── contexts/          # React Context providers
    │   ├── AuthContext.jsx    # Authentication state management
    │   ├── ThemeContext.jsx   # Dark/light theme management
    │   └── ToastContext.jsx   # Toast notifications context
    │
    ├── hooks/             # Custom React hooks
    │   └── useDebounce.js  # Debounce hook for search/filtering
    │
    ├── pages/             # Page components
    │   ├── Login.jsx           # Login page
    │   ├── Register.jsx         # Registration page
    │   ├── Auth.css            # Shared styles for auth pages
    │   ├── Services.jsx        # Services listing page
    │   ├── Services.css
    │   ├── Book.jsx            # Booking page
    │   ├── Book.css
    │   ├── MyAppointments.jsx  # User's appointments page
    │   ├── MyAppointments.css
    │   │
    │   └── admin/              # Admin pages
    │       ├── Dashboard.jsx      # Admin dashboard with stats
    │       ├── Services.jsx      # Service management
    │       ├── Appointments.jsx  # All appointments view
    │       ├── WorkingHours.jsx  # Working hours management
    │       └── Admin.css         # Shared admin styles
    │
    ├── services/          # API service layer
    │   └── api.js         # Axios instance with interceptors
    │
    └── utils/             # Utility functions
        └── dateUtils.js   # Date formatting and manipulation utilities
```

### Frontend Files Description

**Components:**
- **AdminRoute**: Protects admin routes, redirects non-admin users
- **ProtectedRoute**: Protects authenticated routes, redirects to login
- **Layout**: Main layout with navbar, navigation links, user info, theme toggle
- **Logo**: BookEase logo component with gradient text
- **ConfirmationDialog**: Reusable confirmation dialog
- **Toast**: Toast notification component
- **LoadingSkeleton**: Loading placeholders for cards and tables
- **Icons**: SVG icon components (Search, Clock, Money, Calendar, etc.)

**Contexts:**
- **AuthContext**: Manages authentication state, login/logout/register functions
- **ThemeContext**: Manages dark/light theme, persists to localStorage
- **ToastContext**: Global toast notification system

**Pages:**
- **Login/Register**: Authentication pages with theme toggle
- **Services**: Browse services with search, filters, and booking
- **Book**: Step-by-step booking flow (service → date → time slot)
- **MyAppointments**: User's appointments with filters and actions
- **Admin Dashboard**: Statistics, charts, recent appointments
- **Admin Services**: CRUD for services
- **Admin Appointments**: View and manage all appointments
- **Admin WorkingHours**: Set business hours for each day

**Services:**
- **api.js**: Configured Axios instance with JWT token interceptor

**Utils:**
- **dateUtils.js**: Date formatting, relative time, date comparisons

## Database Models

### User
- id, email, password_hash, role (admin/client), created_at

### Service
- id, name, description, duration_minutes, price, address, image_url, created_at

### Appointment
- id, user_id, service_id, start_time, end_time, status, created_at

### WorkingHours
- id, day_of_week (0-6), start_time, end_time, is_available

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Services
- GET `/api/services` - Get all services (public)
- POST `/api/services` - Create service (admin)
- GET `/api/services/:id` - Get service by ID
- PUT `/api/services/:id` - Update service (admin)
- DELETE `/api/services/:id` - Delete service (admin)

### Appointments
- GET `/api/appointments` - Get appointments (filtered by user or admin)
- POST `/api/appointments` - Create appointment
- PUT `/api/appointments/:id` - Update appointment status
- DELETE `/api/appointments/:id` - Delete appointment

### Availability
- GET `/api/availability` - Get available time slots (query: service_id, date)

### Admin
- GET `/api/admin/dashboard/stats` - Dashboard statistics
- GET `/api/admin/working-hours` - Get working hours
- PUT `/api/admin/working-hours` - Update working hours

## Key Features

### Booking System
- Slot-based booking with conflict prevention
- Buffer time between appointments (15 minutes default)
- Future bookings only
- Real-time availability checking

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/Client)
- Protected routes on frontend
- Secure password hashing

### UI/UX
- Dark/Light mode toggle
- Responsive design (mobile, tablet, desktop)
- Loading states and skeletons
- Toast notifications
- Smooth animations and transitions

## Development Setup

1. Backend: `cd backend && python app.py`
2. Frontend: `cd frontend && npm run dev`
3. Seed database: `cd backend && python seed.py`

## Production Considerations

- Set proper JWT_SECRET_KEY in production
- Configure CORS_ORIGINS for production domain
- Use environment variables for sensitive data
- Set up proper database migrations
- Configure production WSGI server (Gunicorn)
- Build frontend: `npm run build`

