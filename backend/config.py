import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/bookease_db')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql+psycopg2://', 1)
    elif database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
    
    if 'render.com' in database_url or 'onrender.com' in database_url:
        if 'sslmode' not in database_url:
            separator = '&' if '?' in database_url else '?'
            database_url = f"{database_url}{separator}sslmode=require"
    
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    if os.getenv('FLASK_ENV') == 'production' and JWT_SECRET_KEY == 'dev-secret-key-change-in-production':
        raise ValueError('JWT_SECRET_KEY must be configured in production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    BOOKING_TIMEZONE = os.getenv('BOOKING_TIMEZONE', 'Europe/Tirane')
