"""
Database Seed and Data Import Script
Populates MySQL / SQLite with:
1. Standard user accounts (Customer, Staff, Admin)
2. All train services from ml/train_data.csv + frontend dataset
3. Standard seat inventory across coach tiers
4. Sample verified bookings & ticket records
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import csv
import random
from werkzeug.security import generate_password_hash
from backend.database import SessionLocal, init_db
from backend.models.user import User
from backend.models.train import Train
from backend.models.seat import Seat
from backend.models.booking import Booking, BookingPassenger
from backend.models.passenger import Passenger
from backend.models.payment import Payment

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ML_CSV_PATH = os.path.join(PROJECT_ROOT, 'ml', 'train_data.csv')

def seed_users(db):
    users = [
        {
            'id': 'USR-003',
            'name': 'System Administrator',
            'email': 'admin@airline.com',
            'phone': '+91 99999 00000',
            'password': generate_password_hash('password123'),
            'role': 'admin'
        }
    ]

    count = 0
    for u in users:
        existing = db.query(User).filter(User.email == u['email']).first()
        if not existing:
            db.add(User(**u))
            count += 1
    db.commit()
    print(f"[SEED] Seeded {count} user records.")

def seed_trains(db):
    seeded_count = 0
    seats_count = 0

    if os.path.exists(ML_CSV_PATH):
        with open(ML_CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(row for row in f if not row.startswith('#'))
            seen_numbers = set()
            for r in reader:
                train_num = r['train_id'].strip()
                if train_num in seen_numbers:
                    continue
                seen_numbers.add(train_num)

                existing = db.query(Train).filter(Train.train_number == train_num).first()
                if not existing:
                    dep_hr = int(float(r['departure_hour']))
                    arr_hr = int(float(r['arrival_hour']))
                    dur_hrs = float(r['duration_hours'])
                    dur_str = f"{int(dur_hrs)}h {int((dur_hrs % 1) * 60)}m"
                    fare_val = float(r['fare'])

                    train_record = Train(
                        id=f"TRN-{train_num}",
                        train_number=train_num,
                        train_name=r['train_name'].strip(),
                        source=r['source'].strip().upper(),
                        destination=r['destination'].strip().upper(),
                        departure_time=f"{dep_hr:02d}:00",
                        arrival_time=f"{arr_hr:02d}:00",
                        journey_duration=dur_str,
                        train_type=r.get('train_type', 'Express').strip(),
                        status='On Time',
                        fare=fare_val,
                        available_seats=120
                    )
                    db.add(train_record)
                    seeded_count += 1

                    # Generate coach seats
                    for row_idx in range(1, 16):
                        for col in ['A', 'B', 'C', 'D', 'E', 'F']:
                            seat_no = f"{row_idx}{col}"
                            cls = 'First' if row_idx <= 2 else ('Business' if row_idx <= 6 else 'Economy')
                            multiplier = 2.4 if cls == 'First' else (1.6 if cls == 'Business' else 1.0)
                            seat = Seat(
                                id=f"SEAT-{train_num}-{seat_no}",
                                train_id=f"TRN-{train_num}",
                                class_type=cls,
                                seat_number=seat_no,
                                seat_status='available',
                                fare=round(fare_val * multiplier, 2)
                            )
                            db.add(seat)
                            seats_count += 1

            db.commit()
            print(f"[SEED] Seeded {seeded_count} trains from dataset with {seats_count} inventory seats.")

def seed_sample_bookings(db):
    # Genuine bookings are created by actual customer reservations.
    # No fake customer bookings are seeded.
    pass

def run_seed():
    print("[SEED] Initializing database schema...")
    init_db()
    db = SessionLocal()
    try:
        seed_users(db)
        seed_trains(db)
        seed_sample_bookings(db)
        print("[SEED] Database seeding complete and ready.")
    finally:
        db.close()

if __name__ == '__main__':
    run_seed()
