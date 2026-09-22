"""Utilities for generating and reserving appointment slots."""

from datetime import datetime, time, timedelta, timezone

from sqlalchemy import text

from models import Appointment, WorkingHours, db


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_working_hours_for_day(day_of_week):
    working_hours = WorkingHours.query.filter_by(
        day_of_week=day_of_week,
        is_available=True,
    ).first()
    if not working_hours:
        return None
    return {
        'start': working_hours.start_time,
        'end': working_hours.end_time,
    }


def generate_time_slots(start_time, end_time, duration_minutes, buffer_minutes=15):
    slots = []
    current = start_time
    while current + timedelta(minutes=duration_minutes) <= end_time:
        slots.append(current)
        current += timedelta(minutes=duration_minutes + buffer_minutes)
    return slots


def get_existing_appointments(start_date, end_date, exclude_appointment_id=None):
    query = Appointment.query.filter(
        Appointment.start_time < end_date,
        Appointment.end_time > start_date,
        Appointment.status == 'confirmed',
    )
    if exclude_appointment_id is not None:
        query = query.filter(Appointment.id != exclude_appointment_id)

    return [
        {'id': appointment.id, 'start': appointment.start_time, 'end': appointment.end_time}
        for appointment in query.all()
    ]


def is_slot_available(slot_start, slot_end, existing_appointments):
    return all(
        slot_end <= appointment['start'] or slot_start >= appointment['end']
        for appointment in existing_appointments
    )


def get_available_slots(date, service_duration_minutes, exclude_appointment_id=None):
    working_hours = get_working_hours_for_day(date.weekday())
    if not working_hours:
        return []

    start_datetime = datetime.combine(date, working_hours['start'])
    end_datetime = datetime.combine(date, working_hours['end'])
    day_start = datetime.combine(date, time.min)
    day_end = datetime.combine(date + timedelta(days=1), time.min)
    existing_appointments = get_existing_appointments(
        day_start,
        day_end,
        exclude_appointment_id=exclude_appointment_id,
    )

    return [
        slot_start
        for slot_start in generate_time_slots(
            start_datetime,
            end_datetime,
            service_duration_minutes,
        )
        if slot_start >= utc_now()
        and is_slot_available(
            slot_start,
            slot_start + timedelta(minutes=service_duration_minutes),
            existing_appointments,
        )
    ]


def lock_booking_day(booking_date):
    """Serialize booking writes for a day when running on PostgreSQL."""
    if db.engine.dialect.name != 'postgresql':
        return

    lock_key = int(booking_date.strftime('%Y%m%d'))
    db.session.execute(
        text('SELECT pg_advisory_xact_lock(:lock_key)'),
        {'lock_key': lock_key},
    )


def format_time_slot(value):
    return value.strftime('%H:%M')
