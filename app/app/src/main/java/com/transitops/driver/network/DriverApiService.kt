package com.transitops.driver.network

import com.transitops.driver.model.Driver
import com.transitops.driver.model.Expense
import com.transitops.driver.model.Trip
import retrofit2.Response
import retrofit2.http.*

interface DriverApiService {
    @GET("/api/auth/me")
    suspend fun getDriverProfile(): Response<DriverResponse>

    @GET("/api/drivers/me/active-trip")
    suspend fun getActiveTrip(): Response<TripResponse>

    @PUT("/api/trips/{id}/status")
    suspend fun updateTripStatus(
        @Path("id") id: String,
        @Body body: StatusUpdateBody
    ): Response<StatusUpdateResponse>

    @POST("/api/expenses")
    suspend fun submitExpense(
        @Body expense: Expense
    ): Response<ExpenseResponse>

    @PUT("/api/trips/{id}/complete")
    suspend fun completeTrip(
        @Path("id") id: String,
        @Body body: TripCompleteBody
    ): Response<TripCompleteResponse>
}

// Response Wrappers matching api_spec.json structure
data class DriverResponse(val success: Boolean, val user: Driver)
data class TripResponse(val success: Boolean, val trip: Trip?)
data class StatusUpdateBody(val status: String)
data class StatusUpdateResponse(val success: Boolean, val message: String)
data class ExpenseResponse(val success: Boolean, val message: String)
data class TripCompleteBody(val finalOdometer: Double, val fuelCost: Double, val fuelConsumedLiters: Double)
data class TripCompleteResponse(val success: Boolean, val message: String)
