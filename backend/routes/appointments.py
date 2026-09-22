from datetime import datetime, time, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import Appointment, Service, User, db
from utils.booking_logic import get_available_slots, lock_booking_day, utc_now


appointments_bp = Blueprint('appointments', __name__)
VALID_STATUSES = {'confirmed', 'cancelled', 'completed'}


def get_current_user():
    try:
        return db.session.get(User, int(get_jwt_identity()))
    except (TypeError, ValueError):
        return None


def parse_start_time(value):
    if not value:
        raise ValueError('start_time is required')

    try:
        parsed = datetime.fromisoformat(str(value).strip().replace('Z', '+00:00'))
    except ValueError as error:
        raise ValueError('start_time must be a valid ISO 8601 value') from error

    if parsed.tzinfo:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed.replace(microsecond=0)


def appointment_for_user(appointment_id, user):
    appointment = db.session.get(Appointment, appointment_id)
    if not appointment:
        return None, (jsonify({'error': 'Appointment not found'}), 404)
    if not user.is_admin() and appointment.user_id != user.id:
        return None, (jsonify({'error': 'Access denied'}), 403)
    return appointment, None


@appointments_bp.route('', methods=['GET'])
@jwt_required()
def get_appointments():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    status_filter = request.args.get('status')
    if status_filter and status_filter not in VALID_STATUSES:
        return jsonify({'error': 'Invalid appointment status'}), 400

    query = Appointment.query if user.is_admin() else Appointment.query.filter_by(user_id=user.id)
    if status_filter:
        query = query.filter_by(status=status_filter)

    date_filter = request.args.get('date')
    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

        start_of_day = datetime.combine(filter_date, time.min)
        end_of_day = start_of_day + timedelta(days=1)
        query = query.filter(
            Appointment.start_time >= start_of_day,
            Appointment.start_time < end_of_day,
        )

    try:
        appointments = query.order_by(Appointment.start_time.desc()).all()
        return jsonify({
            'appointments': [
                appointment.to_dict(include_user=user.is_admin())
                for appointment in appointments
            ],
        })
    except Exception:
        current_app.logger.exception('Unable to list appointments')
        return jsonify({'error': 'Unable to load appointments'}), 500


@appointments_bp.route('', methods=['POST'])
@jwt_required()
def create_appointment():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json(silent=True) or {}
    try:
        service_id = int(data.get('service_id'))
    except (TypeError, ValueError):
        return jsonify({'error': 'service_id must be a valid integer'}), 400

    service = db.session.get(Service, service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404

    try:
        start_time = parse_start_time(data.get('start_time'))
    except ValueError as error:
        return jsonify({'error': str(error)}), 400

    if start_time < utc_now():
        return jsonify({'error': 'Cannot book appointments in the past'}), 400

    try:
        lock_booking_day(start_time.date())
        offered_slots = get_available_slots(start_time.date(), service.duration_minutes)
        if start_time not in offered_slots:
            db.session.rollback()
            return jsonify({'error': 'This time slot is not available'}), 409

        appointment = Appointment(
            user_id=user.id,
            service_id=service.id,
            start_time=start_time,
            end_time=start_time + timedelta(minutes=service.duration_minutes),
            status='confirmed',
        )
        db.session.add(appointment)
        db.session.commit()
        return jsonify({
            'message': 'Appointment created successfully',
            'appointment': appointment.to_dict(),
        }), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Appointment creation failed')
        return jsonify({'error': 'Unable to create the appointment'}), 500


@appointments_bp.route('/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    appointment, error = appointment_for_user(appointment_id, user)
    if error:
        return error
    return jsonify({'appointment': appointment.to_dict(include_user=user.is_admin())})


@appointments_bp.route('/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    appointment, error = appointment_for_user(appointment_id, user)
    if error:
        return error

    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    if 'status' in data:
        requested_status = data['status']
        if requested_status not in VALID_STATUSES:
            return jsonify({'error': 'Invalid appointment status'}), 400
        if not user.is_admin() and requested_status != 'cancelled':
            return jsonify({'error': 'Clients can only cancel appointments'}), 403
        appointment.status = requested_status

    if data.get('start_time'):
        if appointment.status != 'confirmed':
            return jsonify({'error': 'Only confirmed appointments can be rescheduled'}), 400

        try:
            new_start_time = parse_start_time(data['start_time'])
        except ValueError as parse_error:
            return jsonify({'error': str(parse_error)}), 400
        if new_start_time < utc_now():
            return jsonify({'error': 'Cannot reschedule to a past time'}), 400

        service = db.session.get(Service, appointment.service_id)
        try:
            lock_booking_day(new_start_time.date())
            offered_slots = get_available_slots(
                new_start_time.date(),
                service.duration_minutes,
                exclude_appointment_id=appointment.id,
            )
            if new_start_time not in offered_slots:
                db.session.rollback()
                return jsonify({'error': 'This time slot is not available'}), 409

            appointment.start_time = new_start_time
            appointment.end_time = new_start_time + timedelta(
                minutes=service.duration_minutes
            )
        except Exception:
            db.session.rollback()
            current_app.logger.exception('Appointment reschedule failed')
            return jsonify({'error': 'Unable to reschedule the appointment'}), 500

    try:
        db.session.commit()
        return jsonify({
            'message': 'Appointment updated successfully',
            'appointment': appointment.to_dict(),
        })
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Appointment update failed')
        return jsonify({'error': 'Unable to update the appointment'}), 500


@appointments_bp.route('/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    user = get_current_user()
    if not user or not user.is_admin():
        return jsonify({'error': 'Admin access required'}), 403

    appointment = db.session.get(Appointment, appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    try:
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({'message': 'Appointment deleted successfully'})
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Appointment deletion failed')
        return jsonify({'error': 'Unable to delete the appointment'}), 500
