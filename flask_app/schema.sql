-- ==========================================================
-- AIRLINE RESERVATION AND TICKET BOOKING SYSTEM
-- MCA Major Project Database Schema
-- RDBMS: MySQL 8.0 / MariaDB
-- ==========================================================

DROP DATABASE IF EXISTS `airline_reservation_db`;
CREATE DATABASE `airline_reservation_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `airline_reservation_db`;

-- 1. Roles Table
CREATE TABLE `roles` (
    `role_id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(30) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL
) ENGINE=InnoDB;

INSERT INTO `roles` (`role_id`, `role_name`, `description`) VALUES
(1, 'customer', 'Standard airline customer / passenger'),
(2, 'staff', 'Airline ground staff / gate agent'),
(3, 'admin', 'System administrator / flight operations manager');

-- 2. Users Table
CREATE TABLE `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT NOT NULL DEFAULT 1,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone` VARCHAR(20) NOT NULL,
    `passport_number` VARCHAR(30) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Preloaded Accounts (Pass: admin123, staff123, customer123 / demo123)
INSERT INTO `users` (`user_id`, `role_id`, `username`, `password_hash`, `full_name`, `email`, `phone`, `passport_number`) VALUES
(1, 3, 'admin', 'pbkdf2:sha256:260000$admin$2b91866385d898bb6c52a819c968f9b7c89736c2cf8b2bcf1b54a20a48b39ee9', 'System Administrator', 'admin@aerosky.com', '+91 9811001100', 'A1000999'),
(2, 2, 'staff', 'pbkdf2:sha256:260000$staff$1312389a19c5c16503c7bb61c713b63297a78a6ff67ba9e03d7c2f821639d48b', 'Priya Verma (Staff)', 'staff@aerosky.com', '+91 9822002200', 'B2000888'),
(3, 1, 'rahul_sharma', 'pbkdf2:sha256:260000$customer$ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d', 'Rahul Sharma', 'customer@aerosky.com', '+91 9833003300', 'Z3000777');

-- 3. Airports Table
CREATE TABLE `airports` (
    `airport_id` INT AUTO_INCREMENT PRIMARY KEY,
    `airport_code` VARCHAR(3) NOT NULL UNIQUE,
    `airport_name` VARCHAR(150) NOT NULL,
    `city` VARCHAR(80) NOT NULL,
    `country` VARCHAR(80) NOT NULL DEFAULT 'India',
    `timezone` VARCHAR(50) DEFAULT 'Asia/Kolkata'
) ENGINE=InnoDB;

INSERT INTO `airports` (`airport_id`, `airport_code`, `airport_name`, `city`, `country`) VALUES
(1, 'DEL', 'Indira Gandhi International Airport', 'New Delhi', 'India'),
(2, 'BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India'),
(3, 'BLR', 'Kempegowda International Airport', 'Bengaluru', 'India'),
(4, 'MAA', 'Chennai International Airport', 'Chennai', 'India'),
(5, 'CCU', 'Netaji Subhash Chandra Bose International Airport', 'Kolkata', 'India'),
(6, 'HYD', 'Rajiv Gandhi International Airport', 'Hyderabad', 'India'),
(7, 'GOI', 'Dabolim International Airport', 'Goa', 'India'),
(8, 'DXB', 'Dubai International Airport', 'Dubai', 'UAE');

-- 4. Aircraft Fleet Table
CREATE TABLE `aircraft` (
    `aircraft_id` INT AUTO_INCREMENT PRIMARY KEY,
    `model` VARCHAR(60) NOT NULL,
    `tail_number` VARCHAR(30) NOT NULL UNIQUE,
    `capacity_economy` INT NOT NULL DEFAULT 150,
    `capacity_business` INT NOT NULL DEFAULT 20,
    `capacity_first` INT NOT NULL DEFAULT 10,
    `total_capacity` INT GENERATED ALWAYS AS (`capacity_economy` + `capacity_business` + `capacity_first`) STORED,
    `status` ENUM('ACTIVE', 'MAINTENANCE', 'GROUNDED') DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

INSERT INTO `aircraft` (`aircraft_id`, `model`, `tail_number`, `capacity_economy`, `capacity_business`, `capacity_first`, `status`) VALUES
(1, 'Airbus A320neo', 'VT-ASK-01', 20, 6, 4, 'ACTIVE'),
(2, 'Boeing 737-800', 'VT-ASK-02', 20, 6, 4, 'ACTIVE'),
(3, 'Airbus A321neo', 'VT-ASK-03', 24, 6, 4, 'ACTIVE'),
(4, 'Boeing 787-9 Dreamliner', 'VT-ASK-04', 30, 8, 6, 'ACTIVE');

-- 5. Routes Table
CREATE TABLE `routes` (
    `route_id` INT AUTO_INCREMENT PRIMARY KEY,
    `origin_airport_id` INT NOT NULL,
    `destination_airport_id` INT NOT NULL,
    `distance_km` INT NOT NULL DEFAULT 1200,
    `approx_duration_mins` INT NOT NULL DEFAULT 130,
    FOREIGN KEY (`origin_airport_id`) REFERENCES `airports`(`airport_id`),
    FOREIGN KEY (`destination_airport_id`) REFERENCES `airports`(`airport_id`),
    UNIQUE KEY `unique_route` (`origin_airport_id`, `destination_airport_id`)
) ENGINE=InnoDB;

INSERT INTO `routes` (`route_id`, `origin_airport_id`, `destination_airport_id`, `distance_km`, `approx_duration_mins`) VALUES
(1, 1, 2, 1148, 130), -- DEL -> BOM
(2, 2, 1, 1148, 130), -- BOM -> DEL
(3, 1, 3, 1740, 160), -- DEL -> BLR
(4, 3, 1, 1740, 160), -- BLR -> DEL
(5, 2, 7, 435, 75),   -- BOM -> GOI
(6, 7, 2, 435, 75),   -- GOI -> BOM
(7, 3, 4, 290, 60),   -- BLR -> MAA
(8, 1, 8, 2180, 225); -- DEL -> DXB

-- 6. Flights Table
CREATE TABLE `flights` (
    `flight_id` INT AUTO_INCREMENT PRIMARY KEY,
    `flight_number` VARCHAR(20) NOT NULL,
    `airline_name` VARCHAR(80) NOT NULL DEFAULT 'AeroSky Airlines',
    `aircraft_id` INT NOT NULL,
    `route_id` INT NOT NULL,
    `departure_date` DATE NOT NULL,
    `departure_time` TIME NOT NULL,
    `arrival_time` TIME NOT NULL,
    `base_price_economy` DECIMAL(10, 2) NOT NULL,
    `business_multiplier` DECIMAL(3, 2) NOT NULL DEFAULT 2.20,
    `first_multiplier` DECIMAL(3, 2) NOT NULL DEFAULT 3.50,
    `terminal` VARCHAR(10) DEFAULT 'T3',
    `gate` VARCHAR(10) DEFAULT '14A',
    `status` ENUM('On Time', 'Delayed', 'Boarding', 'Departed', 'Arrived', 'Cancelled') NOT NULL DEFAULT 'On Time',
    `delay_minutes` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`aircraft_id`) REFERENCES `aircraft`(`aircraft_id`),
    FOREIGN KEY (`route_id`) REFERENCES `routes`(`route_id`),
    INDEX (`departure_date`),
    INDEX (`status`)
) ENGINE=InnoDB;

INSERT INTO `flights` (`flight_id`, `flight_number`, `airline_name`, `aircraft_id`, `route_id`, `departure_date`, `departure_time`, `arrival_time`, `base_price_economy`, `terminal`, `gate`, `status`) VALUES
(1, 'AS-101', 'AeroSky Express', 1, 1, CURDATE(), '06:30:00', '08:45:00', 4850.00, 'T3', '12B', 'On Time'),
(2, 'AS-102', 'AeroSky Express', 2, 1, CURDATE(), '11:15:00', '13:30:00', 5400.00, 'T3', '14A', 'On Time'),
(3, 'AS-105', 'AeroSky Express', 3, 1, CURDATE(), '18:45:00', '21:05:00', 6200.00, 'T3', '08C', 'Delayed'),
(4, 'AS-201', 'AeroSky Prime', 4, 3, CURDATE(), '07:00:00', '09:45:00', 5900.00, 'T3', '17', 'On Time'),
(5, 'AS-301', 'AeroSky Leisure', 1, 5, CURDATE(), '14:20:00', '15:35:00', 3800.00, 'T2', '05', 'On Time'),
(6, 'AS-401', 'AeroSky International', 4, 8, CURDATE(), '20:30:00', '23:15:00', 14500.00, 'T3', '21', 'On Time'),
(7, 'AS-101', 'AeroSky Express', 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '06:30:00', '08:45:00', 4850.00, 'T3', '12B', 'On Time'),
(8, 'AS-201', 'AeroSky Prime', 4, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '07:00:00', '09:45:00', 5900.00, 'T3', '17', 'On Time');

-- 7. Aircraft Seats Catalog Table
CREATE TABLE `seats` (
    `seat_id` INT AUTO_INCREMENT PRIMARY KEY,
    `aircraft_id` INT NOT NULL,
    `seat_code` VARCHAR(5) NOT NULL,
    `cabin_class` ENUM('Economy', 'Business', 'First') NOT NULL,
    `is_extra_legroom` BOOLEAN DEFAULT FALSE,
    `price_modifier` DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (`aircraft_id`) REFERENCES `aircraft`(`aircraft_id`),
    UNIQUE KEY `unique_aircraft_seat` (`aircraft_id`, `seat_code`)
) ENGINE=InnoDB;

-- Populate Standard 30-Seat Mock Cabin for Aircraft 1
INSERT INTO `seats` (`aircraft_id`, `seat_code`, `cabin_class`, `is_extra_legroom`, `price_modifier`) VALUES
-- First Class (Row 1)
(1, '1A', 'First', TRUE, 1200.00),
(1, '1C', 'First', TRUE, 1200.00),
(1, '1D', 'First', TRUE, 1200.00),
(1, '1F', 'First', TRUE, 1200.00),
-- Business Class (Row 2)
(1, '2A', 'Business', TRUE, 800.00),
(1, '2B', 'Business', FALSE, 500.00),
(1, '2C', 'Business', FALSE, 500.00),
(1, '2D', 'Business', FALSE, 500.00),
(1, '2E', 'Business', FALSE, 500.00),
(1, '2F', 'Business', TRUE, 800.00),
-- Economy Class (Rows 3 to 5)
(1, '3A', 'Economy', TRUE, 450.00),
(1, '3B', 'Economy', FALSE, 0.00),
(1, '3C', 'Economy', FALSE, 0.00),
(1, '3D', 'Economy', FALSE, 0.00),
(1, '3E', 'Economy', FALSE, 0.00),
(1, '3F', 'Economy', TRUE, 450.00),
(1, '4A', 'Economy', FALSE, 0.00),
(1, '4B', 'Economy', FALSE, 0.00),
(1, '4C', 'Economy', FALSE, 0.00),
(1, '4D', 'Economy', FALSE, 0.00),
(1, '4E', 'Economy', FALSE, 0.00),
(1, '4F', 'Economy', FALSE, 0.00),
(1, '5A', 'Economy', FALSE, 0.00),
(1, '5B', 'Economy', FALSE, 0.00),
(1, '5C', 'Economy', FALSE, 0.00),
(1, '5D', 'Economy', FALSE, 0.00),
(1, '5E', 'Economy', FALSE, 0.00),
(1, '5F', 'Economy', FALSE, 0.00);

-- Duplicate seats template for Aircraft 2, 3, 4
INSERT INTO `seats` (`aircraft_id`, `seat_code`, `cabin_class`, `is_extra_legroom`, `price_modifier`)
SELECT 2, `seat_code`, `cabin_class`, `is_extra_legroom`, `price_modifier` FROM `seats` WHERE `aircraft_id` = 1;

INSERT INTO `seats` (`aircraft_id`, `seat_code`, `cabin_class`, `is_extra_legroom`, `price_modifier`)
SELECT 3, `seat_code`, `cabin_class`, `is_extra_legroom`, `price_modifier` FROM `seats` WHERE `aircraft_id` = 1;

INSERT INTO `seats` (`aircraft_id`, `seat_code`, `cabin_class`, `is_extra_legroom`, `price_modifier`)
SELECT 4, `seat_code`, `cabin_class`, `is_extra_legroom`, `price_modifier` FROM `seats` WHERE `aircraft_id` = 1;

-- 8. Bookings Table (Header)
CREATE TABLE `bookings` (
    `booking_id` INT AUTO_INCREMENT PRIMARY KEY,
    `pnr` VARCHAR(6) NOT NULL UNIQUE,
    `user_id` INT NOT NULL,
    `flight_id` INT NOT NULL,
    `booking_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `travel_date` DATE NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `booking_status` ENUM('CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'COMPLETED') DEFAULT 'CONFIRMED',
    `cabin_class` ENUM('Economy', 'Business', 'First') NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`),
    FOREIGN KEY (`flight_id`) REFERENCES `flights`(`flight_id`),
    INDEX (`pnr`),
    INDEX (`booking_status`)
) ENGINE=InnoDB;

-- 9. Booking Passengers & Assigned Seats Table
CREATE TABLE `booking_passengers` (
    `passenger_id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `age` INT NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `passport_number` VARCHAR(30) NULL,
    `seat_code` VARCHAR(5) NOT NULL,
    `special_assistance` VARCHAR(100) DEFAULT 'None',
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`booking_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Flight Seat Allocation (Active Reservation Lock to prevent duplicate seats)
CREATE TABLE `flight_seat_allocations` (
    `allocation_id` INT AUTO_INCREMENT PRIMARY KEY,
    `flight_id` INT NOT NULL,
    `seat_code` VARCHAR(5) NOT NULL,
    `booking_id` INT NOT NULL,
    `passenger_id` INT NULL,
    `allocated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`flight_id`) REFERENCES `flights`(`flight_id`) ON DELETE CASCADE,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`booking_id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_flight_seat` (`flight_id`, `seat_code`)
) ENGINE=InnoDB;

-- 11. Payments Table
CREATE TABLE `payments` (
    `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL,
    `transaction_id` VARCHAR(50) NOT NULL UNIQUE,
    `payment_method` ENUM('UPI', 'Credit/Debit Card', 'Airline Wallet') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_status` ENUM('SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'SUCCESS',
    `payment_reference` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`booking_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Cancellations and Refunds Table
CREATE TABLE `cancellations` (
    `cancellation_id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL UNIQUE,
    `reason` VARCHAR(255) NOT NULL,
    `cancellation_fee` DECIMAL(10, 2) NOT NULL,
    `refund_amount` DECIMAL(10, 2) NOT NULL,
    `refund_status` ENUM('PENDING', 'PROCESSED', 'REJECTED') DEFAULT 'PROCESSED',
    `cancelled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`booking_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Web Check-ins & Boarding Passes Table
CREATE TABLE `checkins` (
    `checkin_id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL UNIQUE,
    `passenger_id` INT NOT NULL,
    `seat_confirmed` VARCHAR(5) NOT NULL,
    `boarding_sequence` INT NOT NULL AUTO_INCREMENT UNIQUE,
    `boarding_group` VARCHAR(5) DEFAULT 'B',
    `gate` VARCHAR(10) DEFAULT '14A',
    `checked_in_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`booking_id`) ON DELETE CASCADE,
    FOREIGN KEY (`passenger_id`) REFERENCES `booking_passengers`(`passenger_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. Notifications Table
CREATE TABLE `notifications` (
    `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ALERT') DEFAULT 'INFO',
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sample Demonstrative Booking for Rahul Sharma
INSERT INTO `bookings` (`booking_id`, `pnr`, `user_id`, `flight_id`, `travel_date`, `total_amount`, `booking_status`, `cabin_class`) VALUES
(1, 'A7K92P', 3, 1, CURDATE(), 5300.00, 'CONFIRMED', 'Economy');

INSERT INTO `booking_passengers` (`passenger_id`, `booking_id`, `full_name`, `age`, `gender`, `phone`, `email`, `passport_number`, `seat_code`) VALUES
(1, 1, 'Rahul Sharma', 28, 'Male', '+91 9833003300', 'customer@aerosky.com', 'Z3000777', '3A');

INSERT INTO `flight_seat_allocations` (`flight_id`, `seat_code`, `booking_id`, `passenger_id`) VALUES
(1, '3A', 1, 1);

INSERT INTO `payments` (`booking_id`, `transaction_id`, `payment_method`, `amount`, `payment_status`, `payment_reference`) VALUES
(1, 'TXN-A7K92P-9821', 'UPI', 5300.00, 'SUCCESS', 'rahul@okaxis');

INSERT INTO `notifications` (`user_id`, `title`, `message`, `type`, `is_read`) VALUES
(3, 'Booking Confirmed (PNR: A7K92P)', 'Your flight AS-101 from DEL to BOM has been confirmed for seat 3A.', 'SUCCESS', FALSE);
