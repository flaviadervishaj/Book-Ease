from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Service
from datetime import datetime

services_bp = Blueprint('services', __name__)

def get_current_user():
    """Helper to get current user from JWT"""
    identity = get_jwt_identity()
    from models import User
    return User.query.get(identity['id'])

@services_bp.route('', methods=['GET'])
def get_services():
    """Get all services (public endpoint)"""
    try:
        services = Service.query.order_by(Service.created_at.desc()).all()
        return jsonify({
            'services': [service.to_dict() for service in services]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@services_bp.route('', methods=['POST'])
@jwt_required()
def create_service():
    """Create a new service (admin only)"""
    try:
        user = get_current_user()
        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        required_fields = ['name', 'duration_minutes', 'price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate duration
        if not isinstance(data['duration_minutes'], int) or data['duration_minutes'] <= 0:
            return jsonify({'error': 'duration_minutes must be a positive integer'}), 400
        
        # Validate price
        try:
            price = float(data['price'])
            if price < 0:
                return jsonify({'error': 'price must be non-negative'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'price must be a valid number'}), 400
        
        # Create service
        service = Service(
            name=data['name'].strip(),
            description=data.get('description', '').strip(),
            duration_minutes=data['duration_minutes'],
            price=price,
            address=data.get('address', '').strip(),
            image_url=data.get('image_url', '').strip()
        )
        
        db.session.add(service)
        db.session.commit()
        
        return jsonify({
            'message': 'Service created successfully',
            'service': service.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@services_bp.route('/<int:service_id>', methods=['GET'])
def get_service(service_id):
    """Get a specific service"""
    try:
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        return jsonify({
            'service': service.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@services_bp.route('/<int:service_id>', methods=['PUT'])
@jwt_required()
def update_service(service_id):
    """Update a service (admin only)"""
    try:
        user = get_current_user()
        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        # Update fields
        if 'name' in data:
            service.name = data['name'].strip()
        if 'description' in data:
            service.description = data['description'].strip()
        if 'duration_minutes' in data:
            if not isinstance(data['duration_minutes'], int) or data['duration_minutes'] <= 0:
                return jsonify({'error': 'duration_minutes must be a positive integer'}), 400
            service.duration_minutes = data['duration_minutes']
        if 'price' in data:
            try:
                price = float(data['price'])
                if price < 0:
                    return jsonify({'error': 'price must be non-negative'}), 400
                service.price = price
            except (ValueError, TypeError):
                return jsonify({'error': 'price must be a valid number'}), 400
        if 'address' in data:
            service.address = data['address'].strip()
        if 'image_url' in data:
            service.image_url = data['image_url'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Service updated successfully',
            'service': service.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@services_bp.route('/<int:service_id>', methods=['DELETE'])
@jwt_required()
def delete_service(service_id):
    """Delete a service (admin only)"""
    try:
        user = get_current_user()
        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        db.session.delete(service)
        db.session.commit()
        
        return jsonify({
            'message': 'Service deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
