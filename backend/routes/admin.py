from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, WorkingHours, Appointment, Service
from datetime import datetime, timedelta
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)

def get_current_user():
    """Helper to get current user from JWT"""
    identity = get_jwt_identity()
    from models import User
    return User.query.get(identity['id'])

def require_admin():
    """Decorator helper to require admin access"""
    user = get_current_user()
    if not user or not user.is_admin():
        return None
    return user

@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics (admin only)"""
    try:
        admin = require_admin()
        if not admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        # Total bookings
        total_bookings = Appointment.query.count()
        
        # Bookings by status
        bookings_by_status = db.session.query(
            Appointment.status,
            func.count(Appointment.id)
        ).group_by(Appointment.status).all()
        
        status_counts = {status: count for status, count in bookings_by_status}
        
        # Bookings per day (last 7 days)
        seven_days_ago = datetime.now() - timedelta(days=7)
        bookings_per_day = db.session.query(
            func.date(Appointment.start_time).label('date'),
            func.count(Appointment.id).label('count')
        ).filter(
            Appointment.start_time >= seven_days_ago
        ).group_by(func.date(Appointment.start_time)).all()
        
        bookings_per_day_data = [
            {'date': str(date), 'count': count}
            for date, count in bookings_per_day
        ]
        
        # Most popular service
        popular_service = db.session.query(
            Service.name,
            func.count(Appointment.id).label('count')
        ).join(
            Appointment, Service.id == Appointment.service_id
        ).group_by(Service.id, Service.name).order_by(
            func.count(Appointment.id).desc()
        ).first()
        
        popular_service_data = None
        if popular_service:
            popular_service_data = {
                'name': popular_service[0],
                'count': popular_service[1]
            }
        
        return jsonify({
            'total_bookings': total_bookings,
            'bookings_by_status': status_counts,
            'bookings_per_day': bookings_per_day_data,
            'popular_service': popular_service_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/working-hours', methods=['GET'])
@jwt_required()
def get_working_hours():
    """Get working hours (admin only)"""
    try:
        admin = require_admin()
        if not admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        working_hours = WorkingHours.query.order_by(WorkingHours.day_of_week).all()
        
        return jsonify({
            'working_hours': [wh.to_dict() for wh in working_hours]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/working-hours', methods=['POST'])
@jwt_required()
def create_working_hours():
    """Create or update working hours (admin only)"""
    try:
        admin = require_admin()
        if not admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        required_fields = ['day_of_week', 'start_time', 'end_time']
        for field in required_fields:
            if data.get(field) is None:
                return jsonify({'error': f'{field} is required'}), 400
        
        day_of_week = data['day_of_week']
        if day_of_week < 0 or day_of_week > 6:
            return jsonify({'error': 'day_of_week must be between 0 and 6'}), 400
        
        # Parse times
        try:
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid time format. Use HH:MM'}), 400
        
        if start_time >= end_time:
            return jsonify({'error': 'start_time must be before end_time'}), 400
        
        # Check if working hours already exist for this day
        existing = WorkingHours.query.filter_by(day_of_week=day_of_week).first()
        
        if existing:
            # Update existing
            existing.start_time = start_time
            existing.end_time = end_time
            existing.is_available = data.get('is_available', True)
        else:
            # Create new
            working_hours = WorkingHours(
                day_of_week=day_of_week,
                start_time=start_time,
                end_time=end_time,
                is_available=data.get('is_available', True)
            )
            db.session.add(working_hours)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Working hours saved successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

