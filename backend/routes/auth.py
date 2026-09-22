import re

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from models import User, db


auth_bp = Blueprint('auth', __name__)
EMAIL_PATTERN = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


def issue_token(user):
    return create_access_token(
        identity=str(user.id),
        additional_claims={'role': user.role},
    )


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))

    if not EMAIL_PATTERN.fullmatch(email):
        return jsonify({'error': 'A valid email address is required'}), 400
    if len(email) > 120:
        return jsonify({'error': 'Email address is too long'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must contain at least 8 characters'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    try:
        # Public registration always creates a client account. Admin accounts are
        # provisioned explicitly through the seed command or the database.
        user = User(email=email, role='client')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return jsonify({
            'message': 'User registered successfully',
            'access_token': issue_token(user),
            'user': user.to_dict(),
        }), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Registration failed')
        return jsonify({'error': 'Unable to create the account'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    return jsonify({
        'message': 'Login successful',
        'access_token': issue_token(user),
        'user': user.to_dict(),
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def current_user():
    try:
        user = db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        user = None

    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()})
