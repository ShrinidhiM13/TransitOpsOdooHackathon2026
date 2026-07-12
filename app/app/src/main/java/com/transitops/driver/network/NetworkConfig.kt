package com.transitops.driver.network

object NetworkConfig {
    /**
     * Swap this flag to toggle between local offline mock data and the real server endpoints.
     */
    const val USE_MOCK_DATA = false

    /**
     * Production API URL — deployed on Vercel.
     * All /api/* routes are handled by the Express backend via vercel.json routing.
     */
    const val BASE_URL = "https://transit-ops-odoo-hackathon2026.vercel.app"
}
