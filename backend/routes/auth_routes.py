from flask import Blueprint, request, jsonify, session
from backend.services.auth_service import (
    register_user,
    login_user,
    login_admin,
    is_admin_user,
    get_all_users,
    get_user_by_id,
    update_user_details
)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    name = data.get('name') or data.get('fullName')
    email = data.get('email')
    phone = data.get('phone') or '9876543210'
    password = data.get('password')
    # Public customer registration must always be customer role
    role = 'customer'

    if not name or not email or not password:
        return jsonify({'success': False, 'message': 'Name, email, and password are required.'}), 400

    result, status_code = register_user(name, email, phone, password, role)
    if result.get('success'):
        session['user_id'] = result['user']['id']
    return jsonify(result), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    email = data.get('email') or data.get('username')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email/Username and password are required.'}), 400

    result, status_code = login_user(email, password)
    if result.get('success'):
        session['user_id'] = result['user']['id']
    return jsonify(result), status_code

@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    email_or_username = data.get('email') or data.get('username')
    password = data.get('password')

    if not email_or_username or not password:
        return jsonify({'success': False, 'message': 'Username/Email and password are required.'}), 400

    result, status_code = login_admin(email_or_username, password)
    if result.get('success'):
        session['user_id'] = result['user']['id']
        session['is_admin'] = True
    return jsonify(result), status_code

@auth_bp.route('/logout', methods=['POST', 'GET'])
def logout():
    session.pop('user_id', None)
    session.pop('is_admin', None)
    return jsonify({'success': True, 'message': 'Logged out successfully.'})

@auth_bp.route('/me', methods=['GET'])
def current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False, 'user': None})
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({'authenticated': False, 'user': None})
    return jsonify({'authenticated': True, 'user': user})

@auth_bp.route('/admin/settings', methods=['POST'])
def save_admin_settings():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    user_id = data.get('userId') or data.get('id') or session.get('user_id')
    email = data.get('email') or 'admin@airline.com'

    # Backend Authorization Enforcement: verify requester is authorized administrator
    if not is_admin_user(user_id=user_id, email=email):
        return jsonify({
            'success': False,
            'message': 'Forbidden: Administrator privileges required to access and update admin settings.'
        }), 403

    updates = {
        'fullName': data.get('fullName') or data.get('name'),
        'email': email,
        'phone': data.get('phone'),
        'password': data.get('password'),
        'department': data.get('department'),
        'office': data.get('office')
    }
    result, status_code = update_user_details(user_id=user_id, email=email, updates=updates)
    return jsonify(result), status_code

@auth_bp.route('/admin/users', methods=['GET'])
def list_system_users():
    user_id = request.args.get('userId') or session.get('user_id')
    email = request.args.get('email')

    # Enforce backend admin authorization
    if not is_admin_user(user_id=user_id, email=email) and not session.get('is_admin'):
        return jsonify({
            'success': False,
            'message': 'Forbidden: Only authorized airline administrators can inspect registered users.'
        }), 403

    users = get_all_users()
    return jsonify({'success': True, 'users': users})

@auth_bp.route('/profile', methods=['POST'])
def update_profile():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    user_id = data.get('userId') or data.get('id') or session.get('user_id')
    email = data.get('email')

    updates = {
        'fullName': data.get('fullName') or data.get('name'),
        'email': email,
        'phone': data.get('phone'),
        'password': data.get('password')
    }
    result, status_code = update_user_details(user_id=user_id, email=email, updates=updates)
    return jsonify(result), status_code

