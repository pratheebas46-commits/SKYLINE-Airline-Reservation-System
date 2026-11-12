#!/usr/bin/env python3
"""
==============================================================================
DOMESTIC RAILWAY RESERVATION SYSTEM - DATABASE INITIALIZATION SCRIPT
Academic MCA Major Project
==============================================================================

Initializes the local MySQL database with SQLAlchemy declarative models:
  1. users
  2. trains
  3. seats
  4. passengers
  5. bookings
  6. booking_passengers
  7. payments
  8. cancellations

Usage:
  python3 init_mysql_db.py
  python3 init_mysql_db.py --host localhost --port 3306 --user root --password mypass --db railway_reservation_db
  python3 init_mysql_db.py --drop-existing   # Drops existing tables before recreating
  python3 init_mysql_db.py --show-ddl        # Prints MySQL CREATE TABLE DDL statements
  python3 init_mysql_db.py --sqlite-fallback # Falls back to local SQLite if MySQL is offline
==============================================================================
"""

import sys
import os
import argparse
from datetime import datetime
from decimal import Decimal

try:
    from sqlalchemy import (
        create_engine,
        Column,
        String,
        Integer,
        Numeric,
        DateTime,
        ForeignKey,
        Index,
        UniqueConstraint,
        text,
        inspect
    )
    from sqlalchemy.orm import declarative_base, relationship, sessionmaker
    from sqlalchemy.schema import CreateTable
except ImportError:
    print("[ERROR] SQLAlchemy is not installed.")
    print("Please install required dependencies: pip install sqlalchemy pymysql cryptography")
    sys.exit(1)

Base = declarative_base()

# ==============================================================================
# 1. USERS MODEL
# ==============================================================================
class User(Base):
    __tablename__ = 'users'
    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='customer')
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    passengers = relationship("Passenger", back_populates="user")
    bookings = relationship("Booking", back_populates="user")

    def __repr__(self):
        return f"<User(id='{self.id}', name='{self.name}', email='{self.email}', role='{self.role}')>"


# ==============================================================================
# 2. TRAINS MODEL
# ==============================================================================
class Train(Base):
    __tablename__ = 'trains'
    __table_args__ = (
        Index('idx_trains_route', 'source', 'destination'),
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )

    id = Column(String(50), primary_key=True)
    train_number = Column(String(20), nullable=False, unique=True, index=True)
    train_name = Column(String(100), nullable=False)
    source = Column(String(20), nullable=False, index=True)
    destination = Column(String(20), nullable=False, index=True)
    departure_time = Column(String(20), nullable=False)
    arrival_time = Column(String(20), nullable=False)
    journey_duration = Column(String(50), nullable=False)
    train_type = Column(String(50), nullable=False)
    status = Column(String(30), nullable=False, default='On Time')
    fare = Column(Numeric(10, 2), nullable=False, default=Decimal('1500.00'))
    available_seats = Column(Integer, nullable=False, default=120)

    # Relationships
    seats = relationship("Seat", back_populates="train", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="train")

    def __repr__(self):
        return f"<Train(number='{self.train_number}', name='{self.train_name}', {self.source}->{self.destination})>"


# ==============================================================================
# 3. SEATS MODEL
# ==============================================================================
class Seat(Base):
    __tablename__ = 'seats'
    __table_args__ = (
        UniqueConstraint('train_id', 'seat_number', 'class_type', name='uq_train_seat'),
        Index('idx_seats_train_status', 'train_id', 'seat_status'),
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )

    id = Column(String(50), primary_key=True)
    train_id = Column(String(50), ForeignKey('trains.id', ondelete='CASCADE'), nullable=False, index=True)
    class_type = Column(String(20), nullable=False)
    seat_number = Column(String(20), nullable=False)
    seat_status = Column(String(20), nullable=False, default='available')
    fare = Column(Numeric(10, 2), nullable=False)

    # Relationships
    train = relationship("Train", back_populates="seats")

    def __repr__(self):
        return f"<Seat(train='{self.train_id}', seat='{self.seat_number}', class='{self.class_type}', status='{self.seat_status}')>"


# ==============================================================================
# 4. PASSENGERS MODEL
# ==============================================================================
class Passenger(Base):
    __tablename__ = 'passengers'
    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    id_number = Column(String(50), nullable=True)

    # Relationships
    user = relationship("User", back_populates="passengers")

    def __repr__(self):
        return f"<Passenger(id='{self.id}', name='{self.name}', age={self.age}, gender='{self.gender}')>"


# ==============================================================================
# 5. BOOKINGS MODEL
# ==============================================================================
class Booking(Base):
    __tablename__ = 'bookings'
    __table_args__ = (
        Index('idx_bookings_user', 'user_id'),
        Index('idx_bookings_pnr', 'pnr'),
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey('users.id', ondelete='RESTRICT'), nullable=False, index=True)
    train_id = Column(String(50), ForeignKey('trains.id', ondelete='RESTRICT'), nullable=False, index=True)
    pnr = Column(String(20), nullable=False, unique=True, index=True)
    journey_date = Column(String(30), nullable=False)
    class_type = Column(String(20), nullable=False)
    total_fare = Column(Numeric(10, 2), nullable=False)
    booking_status = Column(String(30), nullable=False, default='CONFIRMED')
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="bookings")
    train = relationship("Train", back_populates="bookings")
    passengers = relationship("BookingPassenger", back_populates="booking", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    cancellations = relationship("Cancellation", back_populates="booking", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Booking(pnr='{self.pnr}', train='{self.train_id}', user='{self.user_id}', status='{self.booking_status}')>"


# ==============================================================================
# 6. BOOKING_PASSENGERS MODEL
# ==============================================================================
class BookingPassenger(Base):
    __tablename__ = 'booking_passengers'
    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String(50), ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    passenger_id = Column(String(50), nullable=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    seat_number = Column(String(20), nullable=True)
    berth_preference = Column(String(30), nullable=True)
    concession_type = Column(String(30), default='REGULAR')

    # Relationships
    booking = relationship("Booking", back_populates="passengers")

    def __repr__(self):
        return f"<BookingPassenger(booking='{self.booking_id}', name='{self.name}', seat='{self.seat_number}')>"


# ==============================================================================
# 7. PAYMENTS MODEL
# ==============================================================================
class Payment(Base):
    __tablename__ = 'payments'
    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )

    id = Column(String(50), primary_key=True)
    booking_id = Column(String(50), ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)
    payment_status = Column(String(30), nullable=False, default='SUCCESS')
    transaction_reference = Column(String(100), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="payments")

    def __repr__(self):
        return f"<Payment(id='{self.id}', booking='{self.booking_id}', amount={self.amount}, status='{self.payment_status}')>"


# ==============================================================================
# 8. CANCELLATIONS MODEL
# ==============================================================================
class Cancellation(Base):
    __tablename__ = 'cancellations'
    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )

    id = Column(String(50), primary_key=True)
    booking_id = Column(String(50), ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    cancellation_date = Column(DateTime, default=datetime.utcnow)
    reason = Column(String(255), nullable=False)
    refund_amount = Column(Numeric(10, 2), nullable=False)
    cancellation_status = Column(String(30), nullable=False, default='PROCESSED')

    # Relationships
    booking = relationship("Booking", back_populates="cancellations")

    def __repr__(self):
        return f"<Cancellation(id='{self.id}', booking='{self.booking_id}', refund={self.refund_amount}, status='{self.cancellation_status}')>"


# ==============================================================================
# DATABASE CREATION AND INITIALIZATION ROUTINE
# ==============================================================================
def create_mysql_database_if_not_exists(host, port, user, password, db_name):
    """
    Connects to MySQL server without selecting a specific database,
    and executes CREATE DATABASE IF NOT EXISTS.
    """
    server_url = f"mysql+pymysql://{user}:{password}@{host}:{port}/"
    engine_server = create_engine(server_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
    
    with engine_server.connect() as conn:
        conn.execute(text(
            f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        ))
        conn.commit()
    engine_server.dispose()


def display_ddl(engine):
    """Prints the MySQL CREATE TABLE statements generated by SQLAlchemy."""
    print("=" * 80)
    print("SQLAlchemy DDL (Data Definition Language) for MySQL Schema:")
    print("=" * 80)
    ordered_tables = [
        User.__table__,
        Train.__table__,
        Seat.__table__,
        Passenger.__table__,
        Booking.__table__,
        BookingPassenger.__table__,
        Payment.__table__,
        Cancellation.__table__
    ]
    for table in ordered_tables:
        ddl = CreateTable(table).compile(engine)
        print(f"\n-- Table: {table.name}")
        print(str(ddl).strip() + ";")
    print("=" * 80)


def initialize_database(
    host="127.0.0.1",
    port=3306,
    user="root",
    password="",
    db_name="railway_reservation_db",
    drop_existing=False,
    sqlite_fallback=False,
    show_ddl_only=False
):
    """Initializes the database schema using SQLAlchemy."""
    mysql_url = f"mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}"

    print("==============================================================================")
    print("   Domestic Railway Reservation System - Database Initialization Routine      ")
    print("==============================================================================")

    if show_ddl_only:
        try:
            from sqlalchemy.engine import create_mock_engine
            def dump(sql, *multiparams, **params):
                pass
            dummy_engine = create_mock_engine(mysql_url, dump)
        except Exception:
            dummy_engine = create_engine(mysql_url, pool_pre_ping=False)
        display_ddl(dummy_engine)
        return True

    engine = None
    connected_db_type = None

    # Step 1: Attempt MySQL Connection
    try:
        print(f"[1/3] Connecting to MySQL server on {host}:{port}...")
        create_mysql_database_if_not_exists(host, port, user, password, db_name)
        print(f"      -> Database '{db_name}' verified/created.")

        print(f"[2/3] Connecting to target database '{db_name}'...")
        engine = create_engine(
            mysql_url,
            pool_recycle=3600,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        connected_db_type = 'MySQL'
        print("      -> Connection to MySQL established successfully.")
    except Exception as err:
        print(f"[WARN] Unable to connect to MySQL at {host}:{port}")
        print(f"       Details: {err}")
        if sqlite_fallback:
            sqlite_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'railway_local.db')
            print(f"[FALLBACK] Initializing with embedded SQLite fallback: {sqlite_path}")
            engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})
            connected_db_type = 'SQLite'
        else:
            print("\n[ERROR] MySQL database could not be initialized.")
            print("Tip: If running without a running MySQL daemon locally, use:")
            print("     python3 init_mysql_db.py --sqlite-fallback")
            print("Or print the complete schema DDL with:")
            print("     python3 init_mysql_db.py --show-ddl")
            return False

    # Step 2: Drop existing tables if requested
    if drop_existing:
        print(f"[3/3] Dropping existing tables in {connected_db_type}...")
        Base.metadata.drop_all(bind=engine)
        print("      -> Existing tables dropped successfully.")

    # Step 3: Create all tables in required order
    print(f"[3/3] Creating tables in {connected_db_type}...")
    Base.metadata.create_all(bind=engine)

    # Verification Step: Inspect generated tables
    inspector = inspect(engine)
    created_tables = inspector.get_table_names()

    required_tables = [
        'users',
        'trains',
        'seats',
        'passengers',
        'bookings',
        'booking_passengers',
        'payments',
        'cancellations'
    ]

    print("\n------------------------------------------------------------------------------")
    print(f"Database Initialization Summary ({connected_db_type}):")
    print("------------------------------------------------------------------------------")
    all_success = True
    for tbl in required_tables:
        if tbl in created_tables:
            columns = inspector.get_columns(tbl)
            fks = inspector.get_foreign_keys(tbl)
            print(f"  [OK] Table '{tbl:<18}' | Columns: {len(columns):<2} | Foreign Keys: {len(fks)}")
        else:
            print(f"  [FAIL] Missing table: '{tbl}'")
            all_success = False

    print("------------------------------------------------------------------------------")
    if all_success:
        print(f"[SUCCESS] All 8 tables initialized cleanly in {connected_db_type}!")
    else:
        print(f"[WARNING] Some tables could not be verified.")
    print("==============================================================================\n")
    return all_success


# ==============================================================================
# CLI ENTRY POINT
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="Initialize MySQL Database for Domestic Railway Reservation System using SQLAlchemy."
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("MYSQL_HOST", "127.0.0.1"),
        help="MySQL host (default: 127.0.0.1 or $MYSQL_HOST)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("MYSQL_PORT", 3306)),
        help="MySQL port (default: 3306 or $MYSQL_PORT)"
    )
    parser.add_argument(
        "--user",
        default=os.environ.get("MYSQL_USER", "root"),
        help="MySQL username (default: root or $MYSQL_USER)"
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("MYSQL_PASSWORD", ""),
        help="MySQL password (default: empty or $MYSQL_PASSWORD)"
    )
    parser.add_argument(
        "--db",
        default=os.environ.get("MYSQL_DB", "railway_reservation_db"),
        help="MySQL database name (default: railway_reservation_db or $MYSQL_DB)"
    )
    parser.add_argument(
        "--drop-existing",
        action="store_true",
        help="Drop existing tables before recreating"
    )
    parser.add_argument(
        "--sqlite-fallback",
        action="store_true",
        default=True,
        help="Fallback automatically to SQLite if MySQL server is offline (default: True)"
    )
    parser.add_argument(
        "--strict-mysql",
        action="store_true",
        help="Strict mode: Do not fallback to SQLite if MySQL is offline"
    )
    parser.add_argument(
        "--show-ddl",
        action="store_true",
        help="Display SQL DDL create table statements without executing them"
    )

    args = parser.parse_args()

    success = initialize_database(
        host=args.host,
        port=args.port,
        user=args.user,
        password=args.password,
        db_name=args.db,
        drop_existing=args.drop_existing,
        sqlite_fallback=not args.strict_mysql and args.sqlite_fallback,
        show_ddl_only=args.show_ddl
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
