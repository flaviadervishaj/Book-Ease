from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request

from models import Service, db
from utils.booking_logic import format_time_slot, get_available_slots


availability_bp = Blueprint('availability', __name__)


@availability_bp.route('', methods=['GET'])
def get_availability():
    try:
        service_id = int(request.args.get('service_id', ''))
    except ValueError:
        return jsonify({'error': 'service_id must be a valid integer'}), 400

    date_value = request.args.get('date', '')
    try:
        booking_date = datetime.strptime(date_value, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    today = datetime.now(timezone.utc).date()
    if booking_date < today or booking_date > today + timedelta(days=90):
        return jsonify({'error': 'Date must be within the next 90 days'}), 400

    service = db.session.get(Service, service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404

    try:
        available_slots = get_available_slots(
            booking_date,
            service.duration_minutes,
        )
        return jsonify({
            'date': date_value,
            'service_id': service_id,
            'service_duration': service.duration_minutes,
            'available_slots': [
                {
                    'time': format_time_slot(slot),
                    'datetime': f'{slot.isoformat()}Z',
                }
                for slot in available_slots
            ],
        })
    except Exception:
        current_app.logger.exception('Availability lookup failed')
        return jsonify({'error': 'Unable to load availability'}), 500
