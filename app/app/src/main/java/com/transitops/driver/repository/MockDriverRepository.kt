package com.transitops.driver.repository

import com.transitops.driver.model.Driver
import com.transitops.driver.model.Expense
import com.transitops.driver.model.Trip
import kotlinx.coroutines.delay

class MockDriverRepository : DriverRepository {
    
    // In-memory simulated database state
    private var mockDriver = Driver(
        id = "drv_102938",
        name = "Rahul Sharma",
        licenseNumber = "MH-12-2023-0045678",
        licenseCategory = "MCWG/LMV",
        licenseExpiryDate = "2027-12-31",
        contactNumber = "+919876543210",
        safetyScore = 95.5,
        status = "On Trip" // Starts with active trip dispatched
    )

    private var mockActiveTrip: Trip? = Trip(
        id = "trp_890123",
        source = "Warehouse Alpha, Mumbai",
        destination = "Retail Outlet 4, Pune",
        vehicleId = "veh_0912380",
        driverId = "drv_102938",
        cargoWeight = 450.0,
        plannedDistance = 150.0,
        status = "Dispatched", // Zomato-style statuses: Dispatched -> En Route to Pickup -> Loading Cargo -> In Transit -> Completed
        createdAt = "2026-07-12T10:30:00Z"
    )

    private val loggedExpenses = mutableListOf<Expense>()

    override suspend fun getDriverProfile(): Result<Driver> {
        delay(500) // Simulate network delay
        return Result.success(mockDriver)
    }

    override suspend fun getActiveTrip(): Result<Trip?> {
        delay(500)
        return Result.success(mockActiveTrip)
    }

    override suspend fun updateTripStatus(tripId: String, status: String): Result<Boolean> {
        delay(300)
        if (mockActiveTrip?.id == tripId) {
            mockActiveTrip = mockActiveTrip?.copy(status = status)
            if (status == "Completed" || status == "Cancelled") {
                mockDriver = mockDriver.copy(status = "Available")
                mockActiveTrip = null
            } else {
                mockDriver = mockDriver.copy(status = "On Duty / On Trip")
            }
            return Result.success(true)
        }
        return Result.failure(Exception("Trip not found"))
    }

    override suspend fun submitExpense(expense: Expense): Result<Boolean> {
        delay(400)
        loggedExpenses.add(expense)
        return Result.success(true)
    }

    override suspend fun completeTrip(
        tripId: String,
        finalOdometer: Double,
        fuelCost: Double,
        fuelLiters: Double
    ): Result<Boolean> {
        delay(600)
        if (mockActiveTrip?.id == tripId) {
            // Log fuel expense automatically
            loggedExpenses.add(
                Expense(
                    id = "exp_" + System.currentTimeMillis(),
                    vehicleId = mockActiveTrip?.vehicleId ?: "",
                    tripId = tripId,
                    amount = fuelCost,
                    category = "Fuel",
                    description = "Fuel Log: $fuelLiters Liters added during trip complete",
                    date = "2026-07-12"
                )
            )
            mockActiveTrip = null
            mockDriver = mockDriver.copy(status = "Available")
            return Result.success(true)
        }
        return Result.failure(Exception("Trip ID mismatch"))
    }
}
