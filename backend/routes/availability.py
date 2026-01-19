from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from utils.booking_logic import get_available_slots, format_time_slot

availability_bp = Blueprint('availability', __name__)

@availability_bp.route('', methods=['GET'])
def get_availability():
    """Get available time slots for a service on a specific date"""
    try:
        service_id = request.args.get('service_id')
        date_str = request.args.get('date')
        
        if not service_id:
            return jsonify({'error': 'service_id is required'}), 400
        
        if not date_str:
            return jsonify({'error': 'date is required'}), 400
        
        # Parse date
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Get service
        from models import Service
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        # Get available slots
        available_slots = get_available_slots(date, service.duration_minutes)
        
        # Format slots
        formatted_slots = [
            {
                'time': format_time_slot(slot),
                'datetime': slot.isoformat()
            }
            for slot in available_slots
        ]
        
        return jsonify({
            'date': date_str,
            'service_id': int(service_id),
            'service_duration': service.duration_minutes,
            'available_slots': formatted_slots
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

