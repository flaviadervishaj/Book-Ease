from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Appointment, Service
from datetime import datetime, timedelta, timezone
from utils.booking_logic import get_available_slots, is_slot_available, get_existing_appointments

appointments_bp = Blueprint('appointments', __name__)

def get_current_user():
    """Helper to get current user from JWT"""
    identity = get_jwt_identity()
    from models import User
    return User.query.get(identity['id'])

@appointments_bp.route('', methods=['GET'])
@jwt_required()
def get_appointments():
    """Get appointments (all for admin, own for client)"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        status_filter = request.args.get('status')
        date_filter = request.args.get('date')
        
        # Build query
        if user.is_admin():
            query = Appointment.query
        else:
            query = Appointment.query.filter_by(user_id=user.id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        if date_filter:
            try:
                filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                start_of_day = datetime.combine(filter_date, datetime.min.time())
                end_of_day = datetime.combine(filter_date, datetime.max.time())
                query = query.filter(
                    Appointment.start_time >= start_of_day,
                    Appointment.start_time <= end_of_day
                )
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        appointments = query.order_by(Appointment.start_time.desc()).all()
        
        return jsonify({
            'appointments': [app.to_dict(include_user=user.is_admin()) for app in appointments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@appointments_bp.route('', methods=['POST'])
@jwt_required()
def create_appointment():
    """Create a new appointment"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        # Validate required fields
        if 'service_id' not in data or data.get('service_id') is None:
            return jsonify({'error': 'service_id is required'}), 400
        
        if 'start_time' not in data or not data.get('start_time'):
            return jsonify({'error': 'start_time is required'}), 400
        
        # Validate service_id is an integer
        try:
            service_id = int(data['service_id'])
        except (ValueError, TypeError):
            return jsonify({'error': 'service_id must be a valid integer'}), 400
        
        # Get service
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': f'Service with id {service_id} not found'}), 404
        
        # Parse start time
        try:
            start_time_str = str(data['start_time']).strip()
            
            if not start_time_str:
                return jsonify({'error': 'start_time is required and cannot be empty'}), 400
            
            # Handle different datetime formats
            if 'Z' in start_time_str:
                # ISO format with Z (UTC) - convert to +00:00
                start_time_str = start_time_str.replace('Z', '+00:00')
            
            # Try parsing with timezone first
            try:
                start_time = datetime.fromisoformat(start_time_str)
            except ValueError:
                # Try parsing without timezone (remove timezone part)
                clean_str = start_time_str.split('+')[0].split('Z')[0].split('.')[0]
                try:
                    start_time = datetime.strptime(clean_str, '%Y-%m-%dT%H:%M:%S')
                except ValueError:
                    # Try with milliseconds
                    try:
                        start_time = datetime.strptime(clean_str, '%Y-%m-%dT%H:%M:%S.%f')
                    except ValueError:
                        return jsonify({
                            'error': f'Invalid start_time format: "{clean_str}". Expected ISO 8601 format (e.g., 2024-01-20T14:30:00Z or 2024-01-20T14:30:00)',
                            'received': data.get('start_time')
                        }), 400
            
            # Convert to naive datetime (remove timezone info) for database storage
            if start_time.tzinfo:
                # Convert to UTC first, then remove timezone
                start_time = start_time.astimezone(timezone.utc).replace(tzinfo=None)
        except (ValueError, AttributeError, KeyError, TypeError) as e:
            return jsonify({
                'error': f'Invalid start_time format: {str(e)}. Expected ISO 8601 format (e.g., 2024-01-20T14:30:00Z)',
                'received': data.get('start_time')
            }), 400
        
        # Calculate end time
        end_time = start_time + timedelta(minutes=service.duration_minutes)
        
        # Check if slot is available
        day_start = datetime.combine(start_time.date(), datetime.min.time())
        day_end = datetime.combine(start_time.date(), datetime.max.time())
        existing_appointments = get_existing_appointments(day_start, day_end)
        
        if not is_slot_available(start_time, end_time, existing_appointments):
            return jsonify({'error': 'This time slot is no longer available'}), 400
        
        # Don't allow bookings in the past
        if start_time < datetime.now():
            return jsonify({'error': 'Cannot book appointments in the past'}), 400
        
        # Create appointment
        appointment = Appointment(
            user_id=user.id,
            service_id=service.id,
            start_time=start_time,
            end_time=end_time,
            status='confirmed'
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment created successfully',
            'appointment': appointment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        error_details = str(e)
        # Log the full traceback for debugging
        print(f"Error creating appointment: {error_details}")
        print(traceback.format_exc())
        return jsonify({
            'error': f'Failed to create appointment: {error_details}',
            'details': str(e) if current_app.config.get('DEBUG') else None
        }), 500

@appointments_bp.route('/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    """Get a specific appointment"""
    try:
        user = get_current_user()
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check access (admin or own appointment)
        if not user.is_admin() and appointment.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'appointment': appointment.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    """Update an appointment (reschedule or cancel)"""
    try:
        user = get_current_user()
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check access
        if not user.is_admin() and appointment.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        # Update status
        if 'status' in data:
            valid_statuses = ['confirmed', 'cancelled', 'completed']
            if data['status'] not in valid_statuses:
                return jsonify({'error': f'Status must be one of: {", ".join(valid_statuses)}'}), 400
            appointment.status = data['status']
        
        # Reschedule (update start_time)
        if 'start_time' in data and data['start_time']:
            try:
                new_start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
                if new_start_time.tzinfo:
                    new_start_time = new_start_time.replace(tzinfo=None)
                
                # Get service to calculate new end time
                service = Service.query.get(appointment.service_id)
                new_end_time = new_start_time + timedelta(minutes=service.duration_minutes)
                
                # Check if new slot is available (exclude current appointment)
                day_start = datetime.combine(new_start_time.date(), datetime.min.time())
                day_end = datetime.combine(new_start_time.date(), datetime.max.time())
                existing_appointments = get_existing_appointments(day_start, day_end)
                # Remove current appointment from conflicts
                existing_appointments = [a for a in existing_appointments if a['start'] != appointment.start_time]
                
                if not is_slot_available(new_start_time, new_end_time, existing_appointments):
                    return jsonify({'error': 'This time slot is no longer available'}), 400
                
                if new_start_time < datetime.now():
                    return jsonify({'error': 'Cannot reschedule to a past time'}), 400
                
                appointment.start_time = new_start_time
                appointment.end_time = new_end_time
                
            except (ValueError, AttributeError):
                return jsonify({'error': 'Invalid start_time format'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment updated successfully',
            'appointment': appointment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    """Delete an appointment"""
    try:
        user = get_current_user()
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check access
        if not user.is_admin() and appointment.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

