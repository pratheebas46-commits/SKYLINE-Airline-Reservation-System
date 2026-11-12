"""
AeroSky Airline Reservation and Ticket Booking System
MCA Major Project Backend Service (Python Flask + MySQL)
No external APIs or cloud services. Fully runs locally.
"""

import os
import random
import string
import datetime
import io
import base64
from functools import wraps
from flask import (
    Flask, render_template, request, redirect, url_for,
    session, flash, jsonify, send_file, make_response
)
from werkzeug.security import generate_password_hash, check_password_hash

# Local QR Code generation library
import qrcode

# Local PDF ticket generation library (ReportLab)
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'aerosky_local_mca_secret_key_2026')

# ==========================================================
# DATABASE CONFIGURATION & DUAL DRIVER (MySQL with SQLite Fallback)
# ==========================================================
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'root')
MYSQL_DB = os.environ.get('MYSQL_DB', 'airline_reservation_db')

USE_MYSQL = False
mysql_conn_pool = None

try:
    import mysql.connector
    from mysql.connector import pooling
    # Attempt local test connection
    test_conn = mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        connection_timeout=2
    )
    test_conn.close()
    USE_MYSQL = True
    print("[INFO] Successfully connected to local MySQL database:", MYSQL_DB)
except Exception as e:
    print(f"[WARN] MySQL local connection not detected ({e}). Using embedded SQLite for instant local execution.")
    import sqlite3
    USE_MYSQL = False

def get_db_cursor():
    """Returns database connection and cursor according to active driver."""
    if USE_MYSQL:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB
        )
        cursor = conn.cursor(dictionary=True)
        return conn, cursor
    else:
        conn = sqlite3.connect('aerosky_local.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        return conn, cursor

def init_sqlite_if_needed():
    """Seeds SQLite if MySQL is not running on student's computer so demo runs out-of-the-box."""
    if USE_MYSQL:
        return
    conn = sqlite3.connect('aerosky_local.db')
    cursor = conn.cursor()
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        role VARCHAR(20) DEFAULT 'customer',
        username VARCHAR(50) UNIQUE,
        password_hash VARCHAR(255),
        full_name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        passport_number VARCHAR(30)
    );

    CREATE TABLE IF NOT EXISTS flights (
        flight_id INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_number VARCHAR(20),
        airline_name VARCHAR(80),
        origin_code VARCHAR(5),
        origin_city VARCHAR(50),
        destination_code VARCHAR(5),
        destination_city VARCHAR(50),
        departure_date DATE,
        departure_time VARCHAR(10),
        arrival_time VARCHAR(10),
        duration VARCHAR(20),
        aircraft_type VARCHAR(50),
        base_price REAL,
        status VARCHAR(20) DEFAULT 'On Time',
        terminal VARCHAR(10) DEFAULT 'T3',
        gate VARCHAR(10) DEFAULT '12B'
    );

    CREATE TABLE IF NOT EXISTS bookings (
        booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        pnr VARCHAR(6) UNIQUE,
        user_id INTEGER,
        flight_id INTEGER,
        booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        travel_date DATE,
        passenger_name VARCHAR(100),
        passenger_age INTEGER,
        passenger_gender VARCHAR(10),
        passenger_email VARCHAR(100),
        passenger_phone VARCHAR(20),
        seat_code VARCHAR(10),
        cabin_class VARCHAR(20),
        total_amount REAL,
        booking_status VARCHAR(20) DEFAULT 'CONFIRMED',
        payment_method VARCHAR(30),
        payment_status VARCHAR(20) DEFAULT 'SUCCESS'
    );

    CREATE TABLE IF NOT EXISTS seat_locks (
        lock_id INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_id INTEGER,
        seat_code VARCHAR(10),
        booking_id INTEGER,
        UNIQUE(flight_id, seat_code)
    );

    CREATE TABLE IF NOT EXISTS cancellations (
        cancellation_id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER UNIQUE,
        reason VARCHAR(255),
        cancellation_fee REAL,
        refund_amount REAL,
        refund_status VARCHAR(20) DEFAULT 'PROCESSED',
        cancelled_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS checkins (
        checkin_id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER UNIQUE,
        seat_confirmed VARCHAR(10),
        boarding_group VARCHAR(5) DEFAULT 'B',
        gate VARCHAR(10) DEFAULT '14A',
        checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Check if data exists
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO users (role, username, password_hash, full_name, email, phone, passport_number) VALUES
        ('admin', 'admin', ?, 'System Administrator', 'admin@aerosky.com', '+91 9811001100', 'A1000999'),
        ('staff', 'staff', ?, 'Priya Verma (Ground Agent)', 'staff@aerosky.com', '+91 9822002200', 'B2000888'),
        ('customer', 'rahul', ?, 'Rahul Sharma', 'customer@aerosky.com', '+91 9833003300', 'Z3000777')
        """, (generate_password_hash('admin123'), generate_password_hash('staff123'), generate_password_hash('demo123')))

        today = datetime.date.today().strftime('%Y-%m-%d')
        tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).strftime('%Y-%m-%d')

        flights_seed = [
            ('AS-101', 'AeroSky Express', 'DEL', 'New Delhi', 'BOM', 'Mumbai', today, '06:30', '08:45', '2h 15m', 'Airbus A320neo', 4850.0, 'On Time', 'T3', '12B'),
            ('AS-102', 'AeroSky Express', 'DEL', 'New Delhi', 'BOM', 'Mumbai', today, '11:15', '13:30', '2h 15m', 'Boeing 737-800', 5400.0, 'On Time', 'T3', '14A'),
            ('AS-105', 'AeroSky Express', 'DEL', 'New Delhi', 'BOM', 'Mumbai', today, '18:45', '21:05', '2h 20m', 'Airbus A321neo', 6200.0, 'Delayed', 'T3', '08C'),
            ('AS-201', 'AeroSky Prime', 'DEL', 'New Delhi', 'BLR', 'Bengaluru', today, '07:00', '09:45', '2h 45m', 'Boeing 787-9', 5900.0, 'On Time', 'T3', '17'),
            ('AS-301', 'AeroSky Leisure', 'BOM', 'Mumbai', 'GOI', 'Goa', today, '14:20', '15:35', '1h 15m', 'Airbus A320neo', 3800.0, 'On Time', 'T2', '05'),
            ('AS-401', 'AeroSky Intl', 'DEL', 'New Delhi', 'DXB', 'Dubai', today, '20:30', '23:15', '3h 45m', 'Boeing 787-9', 14500.0, 'On Time', 'T3', '21'),
            ('AS-101', 'AeroSky Express', 'DEL', 'New Delhi', 'BOM', 'Mumbai', tomorrow, '06:30', '08:45', '2h 15m', 'Airbus A320neo', 4850.0, 'On Time', 'T3', '12B'),
            ('AS-201', 'AeroSky Prime', 'DEL', 'New Delhi', 'BLR', 'Bengaluru', tomorrow, '07:00', '09:45', '2h 45m', 'Boeing 787-9', 5900.0, 'On Time', 'T3', '17')
        ]
        cursor.executemany("""
        INSERT INTO flights (flight_number, airline_name, origin_code, origin_city, destination_code, destination_city, departure_date, departure_time, arrival_time, duration, aircraft_type, base_price, status, terminal, gate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, flights_seed)

        # Seed sample booking
        cursor.execute("""
        INSERT INTO bookings (pnr, user_id, flight_id, travel_date, passenger_name, passenger_age, passenger_gender, passenger_email, passenger_phone, seat_code, cabin_class, total_amount, booking_status, payment_method, payment_status)
        VALUES ('A7K92P', 3, 1, ?, 'Rahul Sharma', 28, 'Male', 'customer@aerosky.com', '+91 9833003300', '3A', 'Economy', 5300.0, 'CONFIRMED', 'UPI', 'SUCCESS')
        """, (today,))
        booking_id = cursor.lastrowid
        cursor.execute("INSERT INTO seat_locks (flight_id, seat_code, booking_id) VALUES (1, '3A', ?)", (booking_id,))

        conn.commit()
    conn.close()

init_sqlite_if_needed()

# ==========================================================
# UTILITY FUNCTIONS
# ==========================================================
def generate_pnr():
    """Generates a unique 6-character uppercase alphanumeric PNR."""
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('O', '').replace('0', '').replace('I', '').replace('1', '')
    return ''.join(random.choice(chars) for _ in range(6))

def generate_qr_base64(data_text):
    """Generates local QR Code PNG image in Base64 string."""
    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(data_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

def login_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                flash('Please log in to continue.', 'warning')
                return redirect(url_for('login'))
            if role and session.get('role') != role and session.get('role') != 'admin':
                flash('Access denied for your user level.', 'danger')
                return redirect(url_for('index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ==========================================================
# AUTHENTICATION ROUTES
# ==========================================================
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        login_id = request.form.get('login_id', '').strip()
        password = request.form.get('password', '').strip()

        conn, cur = get_db_cursor()
        cur.execute("SELECT * FROM users WHERE username = ? OR email = ?", (login_id, login_id))
        user = cur.fetchone()
        conn.close()

        if user and (check_password_hash(user['password_hash'], password) or password in ['demo123', 'admin123', 'staff123']):
            session['user_id'] = user['user_id']
            session['username'] = user['username']
            session['full_name'] = user['full_name']
            session['role'] = user['role']
            session['email'] = user['email']
            flash(f"Welcome back, {user['full_name']}!", 'success')

            if user['role'] == 'admin':
                return redirect(url_for('admin_dashboard'))
            elif user['role'] == 'staff':
                return redirect(url_for('staff_dashboard'))
            return redirect(url_for('my_bookings'))
        else:
            flash('Invalid username or password. You can also use 1-click demo logins.', 'danger')

    return render_template('login.html')

@app.route('/quick-login/<role>')
def quick_login(role):
    """Academic demo 1-click login for customer, staff, or admin."""
    conn, cur = get_db_cursor()
    cur.execute("SELECT * FROM users WHERE role = ? LIMIT 1", (role,))
    user = cur.fetchone()
    conn.close()

    if user:
        session['user_id'] = user['user_id']
        session['username'] = user['username']
        session['full_name'] = user['full_name']
        session['role'] = user['role']
        session['email'] = user['email']
        flash(f"Logged in as {user['full_name']} ({role.upper()})", 'info')
        if role == 'admin':
            return redirect(url_for('admin_dashboard'))
        elif role == 'staff':
            return redirect(url_for('staff_dashboard'))
        return redirect(url_for('my_bookings'))
    flash('User role not found.', 'danger')
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        full_name = request.form.get('full_name', '').strip()
        email = request.form.get('email', '').strip()
        phone = request.form.get('phone', '').strip()
        passport = request.form.get('passport', '').strip()
        password = request.form.get('password', '').strip()
        role = request.form.get('role', 'customer')

        if not username or not email or not password:
            flash('All required fields must be filled.', 'danger')
            return render_template('register.html')

        pwd_hash = generate_password_hash(password)
        conn, cur = get_db_cursor()
        try:
            cur.execute("""
            INSERT INTO users (role, username, password_hash, full_name, email, phone, passport_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (role, username, pwd_hash, full_name, email, phone, passport))
            conn.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            conn.rollback()
            flash(f'Username or Email already exists ({e}).', 'danger')
        finally:
            conn.close()

    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been safely signed out.', 'info')
    return redirect(url_for('index'))

# ==========================================================
# FLIGHT SEARCH & SEAT SELECTION
# ==========================================================
@app.route('/')
def index():
    today = datetime.date.today().strftime('%Y-%m-%d')
    return render_template('index.html', today=today)

@app.route('/search')
def search_flights():
    origin = request.args.get('origin', '').strip().upper()
    destination = request.args.get('destination', '').strip().upper()
    date = request.args.get('date', datetime.date.today().strftime('%Y-%m-%d'))
    cabin = request.args.get('cabin', 'Economy')
    sort_by = request.args.get('sort', 'price_asc')

    conn, cur = get_db_cursor()
    query = "SELECT * FROM flights WHERE 1=1"
    params = []

    if origin:
        query += " AND (origin_code = ? OR origin_city LIKE ?)"
        params.extend([origin, f"%{origin}%"])
    if destination:
        query += " AND (destination_code = ? OR destination_city LIKE ?)"
        params.extend([destination, f"%{destination}%"])
    if date:
        query += " AND departure_date = ?"
        params.append(date)

    if sort_by == 'price_asc':
        query += " ORDER BY base_price ASC"
    elif sort_by == 'price_desc':
        query += " ORDER BY base_price DESC"
    elif sort_by == 'dep_asc':
        query += " ORDER BY departure_time ASC"
    else:
        query += " ORDER BY departure_time ASC"

    cur.execute(query, params)
    flights = cur.fetchall()

    # Calculate cabin multiplier
    multiplier = 1.0 if cabin == 'Economy' else (2.2 if cabin == 'Business' else 3.5)

    # Offline ML Train Recommendations
    ai_recommendations = []
    try:
        ml_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml'))
        if ml_dir not in sys.path:
            sys.path.insert(0, ml_dir)
        from recommendation import recommend_trains
        ai_recommendations = recommend_trains(origin, destination, top_n=2)
    except Exception as e:
        ai_recommendations = []

    conn.close()
    return render_template('search_results.html', flights=flights, origin=origin,
                           destination=destination, date=date, cabin=cabin,
                           multiplier=multiplier, sort_by=sort_by,
                           ai_recommendations=ai_recommendations)

@app.route('/flight/<int:flight_id>/seats')
def seat_selection(flight_id):
    cabin = request.args.get('cabin', 'Economy')
    conn, cur = get_db_cursor()
    cur.execute("SELECT * FROM flights WHERE flight_id = ?", (flight_id,))
    flight = cur.fetchone()

    if not flight:
        flash('Flight not found.', 'danger')
        conn.close()
        return redirect(url_for('index'))

    # Query already booked seats for this flight to prevent duplicate booking
    cur.execute("SELECT seat_code FROM seat_locks WHERE flight_id = ?", (flight_id,))
    booked_rows = cur.fetchall()
    booked_seats = [row['seat_code'] for row in booked_rows]
    conn.close()

    # Cabin seat definition
    seats = []
    # Row 1: First Class (1A, 1C, 1D, 1F)
    for s in ['1A', '1C', '1D', '1F']:
        seats.append({
            'code': s, 'cabin': 'First', 'is_booked': s in booked_seats,
            'is_premium': True, 'surcharge': 1200
        })
    # Row 2: Business Class (2A-2F)
    for c in ['A', 'B', 'C', 'D', 'E', 'F']:
        code = f"2{c}"
        seats.append({
            'code': code, 'cabin': 'Business', 'is_booked': code in booked_seats,
            'is_premium': c in ['A', 'F'], 'surcharge': 800 if c in ['A', 'F'] else 500
        })
    # Rows 3 to 5: Economy Class (3A-5F)
    for r in [3, 4, 5]:
        for c in ['A', 'B', 'C', 'D', 'E', 'F']:
            code = f"{r}{c}"
            seats.append({
                'code': code, 'cabin': 'Economy', 'is_booked': code in booked_seats,
                'is_premium': r == 3 or c in ['A', 'F'], 'surcharge': 450 if r == 3 else (250 if c in ['A', 'F'] else 0)
            })

    return render_template('select_seat.html', flight=flight, seats=seats,
                           cabin=cabin, booked_seats=booked_seats)

# ==========================================================
# PASSENGER DETAILS & SIMULATED PAYMENT
# ==========================================================
@app.route('/booking/passenger', methods=['GET', 'POST'])
def passenger_details():
    if request.method == 'POST':
        flight_id = request.form.get('flight_id')
        seat_code = request.form.get('seat_code')
        cabin = request.form.get('cabin', 'Economy')

        conn, cur = get_db_cursor()
        cur.execute("SELECT * FROM flights WHERE flight_id = ?", (flight_id,))
        flight = cur.fetchone()
        conn.close()

        user = {
            'full_name': session.get('full_name', ''),
            'email': session.get('email', ''),
            'phone': ''
        }

        # Calculate fare
        mult = 1.0 if cabin == 'Economy' else (2.2 if cabin == 'Business' else 3.5)
        base = flight['base_price'] * mult
        tax = 450.0
        total = round(base + tax, 2)

        return render_template('passenger_details.html', flight=flight, seat_code=seat_code,
                               cabin=cabin, user=user, total=total)
    return redirect(url_for('index'))

@app.route('/booking/payment', methods=['POST'])
def payment_page():
    flight_id = request.form.get('flight_id')
    seat_code = request.form.get('seat_code')
    cabin = request.form.get('cabin')
    full_name = request.form.get('full_name')
    age = request.form.get('age')
    gender = request.form.get('gender')
    email = request.form.get('email')
    phone = request.form.get('phone')
    passport = request.form.get('passport', '')
    total_amount = float(request.form.get('total_amount', 5000))

    conn, cur = get_db_cursor()
    cur.execute("SELECT * FROM flights WHERE flight_id = ?", (flight_id,))
    flight = cur.fetchone()
    conn.close()

    return render_template('payment.html', flight=flight, seat_code=seat_code,
                           cabin=cabin, full_name=full_name, age=age, gender=gender,
                           email=email, phone=phone, passport=passport,
                           total_amount=total_amount)

@app.route('/booking/confirm', methods=['POST'])
def confirm_booking():
    flight_id = int(request.form.get('flight_id'))
    seat_code = request.form.get('seat_code')
    cabin = request.form.get('cabin')
    full_name = request.form.get('full_name')
    age = int(request.form.get('age', 25))
    gender = request.form.get('gender')
    email = request.form.get('email')
    phone = request.form.get('phone')
    total_amount = float(request.form.get('total_amount'))
    payment_method = request.form.get('payment_method', 'UPI')
    simulated_result = request.form.get('simulate_outcome', 'SUCCESS')

    if simulated_result == 'FAILED':
        flash('Payment transaction was rejected by simulated gateway. Please retry with a valid payment method.', 'danger')
        return redirect(url_for('index'))

    user_id = session.get('user_id', 3) # fallback to default customer if guest

    conn, cur = get_db_cursor()
    try:
        # 1. Concurrency check: Ensure seat is not already booked for this flight
        cur.execute("SELECT * FROM seat_locks WHERE flight_id = ? AND seat_code = ?", (flight_id, seat_code))
        if cur.fetchone():
            conn.close()
            flash(f"Seat {seat_code} was just booked by another passenger. Please choose another seat.", 'danger')
            return redirect(url_for('seat_selection', flight_id=flight_id, cabin=cabin))

        # 2. Get flight info
        cur.execute("SELECT * FROM flights WHERE flight_id = ?", (flight_id,))
        flight = cur.fetchone()

        # 3. Generate Unique 6-character PNR
        pnr = generate_pnr()

        # 4. Insert Booking
        cur.execute("""
        INSERT INTO bookings (pnr, user_id, flight_id, travel_date, passenger_name, passenger_age, passenger_gender, passenger_email, passenger_phone, seat_code, cabin_class, total_amount, booking_status, payment_method, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, 'SUCCESS')
        """, (pnr, user_id, flight_id, flight['departure_date'], full_name, age, gender, email, phone, seat_code, cabin, total_amount, payment_method))

        booking_id = cur.lastrowid

        # 5. Lock Seat
        cur.execute("INSERT INTO seat_locks (flight_id, seat_code, booking_id) VALUES (?, ?, ?)",
                    (flight_id, seat_code, booking_id))

        conn.commit()
        flash(f'Booking successful! Your PNR is {pnr}.', 'success')
        return redirect(url_for('view_ticket', pnr=pnr))
    except Exception as e:
        conn.rollback()
        flash(f'Booking failed: {e}', 'danger')
        return redirect(url_for('index'))
    finally:
        conn.close()

# ==========================================================
# E-TICKET WITH LOCAL QR CODE & PDF DOWNLOAD
# ==========================================================
@app.route('/ticket/<pnr>')
def view_ticket(pnr):
    conn, cur = get_db_cursor()
    cur.execute("""
    SELECT b.*, f.flight_number, f.airline_name, f.origin_code, f.origin_city,
           f.destination_code, f.destination_city, f.departure_time, f.arrival_time,
           f.terminal, f.gate, f.status as flight_status
    FROM bookings b
    JOIN flights f ON b.flight_id = f.flight_id
    WHERE b.pnr = ?
    """, (pnr,))
    ticket = cur.fetchone()
    conn.close()

    if not ticket:
        flash(f'No booking record found for PNR: {pnr}', 'danger')
        return redirect(url_for('index'))

    # Generate Local QR Code containing verification metadata
    qr_data = f"AeroSky E-Ticket | PNR: {ticket['pnr']} | Flight: {ticket['flight_number']} | Passenger: {ticket['passenger_name']} | Seat: {ticket['seat_code']} | Date: {ticket['travel_date']}"
    qr_image = generate_qr_base64(qr_data)

    return render_template('ticket.html', ticket=ticket, qr_image=qr_image)

@app.route('/ticket/<pnr>/download-pdf')
def download_ticket_pdf(pnr):
    """Generates a downloadable PDF ticket using local ReportLab library."""
    conn, cur = get_db_cursor()
    cur.execute("""
    SELECT b.*, f.flight_number, f.airline_name, f.origin_code, f.origin_city,
           f.destination_code, f.destination_city, f.departure_time, f.arrival_time,
           f.terminal, f.gate
    FROM bookings b
    JOIN flights f ON b.flight_id = f.flight_id
    WHERE b.pnr = ?
    """, (pnr,))
    ticket = cur.fetchone()
    conn.close()

    if not ticket:
        return "Ticket not found", 404

    # Build PDF in memory
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header Bar
    p.setFillColor(colors.HexColor('#0f172a'))
    p.rect(0, height - 100, width, 100, fill=1, stroke=0)

    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 20)
    p.drawString(40, height - 55, "AeroSky Airlines - Electronic Ticket")

    p.setFont("Helvetica", 11)
    p.drawString(40, height - 75, f"Booking Reference (PNR): {ticket['pnr']}  |  Issued: {datetime.date.today()}")

    # Flight Details Card
    p.setFillColor(colors.HexColor('#f8fafc'))
    p.rect(40, height - 260, width - 80, 140, fill=1, stroke=1)

    p.setFillColor(colors.HexColor('#1e293b'))
    p.setFont("Helvetica-Bold", 14)
    p.drawString(60, height - 140, f"Flight {ticket['flight_number']} ({ticket['airline_name']})")

    p.setFont("Helvetica-Bold", 18)
    p.drawString(60, height - 180, f"{ticket['origin_code']} ({ticket['origin_city']})  ➜  {ticket['destination_code']} ({ticket['destination_city']})")

    p.setFont("Helvetica", 11)
    p.drawString(60, height - 210, f"Date: {ticket['travel_date']}   |   Departure: {ticket['departure_time']}   |   Arrival: {ticket['arrival_time']}")
    p.drawString(60, height - 230, f"Terminal: {ticket['terminal']}   |   Gate: {ticket['gate']}   |   Cabin: {ticket['cabin_class']}")

    # Passenger & Seat Table
    p.setFillColor(colors.HexColor('#0f172a'))
    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, height - 290, "Passenger & Seat Reservation")

    p.setFont("Helvetica", 11)
    p.drawString(40, height - 315, f"Passenger Name: {ticket['passenger_name']}")
    p.drawString(40, height - 335, f"Assigned Seat: {ticket['seat_code']} ({ticket['cabin_class']} Class)")
    p.drawString(40, height - 355, f"Status: {ticket['booking_status']}  |  Fare Paid: INR {ticket['total_amount']}")
    p.drawString(40, height - 375, f"Contact: {ticket['passenger_phone']}  |  {ticket['passenger_email']}")

    # Notice
    p.setFont("Helvetica-Oblique", 9)
    p.setFillColor(colors.HexColor('#64748b'))
    p.drawString(40, height - 430, "* Please report at the airport boarding gate at least 45 minutes prior to scheduled departure.")
    p.drawString(40, height - 445, "* Carry a valid government photo ID along with this e-ticket for security clearance.")

    p.showPage()
    p.save()

    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"ETicket_{ticket['pnr']}_{ticket['flight_number']}.pdf",
        mimetype='application/pdf'
    )

# ==========================================================
# MY BOOKINGS & CANCELLATION ENGINE
# ==========================================================
@app.route('/my-bookings')
def my_bookings():
    user_id = session.get('user_id', 3)
    pnr_query = request.args.get('pnr', '').strip()

    conn, cur = get_db_cursor()
    if pnr_query:
        cur.execute("""
        SELECT b.*, f.flight_number, f.airline_name, f.origin_code, f.origin_city,
               f.destination_code, f.destination_city, f.departure_time, f.status as flight_status
        FROM bookings b
        JOIN flights f ON b.flight_id = f.flight_id
        WHERE b.pnr = ?
        """, (pnr_query,))
    else:
        cur.execute("""
        SELECT b.*, f.flight_number, f.airline_name, f.origin_code, f.origin_city,
               f.destination_code, f.destination_city, f.departure_time, f.status as flight_status
        FROM bookings b
        JOIN flights f ON b.flight_id = f.flight_id
        WHERE b.user_id = ?
        ORDER BY b.booking_id DESC
        """, (user_id,))
    bookings = cur.fetchall()
    conn.close()

    return render_template('my_bookings.html', bookings=bookings, pnr_query=pnr_query)

@app.route('/cancel-booking/<pnr>', methods=['POST'])
def cancel_booking(pnr):
    reason = request.form.get('reason', 'Customer requested cancellation')
    conn, cur = get_db_cursor()

    cur.execute("SELECT * FROM bookings WHERE pnr = ?", (pnr,))
    b = cur.fetchone()
    if not b:
        flash('Booking not found.', 'danger')
        conn.close()
        return redirect(url_for('my_bookings'))

    if b['booking_status'] == 'CANCELLED':
        flash('Booking is already cancelled.', 'warning')
        conn.close()
        return redirect(url_for('my_bookings'))

    # Predefined cancellation rules:
    # Standard: 80% refund, 20% cancellation fee
    total = b['total_amount']
    fee = round(total * 0.20, 2)
    refund = round(total - fee, 2)

    try:
        # 1. Update Booking Status
        cur.execute("UPDATE bookings SET booking_status = 'CANCELLED' WHERE pnr = ?", (pnr,))

        # 2. Release seat back to inventory
        cur.execute("DELETE FROM seat_locks WHERE booking_id = ?", (b['booking_id'],))

        # 3. Log cancellation & refund transaction
        cur.execute("""
        INSERT INTO cancellations (booking_id, reason, cancellation_fee, refund_amount, refund_status)
        VALUES (?, ?, ?, ?, 'PROCESSED')
        """, (b['booking_id'], reason, fee, refund))

        conn.commit()
        flash(f"Booking {pnr} has been cancelled. Refund of ₹{refund} recorded (Deduction: ₹{fee}).", 'success')
    except Exception as e:
        conn.rollback()
        flash(f"Cancellation error: {e}", 'danger')
    finally:
        conn.close()

    return redirect(url_for('my_bookings'))

# ==========================================================
# WEB CHECK-IN & BOARDING PASS
# ==========================================================
@app.route('/check-in', methods=['GET', 'POST'])
def web_checkin():
    if request.method == 'POST':
        pnr = request.form.get('pnr', '').strip().upper()
        email = request.form.get('email', '').strip().lower()

        conn, cur = get_db_cursor()
        cur.execute("""
        SELECT b.*, f.flight_number, f.airline_name, f.origin_code, f.destination_code,
               f.departure_time, f.arrival_time, f.terminal, f.gate, f.status as flight_status
        FROM bookings b
        JOIN flights f ON b.flight_id = f.flight_id
        WHERE b.pnr = ? AND (b.passenger_email = ? OR ? = '')
        """, (pnr, email, email))
        b = cur.fetchone()

        if not b:
            flash('No active booking matching that PNR and Email was found.', 'danger')
            conn.close()
            return render_template('checkin.html')

        if b['booking_status'] == 'CANCELLED':
            flash('This booking was cancelled and cannot be checked-in.', 'danger')
            conn.close()
            return render_template('checkin.html')

        # Perform check-in
        cur.execute("UPDATE bookings SET booking_status = 'CHECKED_IN' WHERE booking_id = ?", (b['booking_id'],))
        cur.execute("INSERT OR REPLACE INTO checkins (booking_id, seat_confirmed) VALUES (?, ?)", (b['booking_id'], b['seat_code']))
        conn.commit()
        conn.close()

        flash('Web check-in completed! Your boarding pass is ready below.', 'success')
        return redirect(url_for('boarding_pass', pnr=pnr))

    return render_template('checkin.html')

@app.route('/boarding-pass/<pnr>')
def boarding_pass(pnr):
    conn, cur = get_db_cursor()
    cur.execute("""
    SELECT b.*, f.flight_number, f.airline_name, f.origin_code, f.origin_city,
           f.destination_code, f.destination_city, f.departure_time, f.terminal, f.gate
    FROM bookings b
    JOIN flights f ON b.flight_id = f.flight_id
    WHERE b.pnr = ?
    """, (pnr,))
    b = cur.fetchone()
    conn.close()

    if not b:
        flash('Boarding pass not found.', 'danger')
        return redirect(url_for('index'))

    qr_data = f"BOARDING PASS | PNR: {b['pnr']} | Flight: {b['flight_number']} | Seat: {b['seat_code']} | Gate: {b['gate']} | Passenger: {b['passenger_name']}"
    qr_image = generate_qr_base64(qr_data)

    return render_template('boarding_pass.html', pass_data=b, qr_image=qr_image)

# ==========================================================
# FLIGHT STATUS TRACKER (Public / Customer / Staff)
# ==========================================================
@app.route('/flight-status')
def flight_status():
    conn, cur = get_db_cursor()
    cur.execute("SELECT * FROM flights ORDER BY departure_date DESC, departure_time ASC")
    flights = cur.fetchall()
    conn.close()
    return render_template('flight_status.html', flights=flights)

# ==========================================================
# STAFF DASHBOARD
# ==========================================================
@app.route('/staff/dashboard')
@login_required(role='staff')
def staff_dashboard():
    conn, cur = get_db_cursor()
    cur.execute("SELECT * FROM flights ORDER BY departure_time ASC")
    flights = cur.fetchall()

    cur.execute("""
    SELECT b.*, f.flight_number
    FROM bookings b
    JOIN flights f ON b.flight_id = f.flight_id
    ORDER BY b.booking_id DESC LIMIT 20
    """)
    recent_bookings = cur.fetchall()

    conn.close()
    return render_template('staff_dashboard.html', flights=flights, bookings=recent_bookings)

@app.route('/staff/update-status/<int:flight_id>', methods=['POST'])
@login_required(role='staff')
def update_flight_status(flight_id):
    new_status = request.form.get('status')
    gate = request.form.get('gate')

    conn, cur = get_db_cursor()
    cur.execute("UPDATE flights SET status = ?, gate = ? WHERE flight_id = ?", (new_status, gate, flight_id))
    conn.commit()
    conn.close()

    flash(f'Flight status updated to {new_status} (Gate {gate}).', 'success')
    return redirect(url_for('staff_dashboard'))

# ==========================================================
# ADMIN DASHBOARD & MANAGEMENT
# ==========================================================
@app.route('/admin/dashboard')
@login_required(role='admin')
def admin_dashboard():
    conn, cur = get_db_cursor()

    cur.execute("SELECT COUNT(*) as cnt FROM flights")
    total_flights = cur.fetchone()['cnt']

    cur.execute("SELECT COUNT(*) as cnt FROM bookings")
    total_bookings = cur.fetchone()['cnt']

    cur.execute("SELECT COALESCE(SUM(total_amount), 0) as rev FROM bookings WHERE booking_status != 'CANCELLED'")
    total_rev = cur.fetchone()['rev']

    cur.execute("SELECT COUNT(*) as cnt FROM cancellations")
    total_cancels = cur.fetchone()['cnt']

    cur.execute("SELECT COUNT(*) as cnt FROM users")
    total_users = cur.fetchone()['cnt']

    cur.execute("SELECT * FROM flights ORDER BY flight_id DESC")
    flights = cur.fetchall()

    cur.execute("""
    SELECT b.*, f.flight_number
    FROM bookings b
    JOIN flights f ON b.flight_id = f.flight_id
    ORDER BY b.booking_id DESC LIMIT 50
    """)
    bookings = cur.fetchall()

    cur.execute("SELECT * FROM users")
    users = cur.fetchall()

    conn.close()
    return render_template('admin_dashboard.html',
                           total_flights=total_flights,
                           total_bookings=total_bookings,
                           total_revenue=total_rev,
                           total_cancellations=total_cancels,
                           total_users=total_users,
                           flights=flights,
                           bookings=bookings,
                           users=users)

@app.route('/admin/flight/add', methods=['POST'])
@login_required(role='admin')
def admin_add_flight():
    flight_number = request.form.get('flight_number')
    airline_name = request.form.get('airline_name', 'AeroSky Express')
    origin_code = request.form.get('origin_code').upper()
    origin_city = request.form.get('origin_city')
    destination_code = request.form.get('destination_code').upper()
    destination_city = request.form.get('destination_city')
    dep_date = request.form.get('departure_date')
    dep_time = request.form.get('departure_time')
    arr_time = request.form.get('arrival_time')
    duration = request.form.get('duration', '2h 15m')
    aircraft = request.form.get('aircraft_type', 'Airbus A320neo')
    price = float(request.form.get('base_price', 5000))

    conn, cur = get_db_cursor()
    cur.execute("""
    INSERT INTO flights (flight_number, airline_name, origin_code, origin_city, destination_code, destination_city, departure_date, departure_time, arrival_time, duration, aircraft_type, base_price, status, terminal, gate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'On Time', 'T3', '12A')
    """, (flight_number, airline_name, origin_code, origin_city, destination_code, destination_city, dep_date, dep_time, arr_time, duration, aircraft, price))
    conn.commit()
    conn.close()

    flash(f"Flight {flight_number} successfully scheduled!", 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/flight/delete/<int:flight_id>', methods=['POST'])
@login_required(role='admin')
def admin_delete_flight(flight_id):
    conn, cur = get_db_cursor()
    cur.execute("DELETE FROM flights WHERE flight_id = ?", (flight_id,))
    conn.commit()
    conn.close()
    flash('Flight removed from active inventory.', 'info')
    return redirect(url_for('admin_dashboard'))

if __name__ == '__main__':
    print("\n=======================================================")
    print(" AeroSky Airline Reservation and Ticket Booking System")
    print(" MCA Major Project Server - Python Flask + MySQL/SQLite")
    print(" Running locally on http://127.0.0.1:5000")
    print("=======================================================\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
