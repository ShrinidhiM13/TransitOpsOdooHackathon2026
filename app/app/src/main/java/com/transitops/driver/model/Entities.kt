package com.transitops.driver.model

data class Driver(
    val id: String,
    val name: String,
    val licenseNumber: String,
    val licenseCategory: String,
    val licenseExpiryDate: String,
    val contactNumber: String,
    val safetyScore: Double,
    val status: String // Available | On Trip | Off Duty | Suspended
)

data class Vehicle(
    val id: String,
    val registrationNumber: String,
    val model: String,
    val type: String, // VAN | TRUCK | CAR
    val maxLoadCapacity: Double,
    val odometer: Double,
    val acquisitionCost: Double,
    val status: String, // Available | On Trip | In Shop | Retired
    val region: String
)

data class Trip(
    val id: String,
    val source: String,
    val destination: String,
    val vehicleId: String,
    val driverId: String,
    val cargoWeight: Double,
    val plannedDistance: Double,
    val status: String, // Dispatched | En Route to Pickup | Loading Cargo | In Transit | Completed | Cancelled
    val createdAt: String
)

data class Expense(
    val id: String,
    val vehicleId: String,
    val tripId: String,
    val amount: Double,
    val category: String, // Fuel | Toll | Misc
    val description: String,
    val date: String
)
