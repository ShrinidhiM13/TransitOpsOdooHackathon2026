-- TransitOps Database Schema and Mock Data Dump
-- Targeted Database: MySQL / MariaDB
-- Localized for India (INR Currency, MH Registration Plates, Mumbai-Pune routes)

CREATE DATABASE IF NOT EXISTS transitops_db;
USE transitops_db;

-- -------------------------------------------------------------
-- 1. TABLE STRUCTURES
-- -------------------------------------------------------------

-- Drop tables if they exist to allow clean rebuilds
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS fuel_logs;
DROP TABLE IF EXISTS maintenance_logs;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

-- Users table supporting Role-Based Access Control (RBAC)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicles Registry Table
CREATE TABLE vehicles (
    id VARCHAR(36) PRIMARY KEY,
    registration_number VARCHAR(20) UNIQUE NOT NULL, -- MH-XX-XX-XXXX
    model VARCHAR(100) NOT NULL,
    type ENUM('VAN', 'TRUCK', 'CAR') NOT NULL,
    max_load_capacity DOUBLE NOT NULL, -- in kilograms
    odometer DOUBLE NOT NULL DEFAULT 0.0, -- in kilometers
    acquisition_cost DOUBLE NOT NULL, -- in INR (₹)
    status ENUM('Available', 'On Trip', 'In Shop', 'Retired') NOT NULL DEFAULT 'Available',
    region VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drivers Management Table
CREATE TABLE drivers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_category VARCHAR(50) NOT NULL, -- MCWG / LMV / HGV
    license_expiry_date DATE NOT NULL,
    contact_number VARCHAR(15) NOT NULL, -- +91 XXXXXXXXXX
    safety_score DOUBLE NOT NULL DEFAULT 100.0,
    status ENUM('Available', 'On Trip', 'Off Duty', 'Suspended') NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trips Management Table
CREATE TABLE trips (
    id VARCHAR(36) PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle_id VARCHAR(36),
    driver_id VARCHAR(36),
    cargo_weight DOUBLE NOT NULL, -- in kilograms (checked against max_load_capacity)
    planned_distance DOUBLE NOT NULL, -- in kilometers
    status ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance Logs Table
CREATE TABLE maintenance_logs (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL DEFAULT NULL,
    cost DOUBLE DEFAULT 0.0, -- in INR (₹)
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fuel Logs Table
CREATE TABLE fuel_logs (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36) NULL,
    liters DOUBLE NOT NULL,
    cost DOUBLE NOT NULL, -- in INR (₹)
    log_date DATE NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Incidents & Expense Logs Table
CREATE TABLE expenses (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36) NULL,
    amount DOUBLE NOT NULL, -- in INR (₹)
    category ENUM('Fuel', 'Toll', 'Maintenance', 'Misc') NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- 2. INITIAL MOCK DUMP DATA (DML)
-- -------------------------------------------------------------

-- Roles / Users Seed (Passwords hashed with bcrypt; plaintext = 'transitops123')
INSERT INTO users (id, name, email, password_hash, role) VALUES
('usr_001', 'Karan Patel', 'manager@transitops.in', '$2b$10$WqB8g2N/X/0z4eK5v6vU5eYfE35w1wF345678901234567890abcd', 'FLEET_MANAGER'),
('usr_002', 'Rahul Sharma', 'driver.rahul@transitops.in', '$2b$10$WqB8g2N/X/0z4eK5v6vU5eYfE35w1wF345678901234567890abcd', 'DRIVER'),
('usr_003', 'Vikram Singh', 'safety@transitops.in', '$2b$10$WqB8g2N/X/0z4eK5v6vU5eYfE35w1wF345678901234567890abcd', 'SAFETY_OFFICER'),
('usr_004', 'Neha Gupta', 'finance@transitops.in', '$2b$10$WqB8g2N/X/0z4eK5v6vU5eYfE35w1wF345678901234567890abcd', 'FINANCIAL_ANALYST');

-- Vehicles Registry Seed
INSERT INTO vehicles (id, registration_number, model, type, max_load_capacity, odometer, acquisition_cost, status, region) VALUES
('veh_001', 'MH-12-PQ-1234', 'Tata Winger 2023', 'VAN', 500.0, 12450.5, 1500000.0, 'On Trip', 'Pune'),
('veh_002', 'MH-02-RS-5678', 'Mahindra Bolero Pik-Up', 'TRUCK', 1200.0, 48200.2, 950000.0, 'Available', 'Mumbai'),
('veh_003', 'MH-14-AB-9012', 'Tata Ace Gold', 'VAN', 750.0, 8900.0, 550000.0, 'In Shop', 'Pimpri-Chinchwad'),
('veh_004', 'MH-43-XY-3456', 'Maruti Suzuki Eeco Cargo', 'CAR', 400.0, 75600.0, 480000.0, 'Retired', 'Navi Mumbai');

-- Drivers Profile Seed
INSERT INTO drivers (id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES
('drv_001', 'Rahul Sharma', 'MH-12-2023-0045678', 'MCWG/LMV', '2027-12-31', '+919876543210', 95.5, 'On Trip'),
('drv_002', 'Amit Patel', 'MH-02-2018-0098765', 'LMV/HGV', '2028-05-15', '+918765432109', 98.2, 'Available'),
('drv_003', 'Kiran Patel', 'MH-14-2015-0012345', 'LMV', '2026-07-25', '+917654321098', 88.0, 'Available'), -- Expiring soon (July 25, 2026)
('drv_004', 'Suresh Kumar', 'MH-43-2012-0054321', 'HGV', '2022-10-10', '+916543210987', 72.5, 'Suspended'); -- Expired license & Suspended

-- Trips Log Seed
INSERT INTO trips (id, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, created_at) VALUES
('trp_101', 'Warehouse Alpha, Mumbai', 'Retail Outlet 4, Pune', 'veh_001', 'drv_001', 450.0, 150.0, 'Dispatched', '2026-07-12 10:00:00'),
('trp_102', 'Fulfillment Hub, Thane', 'Supermarket Beta, Nashik', 'veh_002', 'drv_002', 1100.0, 180.0, 'Completed', '2026-07-11 08:30:00');

-- Maintenance Records Seed
INSERT INTO maintenance_logs (id, vehicle_id, description, status, opened_at, closed_at, cost) VALUES
('maint_001', 'veh_003', 'Routine 10k Oil change and filter servicing', 'Open', '2026-07-12 09:00:00', NULL, 0.0),
('maint_002', 'veh_001', 'Brake pad replacement and wheel alignment', 'Closed', '2026-07-05 10:00:00', '2026-07-05 16:30:00', 5000.0);

-- Fuel Log Seed
INSERT INTO fuel_logs (id, vehicle_id, trip_id, liters, cost, log_date) VALUES
('fuel_001', 'veh_002', 'trp_102', 45.0, 4500.0, '2026-07-11'),
('fuel_002', 'veh_001', 'trp_101', 20.0, 2100.0, '2026-07-12');

-- General Incident & Expenses Seed
INSERT INTO expenses (id, vehicle_id, trip_id, amount, category, description, date) VALUES
('exp_001', 'veh_002', 'trp_102', 4500.0, 'Fuel', 'Refueled 45L for Nashik Delivery', '2026-07-11'),
('exp_002', 'veh_002', 'trp_102', 360.0, 'Toll', 'Mumbai-Nashik Expressway Toll plaza charge', '2026-07-11'),
('exp_003', 'veh_001', 'trp_101', 2100.0, 'Fuel', 'Refueled 20L for Pune Delivery', '2026-07-12'),
('exp_004', 'veh_001', 'trp_101', 320.0, 'Toll', 'Mumbai-Pune Expressway Toll plaza charge', '2026-07-12'),
('exp_005', 'veh_001', NULL, 5000.0, 'Maintenance', 'Brake pads replacement service invoice', '2026-07-05');
