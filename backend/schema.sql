-- ============================================================================
-- TransitOps Database Schema & Localized Seed Data (MySQL)
-- Targeted Database: MySQL / MariaDB (India Localization)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS transitops_db;
USE transitops_db;

-- 1. TABLE STRUCTURES

DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS fuel_logs;
DROP TABLE IF EXISTS maintenance_logs;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST') NOT NULL DEFAULT 'DRIVER',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vehicles (
    id VARCHAR(50) PRIMARY KEY,
    registrationNumber VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    type ENUM('VAN', 'TRUCK', 'CAR') NOT NULL,
    maxLoadCapacity DECIMAL(10, 2) NOT NULL,
    odometer DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    acquisitionCost DECIMAL(12, 2) NOT NULL,
    status ENUM('Available', 'On Trip', 'In Shop', 'Retired') NOT NULL DEFAULT 'Available',
    region VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_vehicle_maxLoadCapacity CHECK (maxLoadCapacity > 0),
    CONSTRAINT chk_vehicle_odometer CHECK (odometer >= 0.00),
    CONSTRAINT chk_vehicle_acquisitionCost CHECK (acquisitionCost >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE drivers (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) UNIQUE DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    licenseNumber VARCHAR(50) NOT NULL UNIQUE,
    licenseCategory VARCHAR(50) NOT NULL,
    licenseExpiryDate DATETIME NOT NULL,
    contactNumber VARCHAR(20) NOT NULL,
    safetyScore DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    status ENUM('Available', 'On Trip', 'Off Duty', 'Suspended') NOT NULL DEFAULT 'Available',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_driver_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_driver_safetyScore CHECK (safetyScore >= 0.00 AND safetyScore <= 100.00),
    CONSTRAINT chk_driver_contactNumber CHECK (contactNumber LIKE '+91%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trips (
    id VARCHAR(50) PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicleId VARCHAR(50) NOT NULL,
    driverId VARCHAR(50) NOT NULL,
    cargoWeight DECIMAL(10, 2) NOT NULL,
    plannedDistance DECIMAL(10, 2) NOT NULL,
    status ENUM('Draft', 'Dispatched', 'En Route to Pickup', 'Loading Cargo', 'In Transit', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft',
    finalOdometer DECIMAL(10, 2) DEFAULT NULL,
    fuelConsumedLiters DECIMAL(10, 2) DEFAULT NULL,
    fuelCost DECIMAL(12, 2) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_trip_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trip_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_trip_cargoWeight CHECK (cargoWeight >= 0.00),
    CONSTRAINT chk_trip_plannedDistance CHECK (plannedDistance > 0.00),
    CONSTRAINT chk_trip_finalOdometer CHECK (finalOdometer IS NULL OR finalOdometer >= 0.00),
    CONSTRAINT chk_trip_fuelConsumed CHECK (fuelConsumedLiters IS NULL OR fuelConsumedLiters >= 0.00),
    CONSTRAINT chk_trip_fuelCost CHECK (fuelCost IS NULL OR fuelCost >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE maintenance_logs (
    id VARCHAR(50) PRIMARY KEY,
    vehicleId VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('Scheduled', 'Unscheduled') NOT NULL DEFAULT 'Scheduled',
    cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    startDate DATETIME NOT NULL,
    endDate DATETIME DEFAULT NULL,
    finalCost DECIMAL(12, 2) DEFAULT NULL,
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
    notes TEXT DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_maint_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT chk_maint_cost CHECK (cost >= 0.00),
    CONSTRAINT chk_maint_finalCost CHECK (finalCost IS NULL OR finalCost >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fuel_logs (
    id VARCHAR(50) PRIMARY KEY,
    vehicleId VARCHAR(50) NOT NULL,
    driverId VARCHAR(50) NOT NULL,
    tripId VARCHAR(50) DEFAULT NULL,
    liters DECIMAL(10, 2) NOT NULL,
    costPerLiter DECIMAL(10, 2) NOT NULL,
    totalCost DECIMAL(12, 2) NOT NULL,
    odometer DECIMAL(10, 2) NOT NULL,
    date DATETIME NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fuel_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_fuel_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fuel_trip FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE SET NULL,
    CONSTRAINT chk_fuel_liters CHECK (liters > 0.00),
    CONSTRAINT chk_fuel_costPerLiter CHECK (costPerLiter > 0.00),
    CONSTRAINT chk_fuel_totalCost CHECK (totalCost >= 0.00),
    CONSTRAINT chk_fuel_odometer CHECK (odometer >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE expenses (
    id VARCHAR(50) PRIMARY KEY,
    vehicleId VARCHAR(50) NOT NULL,
    tripId VARCHAR(50) DEFAULT NULL,
    driverId VARCHAR(50) DEFAULT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category ENUM('Toll', 'Fuel', 'Maintenance', 'Cleaning', 'Misc') NOT NULL DEFAULT 'Misc',
    description TEXT NOT NULL,
    date DATETIME NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_trip FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE SET NULL,
    CONSTRAINT fk_expense_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE SET NULL,
    CONSTRAINT chk_expense_amount CHECK (amount >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. INDEX OPTIMIZATIONS

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_region ON vehicles(region);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_vehicleId ON trips(vehicleId);
CREATE INDEX idx_trips_driverId ON trips(driverId);
CREATE INDEX idx_maint_vehicleId ON maintenance_logs(vehicleId);
CREATE INDEX idx_maint_status ON maintenance_logs(status);
CREATE INDEX idx_fuel_vehicleId ON fuel_logs(vehicleId);
CREATE INDEX idx_fuel_driverId ON fuel_logs(driverId);
CREATE INDEX idx_fuel_tripId ON fuel_logs(tripId);
CREATE INDEX idx_expenses_vehicleId ON expenses(vehicleId);
CREATE INDEX idx_expenses_tripId ON expenses(tripId);
CREATE INDEX idx_expenses_driverId ON expenses(driverId);
CREATE INDEX idx_expenses_category ON expenses(category);

