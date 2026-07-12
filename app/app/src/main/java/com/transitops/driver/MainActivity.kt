package com.transitops.driver

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.transitops.driver.repository.RepositoryProvider
import com.transitops.driver.security.TokenManager
import com.transitops.driver.ui.DashboardScreen
import com.transitops.driver.ui.LoginScreen
import com.transitops.driver.ui.TransitOpsTheme
import com.transitops.driver.viewmodel.DriverViewModel

class MainActivity : ComponentActivity() {

    private lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialise TokenManager for secure encrypted storage
        tokenManager = TokenManager(this)

        // Wire the token manager into Retrofit's auth interceptor
        RepositoryProvider.init(tokenManager)

        // Request overlay permission for fullscreen dispatch pop-ups
        checkOverlayPermission()

        setContent {
            val systemDark = isSystemInDarkTheme()

            TransitOpsTheme(darkTheme = systemDark) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TransitOpsApp(tokenManager = tokenManager)
                }
            }
        }
    }

    private fun checkOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE)
            }
        }
    }

    companion object {
        private const val OVERLAY_PERMISSION_REQ_CODE = 101
    }
}

/**
 * Root composable that manages authentication state.
 * Switches between LoginScreen and DashboardScreen based on whether
 * a valid JWT token is stored in the secure TokenManager.
 */
@Composable
fun TransitOpsApp(tokenManager: TokenManager) {
    // Initialise from secure storage – start logged-in if a token exists
    var isAuthenticated by remember { mutableStateOf(tokenManager.isLoggedIn()) }

    if (isAuthenticated) {
        DashboardScreen(
            viewModel = DriverViewModel(),
            onLogout = {
                tokenManager.clearToken()
                isAuthenticated = false
            }
        )
    } else {
        LoginScreen(
            onLoginSuccess = { token ->
                tokenManager.saveToken(token)
                isAuthenticated = true
            }
        )
    }
}
