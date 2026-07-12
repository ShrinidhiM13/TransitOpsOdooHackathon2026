package com.transitops.driver.repository

import com.transitops.driver.model.Driver
import com.transitops.driver.model.Expense
import com.transitops.driver.model.Trip

interface DriverRepository {
    suspend fun getDriverProfile(): Result<Driver>
    suspend fun getActiveTrip(): Result<Trip?>
    suspend fun updateTripStatus(tripId: String, status: String): Result<Boolean>
    suspend fun submitExpense(expense: Expense): Result<Boolean>
    suspend fun completeTrip(tripId: String, finalOdometer: Double, fuelCost: Double, fuelLiters: Double): Result<Boolean>
}
