from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from models import Appointment, Service, User, WorkingHours, db


admin_bp = Blueprint('admin', __name__)


def current_admin():
    try:
        user = db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None
    return user if user and user.is_admin() else None


@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    if not current_admin():
        return jsonify({'error': 'Admin access required'}), 403

    try:
        status_rows = db.session.query(
            Appointment.status,
            func.count(Appointment.id),
        ).group_by(Appointment.status).all()

        seven_days_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=7)
        daily_rows = db.session.query(
            func.date(Appointment.start_time).label('date'),
            func.count(Appointment.id).label('count'),
        ).filter(
            Appointment.start_time >= seven_days_ago,
        ).group_by(
            func.date(Appointment.start_time),
        ).order_by(
            func.date(Appointment.start_time),
        ).all()

        popular_service = db.session.query(
            Service.name,
            func.count(Appointment.id).label('count'),
        ).join(
            Appointment,
            Service.id == Appointment.service_id,
        ).group_by(
            Service.id,
            Service.name,
        ).order_by(
            func.count(Appointment.id).desc(),
        ).first()

        return jsonify({
            'total_bookings': Appointment.query.count(),
            'bookings_by_status': dict(status_rows),
            'bookings_per_day': [
                {'date': str(date), 'count': count}
                for date, count in daily_rows
            ],
            'popular_service': (
                {'name': popular_service[0], 'count': popular_service[1]}
                if popular_service else None
            ),
        })
    except Exception:
        current_app.logger.exception('Dashboard statistics failed')
        return jsonify({'error': 'Unable to load dashboard statistics'}), 500


@admin_bp.route('/working-hours', methods=['GET'])
@jwt_required()
def get_working_hours():
    if not current_admin():
        return jsonify({'error': 'Admin access required'}), 403

    try:
        working_hours = WorkingHours.query.order_by(WorkingHours.day_of_week).all()
        return jsonify({
            'working_hours': [hours.to_dict() for hours in working_hours],
        })
    except Exception:
        current_app.logger.exception('Working hours lookup failed')
        return jsonify({'error': 'Unable to load working hours'}), 500


@admin_bp.route('/working-hours', methods=['POST'])
@jwt_required()
def save_working_hours():
    if not current_admin():
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json(silent=True) or {}
    try:
        day_of_week = int(data.get('day_of_week'))
        start_time = datetime.strptime(str(data.get('start_time')), '%H:%M').time()
        end_time = datetime.strptime(str(data.get('end_time')), '%H:%M').time()
    except (TypeError, ValueError):
        return jsonify({
            'error': 'day_of_week and HH:MM start/end times are required',
        }), 400

    if day_of_week < 0 or day_of_week > 6:
        return jsonify({'error': 'day_of_week must be between 0 and 6'}), 400
    if start_time >= end_time:
        return jsonify({'error': 'start_time must be before end_time'}), 400

    is_available = data.get('is_available', True)
    if not isinstance(is_available, bool):
        return jsonify({'error': 'is_available must be a boolean'}), 400

    try:
        working_hours = WorkingHours.query.filter_by(day_of_week=day_of_week).first()
        if not working_hours:
            working_hours = WorkingHours(day_of_week=day_of_week)
            db.session.add(working_hours)

        working_hours.start_time = start_time
        working_hours.end_time = end_time
        working_hours.is_available = is_available
        db.session.commit()
        return jsonify({
            'message': 'Working hours saved successfully',
            'working_hours': working_hours.to_dict(),
        })
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Working hours update failed')
        return jsonify({'error': 'Unable to save working hours'}), 500
