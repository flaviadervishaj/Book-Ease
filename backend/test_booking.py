import os
import unittest
from datetime import date, timedelta

os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['JWT_SECRET_KEY'] = 'test-key-that-is-long-enough-for-hs256'
os.environ['BOOKING_TIMEZONE'] = 'Europe/Tirane'

from app import app
from models import db, User


class BookingFlowTests(unittest.TestCase):
    def setUp(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()
            db.create_all()
            from seed import seed_database
            seed_database()
        self.client = app.test_client()

    def register(self, email, role='client'):
        response = self.client.post('/api/auth/register', json={
            'email': email, 'password': 'test-password', 'role': role,
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json['user']['role'], 'client')
        return {'Authorization': f"Bearer {response.json['access_token']}"}

    def test_booking_slot_and_reschedule(self):
        with app.app_context():
            self.assertEqual(User.query.count(), 0)
        headers = self.register('first@example.com', 'admin')
        other_headers = self.register('second@example.com')
        self.assertEqual(self.client.get('/api/auth/me', headers=headers).json['user']['role'], 'client')
        self.assertEqual(self.client.post('/api/admin/seed').status_code, 404)

        day = date.today() + timedelta(days=14)
        while day.weekday() != 0:
            day += timedelta(days=1)
        query = f'/api/availability?service_id=1&date={day.isoformat()}'
        slots = self.client.get(query).json
        self.assertEqual(slots['timezone'], 'Europe/Tirane')
        self.assertGreater(len(slots['available_slots']), 1)
        first, second = slots['available_slots'][:2]
        self.assertTrue(first['datetime'].endswith('+00:00'))
        self.assertEqual(first['time'], '09:00')

        created = self.client.post('/api/appointments', json={
            'service_id': 1, 'start_time': first['datetime'],
        }, headers=headers)
        self.assertEqual(created.status_code, 201, created.json)
        appointment = created.json['appointment']
        self.assertTrue(appointment['start_time'].endswith('Z'))
        self.assertEqual(self.client.delete(
            f"/api/appointments/{appointment['id']}", headers=headers,
        ).status_code, 403)
        self.assertEqual(self.client.put(f"/api/appointments/{appointment['id']}", json={
            'status': 'cancelled', 'start_time': second['datetime'],
        }, headers=headers).status_code, 400)
        self.assertEqual(self.client.post('/api/appointments', json={
            'service_id': 1, 'start_time': first['datetime'],
        }, headers=other_headers).status_code, 400)
        self.assertEqual(self.client.post('/api/appointments', json={
            'service_id': 1, 'start_time': f'{day.isoformat()}T03:00:00+00:00',
        }, headers=other_headers).status_code, 400)

        moved = self.client.put(f"/api/appointments/{appointment['id']}", json={
            'start_time': second['datetime'],
        }, headers=headers)
        self.assertEqual(moved.status_code, 200, moved.json)
        self.assertNotEqual(moved.json['appointment']['start_time'], appointment['start_time'])
        self.assertEqual(self.client.put(f"/api/appointments/{appointment['id']}", json={
            'status': 'completed',
        }, headers=headers).status_code, 403)


if __name__ == '__main__':
    unittest.main()
