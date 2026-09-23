"""
Health check endpoint for keep-alive
"""
from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint for keep-alive"""
    return jsonify({'status': 'ok', 'message': 'pong'}), 200

