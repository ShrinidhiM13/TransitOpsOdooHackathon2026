package com.transitops.driver.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.transitops.driver.network.NetworkConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

class LoginViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChange(value: String) {
        _uiState.value = _uiState.value.copy(email = value, errorMessage = null)
    }

    fun onPasswordChange(value: String) {
        _uiState.value = _uiState.value.copy(password = value, errorMessage = null)
    }

    fun login(onSuccess: (token: String) -> Unit) {
        val state = _uiState.value
        if (state.email.isBlank()) {
            _uiState.value = state.copy(errorMessage = "Email cannot be blank.")
            return
        }
        if (state.password.isBlank()) {
            _uiState.value = state.copy(errorMessage = "Password cannot be blank.")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isLoading = true, errorMessage = null)
            try {
                val url = URL("${NetworkConfig.BASE_URL}/api/auth/login")
                val connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                    connectTimeout = 8000
                    readTimeout = 8000
                }

                val body = JSONObject()
                    .put("email", state.email.trim())
                    .put("password", state.password)
                    .toString()

                OutputStreamWriter(connection.outputStream).use {
                    it.write(body)
                    it.flush()
                }

                val responseCode = connection.responseCode
                val responseStream = if (responseCode in 200..299) {
                    connection.inputStream
                } else {
                    connection.errorStream
                }

                val responseBody = responseStream?.bufferedReader()?.readText() ?: "{}"
                val json = JSONObject(responseBody)

                if (json.optBoolean("success", false)) {
                    val token = json.optString("token", "")
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onSuccess(token)
                } else {
                    val msg = json.optString("message", "Login failed. Please check credentials.")
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = msg)
                }

                connection.disconnect()

            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Connection error: ${e.localizedMessage ?: "Network unreachable."}"
                )
            }
        }
    }
}
