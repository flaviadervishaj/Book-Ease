import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/bookease_db')
    
    if 'render.com' in database_url or 'onrender.com' in database_url:
        if 'sslmode' not in database_url:
            separator = '&' if '?' in database_url else '?'
            database_url = f"{database_url}{separator}sslmode=require"
    
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = False
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
