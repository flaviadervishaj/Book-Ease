from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from models import db, User
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        role = data.get('role', 'client').lower()
        
        if role not in ['client', 'admin']:
            return jsonify({'error': 'Invalid role. Must be "client" or "admin"'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        user = User(email=email, role=role)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Create token with user ID as string (Flask-JWT-Extended requires string identity)
        # Store role in additional_claims
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role}
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        error_details = str(e)
        print(f"Registration error: {error_details}")
        print(traceback.format_exc())
        
        # Check for specific database errors
        if 'UNIQUE constraint' in error_details or 'duplicate' in error_details.lower():
            return jsonify({'error': 'Email already registered'}), 400
        elif 'OperationalError' in str(type(e)) or 'connection' in error_details.lower():
            return jsonify({'error': 'Database connection error. Please try again later.'}), 500
        elif 'IntegrityError' in str(type(e)):
            return jsonify({'error': 'Email already registered'}), 400
        
        return jsonify({
            'error': f'Registration failed: {error_details}',
            'details': str(e) if current_app.config.get('DEBUG', False) else None
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create token with user ID as string (Flask-JWT-Extended requires string identity)
        # Store role in additional_claims
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role}
        )
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
