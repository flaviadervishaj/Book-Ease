import logging

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db
from routes.admin import admin_bp
from routes.appointments import appointments_bp
from routes.auth import auth_bp
from routes.availability import availability_bp
from routes.health import health_bp
from routes.services import services_bp


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    is_production = app.config.get('ENVIRONMENT') == 'production'
    if is_production and not app.config.get('DATABASE_URL_CONFIGURED'):
        raise RuntimeError('DATABASE_URL is required in production.')
    if is_production and not app.config.get('JWT_SECRET_KEY'):
        raise RuntimeError('JWT_SECRET_KEY is required in production.')

    app.config['JWT_SECRET_KEY'] = (
        app.config.get('JWT_SECRET_KEY') or 'development-only-secret-change-me-now'
    )

    db.init_app(app)
    jwt = JWTManager(app)
    CORS(
        app,
        resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}},
    )

    @jwt.expired_token_loader
    def expired_token_callback(_jwt_header, _jwt_payload):
        return jsonify({
            'error': 'Token has expired',
            'code': 'TOKEN_EXPIRED',
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(_error):
        return jsonify({
            'error': 'Invalid authentication token',
            'code': 'INVALID_TOKEN',
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(_error):
        return jsonify({
            'error': 'Authorization token is missing',
            'code': 'MISSING_TOKEN',
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(_jwt_header, _jwt_payload):
        return jsonify({
            'error': 'Token has been revoked',
            'code': 'TOKEN_REVOKED',
        }), 401

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(services_bp, url_prefix='/api/services')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(availability_bp, url_prefix='/api/availability')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(health_bp, url_prefix='/api')

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(405)
    def method_not_allowed(_error):
        return jsonify({'error': 'Method not allowed'}), 405

    if app.config.get('AUTO_CREATE_TABLES') and not app.config.get('TESTING'):
        with app.app_context():
            db.create_all()

    return app


app = create_app()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(debug=app.config['ENVIRONMENT'] == 'development', port=5000)
