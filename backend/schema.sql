-- ==============================================================================
-- DOMESTIC RAILWAY RESERVATION SYSTEM - DATABASE SCHEMA (MySQL)
-- Academic MCA Major Project
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS railway_reservation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE railway_reservation_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TRAINS TABLE
CREATE TABLE IF NOT EXISTS trains (
    id VARCHAR(50) PRIMARY KEY,
    train_number VARCHAR(20) NOT NULL UNIQUE,
    train_name VARCHAR(100) NOT NULL,
    source VARCHAR(20) NOT NULL,
    destination VARCHAR(20) NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    arrival_time VARCHAR(20) NOT NULL,
    journey_duration VARCHAR(50) NOT NULL,
    train_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'On Time',
    fare DECIMAL(10, 2) NOT NULL DEFAULT 1500.00,
    available_seats INT NOT NULL DEFAULT 120
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. SEATS TABLE
CREATE TABLE IF NOT EXISTS seats (
    id VARCHAR(50) PRIMARY KEY,
    train_id VARCHAR(50) NOT NULL,
    class_type VARCHAR(20) NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    seat_status VARCHAR(20) NOT NULL DEFAULT 'available',
    fare DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
    UNIQUE KEY uq_train_seat (train_id, seat_number, class_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. PASSENGERS TABLE
CREATE TABLE IF NOT EXISTS passengers (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    id_number VARCHAR(50) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    train_id VARCHAR(50) NOT NULL,
    pnr VARCHAR(20) NOT NULL UNIQUE,
    journey_date VARCHAR(30) NOT NULL,
    class_type VARCHAR(20) NOT NULL,
    total_fare DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. BOOKING_PASSENGERS TABLE (Associates passengers with each booking)
CREATE TABLE IF NOT EXISTS booking_passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    passenger_id VARCHAR(50) NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    seat_number VARCHAR(20) NULL,
    berth_preference VARCHAR(30) NULL,
    concession_type VARCHAR(30) DEFAULT 'REGULAR',
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    transaction_reference VARCHAR(100) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. CANCELLATIONS TABLE
CREATE TABLE IF NOT EXISTS cancellations (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL,
    cancellation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255) NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    cancellation_status VARCHAR(30) NOT NULL DEFAULT 'PROCESSED',
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INDEXES FOR FAST QUERYING
CREATE INDEX idx_trains_route ON trains(source, destination);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_pnr ON bookings(pnr);
CREATE INDEX idx_seats_train_status ON seats(train_id, seat_status);

