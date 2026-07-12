package com.transitops.driver.network

object NetworkConfig {
    /**
     * Swap this flag to toggle between local offline mock data and the real server endpoints.
     */
    const val USE_MOCK_DATA = false
    
    /**
     * Target API URL. 10.0.2.2 points to localhost of the host machine from the Android emulator.
     */
    const val BASE_URL = "http://10.0.2.2:3000"
}
