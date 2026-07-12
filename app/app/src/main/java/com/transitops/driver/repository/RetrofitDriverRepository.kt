package com.transitops.driver.repository

import com.transitops.driver.model.Driver
import com.transitops.driver.model.Expense
import com.transitops.driver.model.Trip
import com.transitops.driver.network.DriverApiService
import com.transitops.driver.network.StatusUpdateBody
import com.transitops.driver.network.TripCompleteBody

class RetrofitDriverRepository(private val apiService: DriverApiService) : DriverRepository {
    
    override suspend fun getDriverProfile(): Result<Driver> {
        return try {
            val response = apiService.getDriverProfile()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.user)
            } else {
                Result.failure(Exception("Failed to fetch profile: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getActiveTrip(): Result<Trip?> {
        return try {
            val response = apiService.getActiveTrip()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.trip)
            } else {
                Result.failure(Exception("Failed to fetch active trip: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateTripStatus(tripId: String, status: String): Result<Boolean> {
        return try {
            val response = apiService.updateTripStatus(tripId, StatusUpdateBody(status))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(true)
            } else {
                Result.failure(Exception("Failed to update status: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun submitExpense(expense: Expense): Result<Boolean> {
        return try {
            val response = apiService.submitExpense(expense)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(true)
            } else {
                Result.failure(Exception("Failed to submit expense: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun completeTrip(
        tripId: String,
        finalOdometer: Double,
        fuelCost: Double,
        fuelLiters: Double
    ): Result<Boolean> {
        return try {
            val response = apiService.completeTrip(
                tripId, 
                TripCompleteBody(finalOdometer, fuelCost, fuelLiters)
            )
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(true)
            } else {
                Result.failure(Exception("Failed to complete trip: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
