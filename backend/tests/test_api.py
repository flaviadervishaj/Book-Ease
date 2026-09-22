import os
import sys
from datetime import datetime, time, timedelta, timezone
from pathlib import Path

import pytest


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-that-is-at-least-32-bytes'
os.environ['FLASK_ENV'] = 'testing'

from app import create_app  # noqa: E402
from models import Service, WorkingHours, db  # noqa: E402


@pytest.fixture()
def app():
    test_app = create_app({
        'TESTING': True,
        'AUTO_CREATE_TABLES': False,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test-secret-key-that-is-at-least-32-bytes',
    })

    with test_app.app_context():
        db.create_all()
        db.session.add(Service(
            name='Consultation',
            description='Portfolio test service',
            duration_minutes=30,
            price=25,
        ))
        db.session.add_all([
            WorkingHours(
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                is_available=True,
            )
            for day in range(7)
        ])
        db.session.commit()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def register(client, email='client@example.com', **extra):
    payload = {
        'email': email,
        'password': 'strongpass123',
        **extra,
    }
    return client.post('/api/auth/register', json=payload)


def auth_header(response):
    return {
        'Authorization': f"Bearer {response.get_json()['access_token']}",
    }


def tomorrow_string():
    return (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()


def first_available_slot(client):
    response = client.get('/api/availability', query_string={
        'service_id': 1,
        'date': tomorrow_string(),
    })
    assert response.status_code == 200
    return response.get_json()['available_slots'][0]['datetime']


def test_registration_is_always_client_and_session_can_be_restored(client):
    registration = register(client, role='admin')
    session = client.get('/api/auth/me', headers=auth_header(registration))

    assert registration.status_code == 201
    assert registration.get_json()['user']['role'] == 'client'
    assert session.status_code == 200
    assert session.get_json()['user']['email'] == 'client@example.com'


def test_registration_validates_password_and_duplicate_email(client):
    weak_password = client.post('/api/auth/register', json={
        'email': 'client@example.com',
        'password': 'short',
    })
    first = register(client)
    duplicate = register(client)

    assert weak_password.status_code == 400
    assert first.status_code == 201
    assert duplicate.status_code == 409


def test_public_seed_endpoint_is_not_available(client):
    response = client.post('/api/admin/seed')

    assert response.status_code == 404


def test_booking_flow_prevents_double_booking(client):
    first_user = register(client)
    slot = first_available_slot(client)
    created = client.post('/api/appointments', headers=auth_header(first_user), json={
        'service_id': 1,
        'start_time': slot,
    })

    second_user = register(client, 'second@example.com')
    conflict = client.post('/api/appointments', headers=auth_header(second_user), json={
        'service_id': 1,
        'start_time': slot,
    })
    second_user_list = client.get(
        '/api/appointments',
        headers=auth_header(second_user),
    )

    assert created.status_code == 201
    assert conflict.status_code == 409
    assert second_user_list.get_json()['appointments'] == []


def test_clients_cannot_complete_or_delete_appointments(client):
    registration = register(client)
    headers = auth_header(registration)
    created = client.post('/api/appointments', headers=headers, json={
        'service_id': 1,
        'start_time': first_available_slot(client),
    })
    appointment_id = created.get_json()['appointment']['id']

    completed = client.put(
        f'/api/appointments/{appointment_id}',
        headers=headers,
        json={'status': 'completed'},
    )
    deleted = client.delete(
        f'/api/appointments/{appointment_id}',
        headers=headers,
    )
    cancelled = client.put(
        f'/api/appointments/{appointment_id}',
        headers=headers,
        json={'status': 'cancelled'},
    )

    assert completed.status_code == 403
    assert deleted.status_code == 403
    assert cancelled.status_code == 200
