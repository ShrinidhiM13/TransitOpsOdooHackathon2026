package com.transitops.driver.repository

import com.transitops.driver.network.DriverApiService
import com.transitops.driver.network.NetworkConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RepositoryProvider {
    
    private val apiService: DriverApiService by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
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
