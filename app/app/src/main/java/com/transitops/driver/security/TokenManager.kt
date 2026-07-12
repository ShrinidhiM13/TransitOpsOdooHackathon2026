package com.transitops.driver.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenManager(context: Context) {
    
    private val prefs: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                "transitops_secure_prefs",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Fallback to normal shared preferences in case keystore/masterkey creation fails in older emulators
            context.getSharedPreferences("transitops_fallback_prefs", Context.MODE_PRIVATE)
        }
    }

    /**
     * Save the JWT authentication token securely
     */
    fun saveToken(token: String) {
        prefs.edit().putString(KEY_JWT_TOKEN, token).apply()
    }

    /**
     * Fetch the saved JWT token. Returns null if unauthenticated.
     */
    fun getToken(): String? {
        return prefs.getString(KEY_JWT_TOKEN, null)
    }

    /**
     * Remove the active session token
     */
    fun clearToken() {
        prefs.edit().remove(KEY_JWT_TOKEN).apply()
    }

    /**
     * Check if a valid session is active
     */
    fun isLoggedIn(): Boolean {
        return getToken() != null
    }

    companion object {
        private const val KEY_JWT_TOKEN = "jwt_token"
    }
}
