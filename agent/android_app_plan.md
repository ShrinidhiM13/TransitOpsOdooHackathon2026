# TransitOps: Driver Android App Implementation Plan

This implementation plan details the build-out of the mobile application for **Drivers** using Kotlin, Jetpack Compose, Retrofit, Room (for offline caching), and MVVM architecture.

The project is structured into **5 sequential steps**. 

> [!IMPORTANT]
> At the completion of each step, the developer agent MUST:
> 1. Verify/test the APIs and app features.
> 2. Ask the user whether they want to commit the verified changes to Git.
> 3. Obtain explicit user permission before proceeding to build the next module.
> 
> All mock data, UI displays, and user input fields MUST use localized Indian details: INR currency (₹), Indian mobile contact formats (+91 XXXXX XXXXX), Indian RTO registration plate numbers (e.g., MH-12-PQ-1234), and Indian route details (e.g., Mumbai to Pune).

---

## Step 1: Project Setup, Networking, and Authentication Screen
Establish the base architecture, storage for secure tokens, and the login experience.

### 1.1 Tasks & Deliverables
* **Gitignore Audit (Confidentiality Enforcement):**
  * Verify `.gitignore` configuration explicitly to prevent tracking of secret keystores, API endpoints, environment configs (`secrets.xml`, custom properties), or tokens BEFORE writing sensitive network client parameters or key storage functions.
* **Project Setup:** 
  * Initialize a standard Android app using Kotlin, Gradle, Jetpack Compose, and Hilt/Koin for dependency injection.
  * Add the `SYSTEM_ALERT_WINDOW` (Display over other apps / Draw overlays) permission declaration in `AndroidManifest.xml`.
  * Implement utility helper check/intent handler to request permission from System Settings if not granted.
* **Networking & DB:** Setup Retrofit client with Interceptors for JWT authentication headers, and initialize Room DB.
* **Security:** Use `EncryptedSharedPreferences` for secure token storage.
* **Authentication UI:** Create a login interface using Compose. Embody TransitOps styling. Include form validation.

### 1.2 Verification & Testing
* **Test Case 1:** Run local emulator testing for invalid credentials -> Verify error message displays.
* **Test Case 2:** Submit correct driver credentials -> Verify token storage and automatic navigation to Home Screen.
* **Test Case 3:** Test JWT inclusion in request header on subsequent mock requests.

---

## Step 2: Driver Dashboard & Profile Panel
Load active driver configurations and compliance metrics.

### 2.1 Tasks & Deliverables
* **UI Layout:** Design a main dashboard displaying the Driver's details (Name, Contact, License Expiry Date, Safety Score).
* **Compliance Checks:** Create visual warning banners if the license expiration date is under 30 days away.
* **Backend Connection:** Implement `GET /api/drivers/me` or similar endpoint integration to fetch stats dynamically.

### 2.2 Verification & Testing
* **Test Case 1:** Verify the data displayed matches database records for the driver.
* **Test Case 2:** Verify that the safety score updates appropriately.
* **Test Case 3:** Test layout responsiveness on various screen sizes and dark mode support.

---

## Step 3: Assigned Trip View & Dispatch Notification (Zomato Style)
Display live cargo dispatches, trigger notification alerts on delivery assignments, and handle step-by-step progress tracking.

### 3.1 Tasks & Deliverables
* **Assignment Notifications:** Setup Firebase Cloud Messaging (FCM) or high-priority local notifications to alert the driver immediately when a new delivery is assigned to them.
* **Fullscreen Overlay Alert (Zomato-style):** 
  * Implement an Android Service utilizing `WindowManager` with `TYPE_APPLICATION_OVERLAY` layouts.
  * Trigger this overlay service upon receiving a new trip dispatch alert, popping up a fullscreen layout containing the trip details (Origin, Route, Cargo weight) and a flashing alert sound/button.
  * Display this layout over any active apps or when the screen is locked, ensuring the driver never misses a new dispatch until they accept/acknowledge or dismiss it.
* **Active Trip Screen:** Display the active trip card containing Source, Destination, Cargo Weight, Route info, and a step-by-step progress timeline.
* **Zomato-style Lifecycle Actions:** Implement a sequential button interface:
  * State 1: **Dispatched** -> Action: **"Start Trip"** (updates status to 'En Route to Pickup').
  * State 2: **En Route to Pickup** -> Action: **"Arrived at Pickup"** (updates status to 'Loading Cargo').
  * State 3: **Loading Cargo** -> Action: **"Out for Delivery"** (updates status to 'In Transit').
  * State 4: **In Transit** -> Action: **"Mark Delivered"** (switches screen to Step 5 Completion Flow).
* **Offline Caching:** Cache trip details in Room database for offline status transitions and auto-sync when network reconnects.

### 3.2 Verification & Testing
* **Test Case 1:** Verify that assigning a trip on the manager dashboard triggers a device notification alert on the mobile app.
* **Test Case 2:** Step through each status transition ("Start Trip" -> "Arrived" -> "Out for Delivery" -> "Mark Delivered") and verify corresponding API payloads and database updates.
* **Test Case 3:** Test offline transitions: perform transitions while offline -> Verify changes cache locally and synchronize once online.

---

## Step 4: Expense Logging & Fuel Recording (Offline-First)
Empower drivers to report fuel stops and expenses on the road, even without stable internet.

### 4.1 Tasks & Deliverables
* **Forms:** Build easy-to-use Compose forms for:
  * Fuel logging: Liters, cost per liter, total cost.
  * Expense logging: Amount, category (Tolls, Maintenance, Misc), and description.
* **Sync Engine:** Store these entries locally in Room database if offline. Implement a background worker (using WorkManager) to automatically upload cached data when the network is restored.

### 4.2 Verification & Testing
* **Test Case 1:** Input a fuel log while online -> Verify API receives payload immediately.
* **Test Case 2:** Go offline -> Input a toll expense -> Verify it saves to Room. Turn internet back on -> Verify WorkManager triggers upload.

---

## Step 5: Trip Completion Flow
Wrap up deliveries and release resources.

### 5.1 Tasks & Deliverables
* **Completion Interface:** Implement a "Complete Trip" form.
* **Form Inputs:** Input final odometer reading.
* **Backend Action:** Call `/api/trips/:id/complete` with final details.
* **State Reset:** Ensure UI transitions back to the "Available" state and prepares the driver for new assignments.

### 5.2 Verification & Testing
* **Test Case 1:** Complete a trip -> Verify that odometer updates on server.
* **Test Case 2:** Check Fleet Manager dashboard -> Verify that the driver and vehicle are marked `Available`.
