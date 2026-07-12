package com.transitops.driver.repository

import com.transitops.driver.network.DriverApiService
import com.transitops.driver.network.NetworkConfig
import com.transitops.driver.security.TokenManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RepositoryProvider {

    // TokenManager must be initialised once from MainActivity via init()
    private var _tokenManager: TokenManager? = null

    fun init(tokenManager: TokenManager) {
        _tokenManager = tokenManager
    }

    private val apiService: DriverApiService by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            // JWT Auth interceptor – attaches Bearer token to every request
            .addInterceptor { chain ->
                val original = chain.request()
                val token = _tokenManager?.getToken()
                val request = if (!token.isNullOrBlank()) {
                    original.newBuilder()
                        .header("Authorization", "Bearer $token")
                        .build()
                } else {
                    original
                }
                chain.proceed(request)
            }
            .build()

        Retrofit.Builder()
            .baseUrl(NetworkConfig.BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(client)
            .build()
            .create(DriverApiService::class.java)
    }

    /**
     * Singleton instance of the DriverRepository.
     * Auto-resolves to mock or network based on NetworkConfig settings.
     */
    val driverRepository: DriverRepository by lazy {
        if (NetworkConfig.USE_MOCK_DATA) {
            MockDriverRepository()
        } else {
            RetrofitDriverRepository(apiService)
        }
    }
}
