import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database import SessionLocal
from backend.models.user import User

def register_user(name, email, phone, password, role='customer'):
    db = SessionLocal()
    try:
        email_clean = email.strip().lower()
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            return {'success': False, 'message': 'Email is already registered.'}, 400

        user_id = f"USR-{uuid.uuid4().hex[:6].upper()}"
        hashed_pw = generate_password_hash(password)
        new_user = User(
            id=user_id,
            name=name.strip(),
            email=email_clean,
            phone=phone.strip(),
            password=hashed_pw,
            role=role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {'success': True, 'user': new_user.to_dict()}, 201
    except Exception as e:
        db.rollback()
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close()

def login_user(email, password):
    db = SessionLocal()
    try:
        email_clean = email.strip().lower()
        user = db.query(User).filter(User.email == email_clean).first()
        if not user:
            return {'success': False, 'message': 'No user found with this email address.'}, 401

        # Check password with werkzeug or direct fallback if plain text for demo users
        is_valid = check_password_hash(user.password, password)
        if not is_valid and user.password == password:
            is_valid = True

        if not is_valid:
            return {'success': False, 'message': 'Invalid password entered.'}, 401

        return {'success': True, 'user': user.to_dict()}, 200
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close()

def get_user_by_id(user_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return user.to_dict()
        return None
    finally:
        db.close()

def update_user_details(user_id=None, email=None, updates=None):
    if not updates:
        updates = {}
    db = SessionLocal()
    try:
        user = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
        if not user and email:
            user = db.query(User).filter(User.email == email.strip().lower()).first()
        if not user:
            # Fallback for admin if not in SQL database yet: create admin record
            if (updates.get('role') == 'admin') or (user_id and 'USR-003' in str(user_id)) or (email and 'admin' in str(email)):
                new_id = user_id or f"USR-{uuid.uuid4().hex[:6].upper()}"
                hashed_pw = generate_password_hash(updates.get('password') or 'password123')
                user = User(
                    id=new_id,
                    name=(updates.get('fullName') or updates.get('name') or 'System Administrator').strip(),
                    email=(email or updates.get('email') or 'admin@airline.com').strip().lower(),
                    phone=(updates.get('phone') or '+91 99999 00000').strip(),
                    password=hashed_pw,
                    role='admin'
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                return {'success': True, 'user': user.to_dict(), 'message': 'Admin details created and saved.'}, 200
            return {'success': False, 'message': 'User not found in backend database.'}, 404

        orig_role = user.role
        if updates.get('fullName') or updates.get('name'):
            user.name = (updates.get('fullName') or updates.get('name')).strip()
        if updates.get('phone'):
            user.phone = updates.get('phone').strip()
        if updates.get('email'):
            user.email = updates.get('email').strip().lower()
        if updates.get('password'):
            user.password = generate_password_hash(updates.get('password'))
        # Preserve role strictly (name change or update must never alter admin status)
        user.role = orig_role

        db.commit()
        db.refresh(user)
        return {'success': True, 'user': user.to_dict(), 'message': 'Details updated successfully.'}, 200
    except Exception as e:
        db.rollback()
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close()

def login_admin(email_or_username, password):
    db = SessionLocal()
    try:
        clean = email_or_username.strip().lower()
        user = db.query(User).filter(
            (User.email == clean) |
            (User.id == email_or_username.strip()) |
            (User.name == email_or_username.strip())
        ).first()

        # If not found by exact match and input is 'admin', search by role='admin'
        if not user and clean == 'admin':
            user = db.query(User).filter(User.role == 'admin').first()

        if not user:
            return {'success': False, 'message': 'No administrator account found with these credentials.'}, 401

        # Enforce backend admin authorization
        if user.role != 'admin':
            return {
                'success': False,
                'message': f'Access Denied: Account "{user.name}" is registered as "{user.role.upper()}". Only authorized airline administrators can access this portal.'
            }, 403

        is_valid = check_password_hash(user.password, password)
        if not is_valid and user.password == password:
            is_valid = True

        if not is_valid:
            return {'success': False, 'message': 'Invalid administrator password entered.'}, 401

        return {'success': True, 'user': user.to_dict()}, 200
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500
    finally:
        db.close()

def is_admin_user(user_id=None, email=None):
    db = SessionLocal()
    try:
        user = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
        if not user and email:
            user = db.query(User).filter(User.email == email.strip().lower()).first()
        return bool(user and user.role == 'admin')
    finally:
        db.close()

def get_all_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return [u.to_dict() for u in users]
    finally:
        db.close()


