package com.transitops.driver.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.transitops.driver.model.Driver
import com.transitops.driver.model.Expense
import com.transitops.driver.model.Trip
import com.transitops.driver.repository.DriverRepository
import com.transitops.driver.repository.RepositoryProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class DriverViewModel(
    private val repository: DriverRepository = RepositoryProvider.driverRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<DriverUiState>(DriverUiState.Loading)
    val uiState: StateFlow<DriverUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = DriverUiState.Loading
            val driverResult = repository.getDriverProfile()
            val tripResult = repository.getActiveTrip()

            if (driverResult.isSuccess && tripResult.isSuccess) {
                _uiState.value = DriverUiState.Success(
                    driver = driverResult.getOrThrow(),
                    activeTrip = tripResult.getOrThrow()
                )
            } else {
                val errorMsg = driverResult.exceptionOrNull()?.message 
                    ?: tripResult.exceptionOrNull()?.message 
                    ?: "Unknown Error"
                _uiState.value = DriverUiState.Error(errorMsg)
            }
        }
    }

    fun updateTripStatus(tripId: String, nextStatus: String) {
        viewModelScope.launch {
            val result = repository.updateTripStatus(tripId, nextStatus)
            if (result.isSuccess) {
                loadData() // Reload profiles & trips
            }
        }
    }

    fun submitExpense(amount: Double, category: String, description: String) {
        val currentState = _uiState.value
        if (currentState is DriverUiState.Success) {
            val activeTripId = currentState.activeTrip?.id ?: "no_active_trip"
            val vehicleId = currentState.activeTrip?.vehicleId ?: "no_active_vehicle"
            
            viewModelScope.launch {
                val expense = Expense(
                    id = "exp_" + System.currentTimeMillis(),
                    vehicleId = vehicleId,
                    tripId = activeTripId,
                    amount = amount,
                    category = category,
                    description = description,
                    date = "2026-07-12"
                )
                repository.submitExpense(expense)
            }
        }
    }

    fun completeTrip(tripId: String, finalOdometer: Double, fuelCost: Double, fuelLiters: Double) {
        viewModelScope.launch {
            val result = repository.completeTrip(tripId, finalOdometer, fuelCost, fuelLiters)
            if (result.isSuccess) {
                loadData()
            }
        }
    }
}

sealed interface DriverUiState {
    object Loading : DriverUiState
    data class Success(
        val driver: Driver,
        val activeTrip: Trip?
    ) : DriverUiState
    data class Error(val message: String) : DriverUiState
}
