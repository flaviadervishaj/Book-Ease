import os
from datetime import timedelta

from dotenv import load_dotenv


load_dotenv()


def normalize_database_url(value):
    if value and value.startswith('postgres://'):
        return value.replace('postgres://', 'postgresql://', 1)
    return value


class Config:
    ENVIRONMENT = os.getenv('FLASK_ENV', 'development')
    DATABASE_URL_CONFIGURED = bool(os.getenv('DATABASE_URL'))
    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.getenv('DATABASE_URL') or 'sqlite:///bookease.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_pre_ping': True}

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv('JWT_ACCESS_TOKEN_HOURS', '8'))
    )

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
        if origin.strip()
    ]
    AUTO_CREATE_TABLES = os.getenv('AUTO_CREATE_TABLES', 'true').lower() == 'true'
