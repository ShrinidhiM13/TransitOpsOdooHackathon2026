package com.transitops.driver.network

import com.transitops.driver.model.Driver
import com.transitops.driver.model.Expense
import com.transitops.driver.model.Trip
import retrofit2.Response
import retrofit2.http.*

interface DriverApiService {

    /**
     * Login: POST /api/auth/login
     * Returns a JWT token on success for driver authentication.
     */
    @POST("/api/auth/login")
    suspend fun login(
        @Body body: LoginRequestBody
    ): Response<LoginResponse>

    /**
     * Me: GET /api/auth/me
     * Returns the authenticated user profile and nested driver record.
     */
    @GET("/api/auth/me")
    suspend fun getDriverProfile(): Response<DriverResponse>

    /**
     * Active Trip: GET /api/trips/active
     * Returns the active in-progress trip for the authenticated driver.
     * (Corrected from /api/drivers/me/active-trip to match backend route)
     */
    @GET("/api/trips/active")
    suspend fun getActiveTrip(): Response<TripResponse>

    /**
     * Update Status: PUT /api/trips/{id}/status
     * Advances the trip to the next lifecycle state.
     */
    @PUT("/api/trips/{id}/status")
    suspend fun updateTripStatus(
        @Path("id") id: String,
        @Body body: StatusUpdateBody
    ): Response<StatusUpdateResponse>

    /**
     * Submit Expense: POST /api/expenses
     * Records a road expense (toll, fuel, cleaning, misc).
     */
    @POST("/api/expenses")
    suspend fun submitExpense(
        @Body expense: Expense
    ): Response<ExpenseResponse>

    /**
     * Complete Trip: PUT /api/trips/{id}/complete
     * Finalises the trip with odometer and fuel data.
     */
    @PUT("/api/trips/{id}/complete")
    suspend fun completeTrip(
        @Path("id") id: String,
        @Body body: TripCompleteBody
    ): Response<TripCompleteResponse>
}

// ─── Request / Response DTOs ──────────────────────────────────────────────────
data class LoginRequestBody(val email: String, val password: String)
data class LoginResponse(val success: Boolean, val token: String?, val message: String?)
data class DriverResponse(val success: Boolean, val user: Driver, val driver: Driver?)
data class TripResponse(val success: Boolean, val trip: Trip?)
data class StatusUpdateBody(val status: String)
data class StatusUpdateResponse(val success: Boolean, val message: String)
data class ExpenseResponse(val success: Boolean, val message: String)
data class TripCompleteBody(val finalOdometer: Double, val fuelCost: Double, val fuelConsumedLiters: Double)
data class TripCompleteResponse(val success: Boolean, val message: String)
