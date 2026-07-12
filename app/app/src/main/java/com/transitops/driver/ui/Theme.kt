package com.transitops.driver.ui

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// ─── Custom Palette ───────────────────────────────────────────────────────────
// Exact hex values from brand palette
val Brilliance        = Color(0xFFFCFDFD) // #fcfdfd - Lightest BG
val SpringtimeRain    = Color(0xFFEDEFF3) // #edeff3 - Light surface
val WindWeaver        = Color(0xFFC6D1D7) // #c6d1d7 - Border / divider
val WildThistle       = Color(0xFF9FA0B5) // #9fa0b5 - Muted text
val SoothingSapphire  = Color(0xFF2F7EDA) // #2f7eda - Primary accent
val Blackwater        = Color(0xFF555663) // #555663 - Secondary text

// Derived tokens
val SapphireLight     = Color(0xFF4D94EB) // lighter primary for dark hover
val SapphireDark      = Color(0xFF1E67C2) // darker primary for light hover
val SuccessGreen      = Color(0xFF2E7D32)
val SuccessGreenDark  = Color(0xFF81C784)
val ErrorRed          = Color(0xFFD32F2F)
val ErrorRedDark      = Color(0xFFE57373)
val WarnAmber         = Color(0xFFF57C00)
val WarnAmberDark     = Color(0xFFFFB74D)
val DarkBackground    = Color(0xFF1C1D22)
val DarkSurface       = Color(0xFF2B2D35)

private val TransitOpsLightColors = lightColorScheme(
    primary          = SoothingSapphire,
    onPrimary        = Brilliance,
    primaryContainer = SpringtimeRain,
    onPrimaryContainer = Blackwater,

    secondary        = Blackwater,
    onSecondary      = Brilliance,
    secondaryContainer = WindWeaver,
    onSecondaryContainer = DarkBackground,

    tertiary         = WildThistle,
    onTertiary       = Brilliance,

    background       = Brilliance,
    onBackground     = Color(0xFF111215),
    surface          = SpringtimeRain,
    onSurface        = Color(0xFF111215),
    surfaceVariant   = WindWeaver,
    onSurfaceVariant = Blackwater,

    outline          = WindWeaver,
    error            = ErrorRed,
    onError          = Brilliance,
)

private val TransitOpsDarkColors = darkColorScheme(
    primary          = SoothingSapphire,
    onPrimary        = Brilliance,
    primaryContainer = Color(0xFF1A3A5C),
    onPrimaryContainer = WindWeaver,

    secondary        = WindWeaver,
    onSecondary      = DarkBackground,
    secondaryContainer = Blackwater,
    onSecondaryContainer = Brilliance,

    tertiary         = WildThistle,
    onTertiary       = DarkBackground,

    background       = DarkBackground,
    onBackground     = Brilliance,
    surface          = DarkSurface,
    onSurface        = Brilliance,
    surfaceVariant   = Color(0xFF3A3D4A),
    onSurfaceVariant = WindWeaver,

    outline          = Blackwater,
    error            = ErrorRedDark,
    onError          = Color(0xFF601010),
)

// ─── Theme Composable ─────────────────────────────────────────────────────────
@Composable
fun TransitOpsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) TransitOpsDarkColors else TransitOpsLightColors

    // Update system bar colors to match theme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.surface.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
