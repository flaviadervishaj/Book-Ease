from app import create_app
from models import db, User, Service, WorkingHours
from datetime import time

def seed_database():
    app = create_app()
    
    with app.app_context():
        # Create admin user
        admin = User.query.filter_by(email='admin@bookease.com').first()
        if not admin:
            admin = User(email='admin@bookease.com', role='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Created admin user: admin@bookease.com / admin123")
        else:
            print("Admin user already exists")
        
        # Create demo client
        client = User.query.filter_by(email='client@example.com').first()
        if not client:
            client = User(email='client@example.com', role='client')
            client.set_password('client123')
            db.session.add(client)
            db.session.commit()
            print("Created client user: client@example.com / client123")
        else:
            print("Client user already exists")
        
        # Create services with addresses and images
        services_data = [
            {
                'name': 'Haircut',
                'description': 'Professional haircut service with modern styling techniques',
                'duration_minutes': 30,
                'price': 25.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop'
            },
            {
                'name': 'Haircut & Styling',
                'description': 'Complete haircut with professional styling and finishing',
                'duration_minutes': 45,
                'price': 40.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop'
            },
            {
                'name': 'Beard Trim',
                'description': 'Professional beard trimming and shaping service',
                'duration_minutes': 20,
                'price': 15.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop'
            },
            {
                'name': 'Full Service',
                'description': 'Complete package: Haircut, styling, and beard trim',
                'duration_minutes': 60,
                'price': 50.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1560869713-e9b8b3e8c0c5?w=800&h=600&fit=crop'
            },
            {
                'name': 'Hair Color',
                'description': 'Professional hair coloring service with premium products',
                'duration_minutes': 90,
                'price': 75.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop'
            },
            {
                'name': 'Hair Wash & Style',
                'description': 'Relaxing hair wash with professional styling',
                'duration_minutes': 25,
                'price': 20.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=600&fit=crop'
            },
            {
                'name': 'Kids Haircut',
                'description': 'Special haircut service for children',
                'duration_minutes': 20,
                'price': 18.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&h=600&fit=crop'
            },
            {
                'name': 'Hair Treatment',
                'description': 'Deep conditioning and hair treatment service',
                'duration_minutes': 45,
                'price': 35.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop'
            },
            {
                'name': 'Consultation',
                'description': 'Free consultation about your hair care needs',
                'duration_minutes': 15,
                'price': 0.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&h=600&fit=crop'
            },
            {
                'name': 'Wedding Package',
                'description': 'Complete wedding day hair and styling package',
                'duration_minutes': 120,
                'price': 150.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'
            },
            {
                'name': 'Hair Extensions',
                'description': 'Professional hair extensions installation',
                'duration_minutes': 180,
                'price': 200.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop'
            },
            {
                'name': 'Hair Perm',
                'description': 'Professional hair perming service',
                'duration_minutes': 120,
                'price': 85.00,
                'address': '123 Main Street, Downtown District, Floor 2, Suite 201',
                'image_url': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=600&fit=crop'
            }
        ]
        
        for service_data in services_data:
            existing = Service.query.filter_by(name=service_data['name']).first()
            if not existing:
                service = Service(**service_data)
                db.session.add(service)
            else:
                # Update existing service with address and image if missing
                if not existing.address:
                    existing.address = service_data.get('address')
                if not existing.image_url:
                    existing.image_url = service_data.get('image_url')
        
        db.session.commit()
        print(f"Created/Updated {len(services_data)} services")
        
        # Create working hours (Monday to Friday, 9 AM - 6 PM)
        days = [
            (0, 'Monday'),
            (1, 'Tuesday'),
            (2, 'Wednesday'),
            (3, 'Thursday'),
            (4, 'Friday')
        ]
        
        for day_num, day_name in days:
            existing = WorkingHours.query.filter_by(day_of_week=day_num).first()
            if not existing:
                working_hours = WorkingHours(
                    day_of_week=day_num,
                    start_time=time(9, 0),
                    end_time=time(18, 0),
                    is_available=True
                )
                db.session.add(working_hours)
        
        # Saturday (10 AM - 4 PM)
        saturday = WorkingHours.query.filter_by(day_of_week=5).first()
        if not saturday:
            working_hours = WorkingHours(
                day_of_week=5,
                start_time=time(10, 0),
                end_time=time(16, 0),
                is_available=True
            )
            db.session.add(working_hours)
        
        db.session.commit()
        print("Created working hours")
        
        print("\nDatabase seeding completed!")
        print("\nDemo accounts:")
        print("Admin: admin@bookease.com / admin123")
        print("Client: client@example.com / client123")
        print(f"\nTotal services available: {len(services_data)}")

if __name__ == '__main__':
    seed_database()
