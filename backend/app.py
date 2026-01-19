from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db, User, Service
from routes.auth import auth_bp
from routes.services import services_bp
from routes.appointments import appointments_bp
from routes.availability import availability_bp
from routes.admin import admin_bp
from routes.health import health_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(services_bp, url_prefix='/api/services')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(availability_bp, url_prefix='/api/availability')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(health_bp, url_prefix='/api')
    
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully")
            
            user_count = User.query.count()
            service_count = Service.query.count()
            
            if user_count == 0 or service_count == 0:
                print("Database appears empty, seeding with demo data...")
                try:
                    from seed import seed_database
                    seed_database()
                    print("Database seeded successfully!")
                except Exception as seed_error:
                    print(f"Warning: Could not seed database: {seed_error}")
        except Exception as e:
            print(f"Warning: Could not create database tables: {e}")
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
