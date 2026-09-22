from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import Service, User, db


services_bp = Blueprint('services', __name__)


def current_admin():
    try:
        user = db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None
    return user if user and user.is_admin() else None


def validate_service(data, existing=None):
    name = str(data.get('name', existing.name if existing else '')).strip()
    if len(name) < 2 or len(name) > 200:
        raise ValueError('Name must be between 2 and 200 characters')

    duration_value = data.get(
        'duration_minutes',
        existing.duration_minutes if existing else None,
    )
    try:
        duration = int(duration_value)
    except (TypeError, ValueError) as error:
        raise ValueError('Duration must be a whole number') from error
    if duration < 5 or duration > 480:
        raise ValueError('Duration must be between 5 and 480 minutes')

    price_value = data.get('price', existing.price if existing else None)
    try:
        price = float(price_value)
    except (TypeError, ValueError) as error:
        raise ValueError('Price must be a valid number') from error
    if price < 0 or price > 1_000_000:
        raise ValueError('Price must be between 0 and 1,000,000')

    return {
        'name': name,
        'description': str(data.get(
            'description',
            existing.description if existing else '',
        ) or '').strip()[:2000],
        'duration_minutes': duration,
        'price': price,
        'address': str(data.get(
            'address',
            existing.address if existing else '',
        ) or '').strip()[:500],
        'image_url': str(data.get(
            'image_url',
            existing.image_url if existing else '',
        ) or '').strip()[:500],
    }


@services_bp.route('', methods=['GET'])
def get_services():
    try:
        services = Service.query.order_by(Service.created_at.desc()).all()
        return jsonify({'services': [service.to_dict() for service in services]})
    except Exception:
        current_app.logger.exception('Unable to list services')
        return jsonify({'error': 'Unable to load services'}), 500


@services_bp.route('', methods=['POST'])
@jwt_required()
def create_service():
    if not current_admin():
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json(silent=True) or {}
    try:
        values = validate_service(data)
    except ValueError as error:
        return jsonify({'error': str(error)}), 400

    try:
        service = Service(**values)
        db.session.add(service)
        db.session.commit()
        return jsonify({
            'message': 'Service created successfully',
            'service': service.to_dict(),
        }), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Service creation failed')
        return jsonify({'error': 'Unable to create the service'}), 500


@services_bp.route('/<int:service_id>', methods=['GET'])
def get_service(service_id):
    service = db.session.get(Service, service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    return jsonify({'service': service.to_dict()})


@services_bp.route('/<int:service_id>', methods=['PUT'])
@jwt_required()
def update_service(service_id):
    if not current_admin():
        return jsonify({'error': 'Admin access required'}), 403

    service = db.session.get(Service, service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404

    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    try:
        for field, value in validate_service(data, existing=service).items():
            setattr(service, field, value)
        db.session.commit()
        return jsonify({
            'message': 'Service updated successfully',
            'service': service.to_dict(),
        })
    except ValueError as error:
        return jsonify({'error': str(error)}), 400
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Service update failed')
        return jsonify({'error': 'Unable to update the service'}), 500


@services_bp.route('/<int:service_id>', methods=['DELETE'])
@jwt_required()
def delete_service(service_id):
    if not current_admin():
        return jsonify({'error': 'Admin access required'}), 403

    service = db.session.get(Service, service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404
    if service.appointments:
        return jsonify({
            'error': 'Services with appointment history cannot be deleted',
        }), 409

    try:
        db.session.delete(service)
        db.session.commit()
        return jsonify({'message': 'Service deleted successfully'})
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Service deletion failed')
        return jsonify({'error': 'Unable to delete the service'}), 500
