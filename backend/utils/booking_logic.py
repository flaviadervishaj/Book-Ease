"""
Booking logic utilities for calculating available time slots
"""
from datetime import datetime, timedelta, time
from models import WorkingHours, Appointment

def get_working_hours_for_day(day_of_week):
    """Get working hours for a specific day of week (0-6)"""
    working_hours = WorkingHours.query.filter_by(day_of_week=day_of_week, is_available=True).first()
    if not working_hours:
        return None
    return {
        'start': working_hours.start_time,
        'end': working_hours.end_time
    }

def generate_time_slots(start_time, end_time, slot_duration_minutes, buffer_minutes=0):
    """
    Generate available time slots between start and end time
    
    Args:
        start_time: datetime object for start time
        end_time: datetime object for end time
        slot_duration_minutes: duration of each slot in minutes
        buffer_minutes: buffer time between slots (optional)
    
    Returns:
        List of datetime objects representing available slots
    """
    slots = []
    current = start_time
    
    while current + timedelta(minutes=slot_duration_minutes + buffer_minutes) <= end_time:
        slots.append(current)
        current += timedelta(minutes=slot_duration_minutes + buffer_minutes)
    
    return slots

def get_existing_appointments(start_date, end_date):
    """
    Get all existing appointments between start_date and end_date
    
    Args:
        start_date: datetime object
        end_date: datetime object
    
    Returns:
        List of appointment dictionaries with start_time and end_time
    """
    appointments = Appointment.query.filter(
        Appointment.start_time >= start_date,
        Appointment.start_time < end_date,
        Appointment.status == 'confirmed'
    ).all()
    
    return [
        {
            'start': app.start_time,
            'end': app.end_time
        }
        for app in appointments
    ]

def is_slot_available(slot_start, slot_end, existing_appointments):
    """
    Check if a time slot is available (doesn't conflict with existing appointments)
    
    Args:
        slot_start: datetime object
        slot_end: datetime object
        existing_appointments: list of dicts with 'start' and 'end' keys
    
    Returns:
        Boolean indicating if slot is available
    """
    for appt in existing_appointments:
        # Check for overlap
        if not (slot_end <= appt['start'] or slot_start >= appt['end']):
            return False
    return True

def get_available_slots(date, service_duration_minutes, buffer_minutes=15):
    """
    Get all available time slots for a specific date and service duration
    
    Args:
        date: datetime.date object
        service_duration_minutes: duration of the service in minutes
        buffer_minutes: buffer time between appointments (default 15 minutes)
    
    Returns:
        List of available datetime objects
    """
    # Get day of week (0=Monday, 6=Sunday)
    day_of_week = date.weekday()
    
    # Get working hours for this day
    working_hours = get_working_hours_for_day(day_of_week)
    if not working_hours:
        return []
    
    # Create datetime objects for start and end of working hours
    start_datetime = datetime.combine(date, working_hours['start'])
    end_datetime = datetime.combine(date, working_hours['end'])
    
    # Get existing appointments for this date
    day_start = datetime.combine(date, time.min)
    day_end = datetime.combine(date, time.max)
    existing_appointments = get_existing_appointments(day_start, day_end)
    
    # Generate all possible slots
    all_slots = generate_time_slots(start_datetime, end_datetime, service_duration_minutes, buffer_minutes)
    
    # Filter out slots that conflict with existing appointments
    available_slots = []
    for slot_start in all_slots:
        slot_end = slot_start + timedelta(minutes=service_duration_minutes)
        
        # Don't allow bookings in the past
        if slot_start < datetime.now():
            continue
        
        if is_slot_available(slot_start, slot_end, existing_appointments):
            available_slots.append(slot_start)
    
    return available_slots

def format_time_slot(dt):
    """Format datetime to readable time string"""
    return dt.strftime('%H:%M')

