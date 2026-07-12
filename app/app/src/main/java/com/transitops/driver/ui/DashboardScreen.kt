package com.transitops.driver.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.transitops.driver.model.Driver
import com.transitops.driver.model.Trip
import com.transitops.driver.viewmodel.DriverUiState
import com.transitops.driver.viewmodel.DriverViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

// Zomato dark palette mappings
val DarkBg = Color(0xFF0B0F19)
val DarkCard = Color(0xFF151D30)
val DarkBorder = Color(0xFF2A3C64)
val AccentBlue = Color(0xFF3B82F6)
val AccentGreen = Color(0xFF10B981)
val AccentAmber = Color(0xFFF59E0B)

@Composable
fun DashboardScreen(
    viewModel: DriverViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
    ) {
        when (val state = uiState) {
            is DriverUiState.Loading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = AccentBlue
                )
            }
            is DriverUiState.Success -> {
                DashboardContent(
                    driver = state.driver,
                    activeTrip = state.activeTrip,
                    viewModel = viewModel
                )
            }
            is DriverUiState.Error -> {
                Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(text = "Error: ${state.message}", color = Color.Red, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { viewModel.loadData() },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
                    ) {
                        Text("Retry")
                    }
                }
            }
        }
    }
}

@Composable
fun DashboardContent(
    driver: Driver,
    activeTrip: Trip?,
    viewModel: DriverViewModel
) {
    val scrollState = rememberScrollState()
    var showCompleteDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // App Header Title
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Driver Portal",
                    color = Color.Gray,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = driver.name,
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Box(
                modifier = Modifier
                    .background(AccentGreen.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                    .border(1.dp, AccentGreen.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "★ ${driver.safetyScore} Safety",
                    color = AccentGreen,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Compliance check (Warning banner if license expires in < 30 days)
        val daysToExpiry = getDaysToExpiry(driver.licenseExpiryDate)
        if (daysToExpiry <= 30) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(AccentAmber.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                    .border(1.5.dp, AccentAmber, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Text(
                    text = "⚠ Compliance Warning: Your driving license expires in $daysToExpiry days (${driver.licenseExpiryDate}). Please renew immediately!",
                    color = AccentAmber,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Active Trip Card (Zomato-style progress timeline)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, DarkBorder, RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = DarkCard),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Current Assignment",
                        color = AccentBlue,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = activeTrip?.status ?: "No Active Trip",
                        color = if (activeTrip != null) AccentBlue else Color.Gray,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .background(
                                if (activeTrip != null) AccentBlue.copy(alpha = 0.15f) else Color.DarkGray,
                                RoundedCornerShape(4.dp)
                            )
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (activeTrip != null) {
                    Text(
                        text = "${activeTrip.source} → ${activeTrip.destination}",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Cargo: ${activeTrip.cargoWeight} kg | Distance: ${activeTrip.plannedDistance} km",
                        color = Color.LightGray,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Zomato style step actions button
                    when (activeTrip.status) {
                        "Dispatched" -> {
                            Button(
                                onClick = { viewModel.updateTripStatus(activeTrip.id, "En Route to Pickup") },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Start Trip", color = Color.White)
                            }
                        }
                        "En Route to Pickup" -> {
                            Button(
                                onClick = { viewModel.updateTripStatus(activeTrip.id, "Loading Cargo") },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = AccentAmber),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Arrived at Pickup", color = Color.White)
                            }
                        }
                        "Loading Cargo" -> {
                            Button(
                                onClick = { viewModel.updateTripStatus(activeTrip.id, "In Transit") },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Out for Delivery", color = Color.White)
                            }
                        }
                        "In Transit" -> {
                            Button(
                                onClick = { showCompleteDialog = true },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = AccentGreen),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Mark Delivered", color = Color.White)
                            }
                        }
                    }
                } else {
                    Text(
                        text = "You are currently off duty. Waiting for Fleet Manager dispatch.",
                        color = Color.Gray,
                        fontSize = 12.sp
                    )
                }
            }
        }

        // Quick Expense Logging Form (Room Sync cache)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, DarkBorder, RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = DarkCard),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Quick Incident & Expenses",
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )

                var amountText by remember { mutableStateOf("") }
                var categoryText by remember { mutableStateOf("Toll") }
                var descText by remember { mutableStateOf("") }
                var showSyncIndicator by remember { mutableStateOf(false) }

                TextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Amount (₹)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = DarkBg,
                        unfocusedContainerColor = DarkBg,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                TextField(
                    value = descText,
                    onValueChange = { descText = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = DarkBg,
                        unfocusedContainerColor = DarkBg,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Button(
                    onClick = {
                        val amount = amountText.toDoubleOrNull() ?: 0.0
                        if (amount > 0 && descText.isNotEmpty()) {
                            viewModel.submitExpense(amount, categoryText, descText)
                            amountText = ""
                            descText = ""
                            showSyncIndicator = true
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentGreen),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Log Expense (Offline Sync)")
                }

                if (showSyncIndicator) {
                    Text(
                        text = "✓ Logged locally. Synced to manager server automatically.",
                        color = AccentGreen,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                    LaunchedEffect(Unit) {
                        delay(3000)
                        showSyncIndicator = false
                    }
                }
            }
        }
    }

    // Complete Trip Confirmation Dialog (to record fuel details and final odometer)
    if (showCompleteDialog && activeTrip != null) {
        var finalOdometerText by remember { mutableStateOf("") }
        var fuelCostText by remember { mutableStateOf("") }
        var fuelLitersText by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showCompleteDialog = false },
            title = { Text("Complete Active Trip", color = Color.White, fontWeight = FontWeight.Bold) },
            containerColor = DarkCard,
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Enter final trip details to restore status to Available.", color = Color.LightGray, fontSize = 12.sp)
                    
                    TextField(
                        value = finalOdometerText,
                        onValueChange = { finalOdometerText = it },
                        label = { Text("Final Odometer Reading") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = TextFieldDefaults.colors(focusedContainerColor = DarkBg, unfocusedContainerColor = DarkBg, focusedTextColor = Color.White)
                    )

                    TextField(
                        value = fuelLitersText,
                        onValueChange = { fuelLitersText = it },
                        label = { Text("Fuel Added (Liters)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = TextFieldDefaults.colors(focusedContainerColor = DarkBg, unfocusedContainerColor = DarkBg, focusedTextColor = Color.White)
                    )

                    TextField(
                        value = fuelCostText,
                        onValueChange = { fuelCostText = it },
                        label = { Text("Total Fuel Cost (₹)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = TextFieldDefaults.colors(focusedContainerColor = DarkBg, unfocusedContainerColor = DarkBg, focusedTextColor = Color.White)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val odo = finalOdometerText.toDoubleOrNull() ?: 0.0
                        val cost = fuelCostText.toDoubleOrNull() ?: 0.0
                        val liters = fuelLitersText.toDoubleOrNull() ?: 0.0
                        if (odo > 0 && cost >= 0 && liters >= 0) {
                            viewModel.completeTrip(activeTrip.id, odo, cost, liters)
                            showCompleteDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentGreen)
                ) {
                    Text("Submit & Complete")
                }
            },
            dismissButton = {
                Button(
                    onClick = { showCompleteDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray)
                ) {
                    Text("Dismiss")
                }
            }
        )
    }
}

// Utility helper to calculate day count to expiry date
private fun getDaysToExpiry(expiryDateStr: String): Long {
    return try {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val expiry = sdf.parse(expiryDateStr)
        val diff = expiry.time - Date().time
        val days = TimeUnit.DAYS.convert(diff, TimeUnit.MILLISECONDS)
        if (days < 0) 0 else days
    } catch (e: Exception) {
        999
    }
}

// Simulated delay helper for Compose
suspend fun delay(timeMs: Long) {
    kotlinx.coroutines.delay(timeMs)
}
