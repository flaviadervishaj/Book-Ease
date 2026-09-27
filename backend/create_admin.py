"""Create or update an administrator using an interactive, trusted shell."""

from getpass import getpass

from app import app
from models import db, User


def main():
    email = input('Admin email: ').strip().lower()
    password = getpass('New password (at least 12 characters): ')
    if not email or '@' not in email or len(password) < 12:
        raise SystemExit('Enter a valid email and a password of at least 12 characters.')

    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if user is None:
            user = User(email=email)
            db.session.add(user)
        user.role = 'admin'
        user.set_password(password)
        db.session.commit()
    print('Administrator account saved.')


if __name__ == '__main__':
    main()
