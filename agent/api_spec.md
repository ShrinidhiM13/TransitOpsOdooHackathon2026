# TransitOps API Specification (India Localization)

This document details the REST API endpoints, request bodies, and response structures for **TransitOps**, customized with Indian localization (MH registration plates, INR currency, Indian mobile contacts, and regional routes).

All request and response bodies use JSON formatting. API requests require a JWT token in the `Authorization` header: `Authorization: Bearer <token>`.

---

## 1. Authentication

### 1.1 User Login
* **URL:** `/api/auth/login`
* **Method:** `POST`
* **Request Body:**
```json
{
  "email": "manager@transitops.in",
  "password": "SecurePassword123"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_90218392",
    "name": "Priya Sharma",
    "email": "manager@transitops.in",
    "role": "FLEET_MANAGER"
  }
}
```
* **Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 1.2 Get Current User Session
* **URL:** `/api/auth/me`
* **Method:** `GET`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "usr_90218392",
    "name": "Priya Sharma",
    "email": "manager@transitops.in",
    "role": "FLEET_MANAGER"
  }
}
```

---

## 2. Dashboard KPIs

### 2.1 Get Operational Metrics
* **URL:** `/api/dashboard/kpis`
* **Method:** `GET`
* **Query Parameters (Optional):**
  * `vehicleType`: `VAN | TRUCK | CAR`
  * `region`: `North India | South India | East India | West India`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activeVehicles": 12,
    "availableVehicles": 25,
    "vehiclesInMaintenance": 3,
    "activeTrips": 12,
    "pendingTrips": 5,
    "driversOnDuty": 15,
    "fleetUtilizationPercent": 76.5
  }
}
```

---

## 3. Vehicle Registry

### 3.1 List Vehicles
* **URL:** `/api/vehicles`
* **Method:** `GET`
* **Query Parameters (Optional):**
  * `status`: `Available | On Trip | In Shop | Retired`
  * `type`: `VAN | TRUCK | CAR`
  * `search`: `MH-12-PQ-1234`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "vehicles": [
    {
      "id": "veh_0912380",
      "registrationNumber": "MH-12-PQ-1234",
      "model": "Tata Winger 2023",
      "type": "VAN",
      "maxLoadCapacity": 500,
      "odometer": 12450.5,
      "acquisitionCost": 1500000.00,
      "status": "Available",
      "region": "West India"
    }
  ]
}
```

### 3.2 Register Vehicle
* **URL:** `/api/vehicles`
* **Method:** `POST`
* **Request Body:**
```json
{
  "registrationNumber": "MH-12-PQ-1234",
  "model": "Tata Winger 2023",
  "type": "VAN",
  "maxLoadCapacity": 500,
  "odometer": 12000,
  "acquisitionCost": 1500000.00,
  "region": "West India"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Vehicle registered successfully",
  "vehicle": {
    "id": "veh_0912380",
    "registrationNumber": "MH-12-PQ-1234",
    "model": "Tata Winger 2023",
    "type": "VAN",
    "maxLoadCapacity": 500,
    "odometer": 12000,
    "acquisitionCost": 1500000.00,
    "status": "Available",
    "region": "West India"
  }
}
```

---

## 4. Driver Management

### 4.1 List Drivers
* **URL:** `/api/drivers`
* **Method:** `GET`
* **Query Parameters (Optional):**
  * `status`: `Available | On Trip | Off Duty | Suspended`
  * `search`: `Rahul`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "drivers": [
    {
      "id": "drv_102938",
      "name": "Rahul Sharma",
      "licenseNumber": "MH-12-2023-0045678",
      "licenseCategory": "MCWG/LMV",
      "licenseExpiryDate": "2027-12-31T00:00:00.000Z",
      "contactNumber": "+919876543210",
      "safetyScore": 95.5,
      "status": "Available"
    }
  ]
}
```

### 4.2 Register Driver
* **URL:** `/api/drivers`
* **Method:** `POST`
* **Request Body:**
```json
{
  "name": "Rahul Sharma",
  "licenseNumber": "MH-12-2023-0045678",
  "licenseCategory": "MCWG/LMV",
  "licenseExpiryDate": "2027-12-31",
  "contactNumber": "+919876543210",
  "safetyScore": 100.0
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Driver registered successfully",
  "driver": {
    "id": "drv_102938",
    "name": "Rahul Sharma",
    "licenseNumber": "MH-12-2023-0045678",
    "licenseCategory": "MCWG/LMV",
    "licenseExpiryDate": "2027-12-31T00:00:00.000Z",
    "contactNumber": "+919876543210",
    "safetyScore": 100.0,
    "status": "Available"
  }
}
```

---

## 5. Trip Management

### 5.1 Create Trip (Draft)
* **URL:** `/api/trips`
* **Method:** `POST`
* **Request Body:**
```json
{
  "source": "Warehouse Alpha, Mumbai",
  "destination": "Retail Outlet 4, Pune",
  "vehicleId": "veh_0912380",
  "driverId": "drv_102938",
  "cargoWeight": 450,
  "plannedDistance": 150.0
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Trip created as draft",
  "trip": {
    "id": "trp_890123",
    "source": "Warehouse Alpha, Mumbai",
    "destination": "Retail Outlet 4, Pune",
    "vehicleId": "veh_0912380",
    "driverId": "drv_102938",
    "cargoWeight": 450,
    "plannedDistance": 150.0,
    "status": "Draft",
    "createdAt": "2026-07-12T10:30:00.000Z"
  }
}
```
* **Error Response (400 Bad Request - Load Capacity Exceeded):**
```json
{
  "success": false,
  "message": "Cargo weight (550kg) exceeds vehicle capacity (500kg)"
}
```

### 5.2 Dispatch Trip
* **URL:** `/api/trips/:id/dispatch`
* **Method:** `PUT`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Trip dispatched. Vehicle and driver status updated to On Trip.",
  "trip": {
    "id": "trp_890123",
    "status": "Dispatched"
  }
}
```

### 5.3 Complete Trip
* **URL:** `/api/trips/:id/complete`
* **Method:** `PUT`
* **Request Body:**
```json
{
  "finalOdometer": 12600.5,
  "fuelConsumedLiters": 20.0,
  "fuelCost": 2100.00
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Trip completed successfully. Vehicle and driver status restored to Available.",
  "trip": {
    "id": "trp_890123",
    "status": "Completed"
  }
}
```

### 5.4 Cancel Trip
* **URL:** `/api/trips/:id/cancel`
* **Method:** `PUT`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Trip cancelled. Vehicle and driver status restored to Available.",
  "trip": {
    "id": "trp_890123",
    "status": "Cancelled"
  }
}
```

---

## 6. Maintenance Logs

### 6.1 Open Maintenance Record
* **URL:** `/api/maintenance`
* **Method:** `POST`
* **Request Body:**
```json
{
  "vehicleId": "veh_0912380",
  "description": "Routine 10k Oil Change and Brake Inspection",
  "type": "Scheduled",
  "cost": 5000.00,
  "startDate": "2026-07-12"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Maintenance log created. Vehicle marked 'In Shop'.",
  "maintenanceLog": {
    "id": "maint_304918",
    "vehicleId": "veh_0912380",
    "description": "Routine 10k Oil Change and Brake Inspection",
    "type": "Scheduled",
    "cost": 5000.00,
    "startDate": "2026-07-12T00:00:00.000Z",
    "status": "Open"
  }
}
```

### 6.2 Close Maintenance Record
* **URL:** `/api/maintenance/:id/close`
* **Method:** `PUT`
* **Request Body:**
```json
{
  "endDate": "2026-07-13",
  "finalCost": 6500.00,
  "notes": "Replaced front brake pads in addition to oil change."
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Maintenance completed. Vehicle status restored to Available.",
  "maintenanceLog": {
    "id": "maint_304918",
    "status": "Closed",
    "finalCost": 6500.00,
    "endDate": "2026-07-13T00:00:00.000Z"
  }
}
```

---

## 7. Fuel & Expense Management

### 7.1 Record Expense (Tolls, Cleaning, Misc)
* **URL:** `/api/expenses`
* **Method:** `POST`
* **Request Body:**
```json
{
  "vehicleId": "veh_0912380",
  "tripId": "trp_890123",
  "amount": 320.00,
  "category": "Toll",
  "description": "Mumbai-Pune Expressway Toll",
  "date": "2026-07-12"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "expense": {
    "id": "exp_401928",
    "vehicleId": "veh_0912380",
    "tripId": "trp_890123",
    "amount": 320.00,
    "category": "Toll",
    "date": "2026-07-12T00:00:00.000Z"
  }
}
```

---

## 8. Reports & Analytics

### 8.1 Get Fleet Performance Report
* **URL:** `/api/analytics/performance`
* **Method:** `GET`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "report": {
    "vehicles": [
      {
        "vehicleId": "veh_0912380",
        "registrationNumber": "MH-12-PQ-1234",
        "fuelEfficiencyKml": 7.5,
        "fleetUtilizationPercent": 85.0,
        "totalOperationalCost": 8920.00,
        "roiPercent": 15.8
      }
    ]
  }
}
```
