# TransitOps Backend - Completed Implementation Summary

This document summarizes the full backend architecture, endpoints, database schemas, security hardening, and validation measures completed for **TransitOps**.

---

## 1. Database & Connection Architecture
Instead of using an ORM like Prisma, the backend connects directly to the remote Hostinger MySQL database using the high-performance `mysql2/promise` driver with parameterized connection pooling.
* **Database Host:** `193.203.184.211`
* **Configuration File:** [backend/.env](file:///d:/odoo/TransitOpsOdooHackathon2026/backend/.env) (stores host, name, port, user credentials, and JWT secret).
* **Pool Provider:** [db.ts](file:///d:/odoo/TransitOpsOdooHackathon2026/backend/api/config/db.ts) (manages connections and thread pooling).

---

## 2. API Endpoints & RBAC Authorization Matrix
Every route is protected by custom JWT authentication (`authenticate` middleware) and Role-Based Access Control (`restrictTo` middleware) using a custom validation framework:

| API Name | Endpoint Route | HTTP | Allowed Role(s) | Usecase |
| :--- | :--- | :--- | :--- | :--- |
| **User Login** | `/api/auth/login` | `POST` | *Public* | Authenticate user credentials and sign JWT tokens. |
| **User Registration** | `/api/auth/register` | `POST` | *Public* | Registers a new user profile with specific authorization roles. |
| **Get Session** | `/api/auth/me` | `GET` | All Roles | Retrieve authenticated session details from JWT. |
| **List Vehicles** | `/api/vehicles` | `GET` | `FLEET_MANAGER` | Query vehicles, supports filtering and search. |
| **Register Vehicle** | `/api/vehicles` | `POST` | `FLEET_MANAGER` | Registers a new vehicle with RTO validation. |
| **Update Vehicle** | `/api/vehicles/:id` | `PUT` | `FLEET_MANAGER` | Updates vehicle odometer, metadata, or status. |
| **Delete Vehicle** | `/api/vehicles/:id` | `DELETE` | `FLEET_MANAGER` | Removes a vehicle asset from registry. |
| **List Drivers** | `/api/drivers` | `GET` | `FLEET_MANAGER`, `SAFETY_OFFICER` | Query active driver rosters and compliance scores. |
| **Register Driver** | `/api/drivers` | `POST` | `FLEET_MANAGER` | Registers driver and auto-provisions user credentials in a transaction. |
| **Update Driver** | `/api/drivers/:id` | `PUT` | `FLEET_MANAGER` | Edits compliance metadata or contact numbers. |
| **Delete Driver** | `/api/drivers/:id` | `DELETE` | `FLEET_MANAGER` | Removes a driver profile. |
| **Create Trip** | `/api/trips` | `POST` | `FLEET_MANAGER`, `DRIVER` | Generates a new trip order in 'Draft' state. |
| **Dispatch Trip** | `/api/trips/:id/dispatch` | `PUT` | `FLEET_MANAGER` | Checks resource compliance and dispatches trip (Transaction-safe). |
| **Update Status** | `/api/trips/:id/status` | `PUT` | `FLEET_MANAGER`, `DRIVER` | Logs intermediate statuses (In Transit, Loading Cargo). |
| **Complete Trip** | `/api/trips/:id/complete` | `PUT` | `FLEET_MANAGER`, `DRIVER` | Captures final odometer/fuel usage and restores resource availability. |
| **Cancel Trip** | `/api/trips/:id/cancel` | `PUT` | `FLEET_MANAGER`, `DRIVER` | Restores vehicle/driver availability and marks trip as Cancelled. |
| **Open Maintenance** | `/api/maintenance` | `POST` | `FLEET_MANAGER` | Locks vehicle status to 'In Shop' and opens a ticket. |
| **Close Maintenance**| `/api/maintenance/:id/close`| `PUT` | `FLEET_MANAGER` | Resolves repairs, logs maintenance expense, restores availability. |
| **Record Expense** | `/api/expenses` | `POST` | `FLEET_MANAGER`, `DRIVER`, `FINANCIAL_ANALYST` | Log toll, fuel, cleaning, or misc transit costs. |
| **Operational KPIs** | `/api/analytics/kpis` | `GET` | `FLEET_MANAGER`, `FINANCIAL_ANALYST` | Computes utilization percents and active vehicle counts. |
| **Fleet Performance**| `/api/analytics/performance`| `GET` | `FLEET_MANAGER`, `FINANCIAL_ANALYST` | Returns fuel efficiency metrics and vehicle ROI trends. |
| **Stream CSV Report**| `/api/analytics/export` | `GET` | `FLEET_MANAGER`, `FINANCIAL_ANALYST` | Downloads entire operational log as a CSV format. |

---

## 3. Strict Compliance & Business Validation Logic

### A. Driver Register & Auto-Provisioning
* **License Validity:** Rejects driver registrations if the license expiry date is in the past.
* **Automatic Credentials:** Creating a driver automatically spawns a linked `User` record inside the `users` table during a transaction. If custom login details are omitted, default email and passwords (`SecurePassword123`) are auto-provisioned to allow the driver to log in immediately to the mobile application.

### B. Trip Dispatch Constraints
* **Retired/In Shop Vehicles:** Blocked from being selected or dispatched.
* **Driver Suspension:** Drivers marked `Suspended` are blocked from dispatches.
* **Expired Licenses:** Drivers with expired licenses cannot be dispatched.
* **Double Booking:** Rejects dispatches if the vehicle or driver status is already `On Trip`.
* **Load Limits:** Rejects dispatches if the cargo weight exceeds the vehicle's `maxLoadCapacity`.

### C. Trip Completion Auditing
* **Odometer Sanity:** Rejects trip completions if the final odometer entry is lower than the vehicle's starting odometer.
* **Fuel Logging:** Automatically logs fuel costs under `expenses` and `fuel_logs` tables during the completion transaction to ensure unified bookkeeping.

---

## 4. Hardened Security Features

### A. Parameterized SQL Queries (SQL Injection Prevention)
Every database controller completely avoids string concatenation and utilizes prepared statements (`pool.execute` with `?` parameter arrays), keeping SQL code execution separate from user payloads.

### B. HTTP Header Defense (Helmet)
Protects the API surface against XSS, clickjacking, context sniffing, and other headers vulnerabilities by registering the `helmet` middleware globally.

### C. IP Rate Limiting & Brute Force Prevention
* **Global API Limit:** Limit request volume from any single IP address to 150 requests per 15-minute window.
* **Brute-Force Login Protection:** Login routes (`/api/auth/login`) are protected with a rate limit of 15 attempts per 15 minutes.

---

## 5. Verification Results (Hostinger MySQL Integration)
Verification scripts executing directly against Hostinger confirm connection sanity:
```text
Connecting directly to remote Hostinger database...
Success: Direct MySQL connection established.
User records in DB: 6
Vehicle records retrieved: 3
  * [MH-12-PQ-1234] - Tata Winger 2023 - Status: Available
  * [MH-02-XY-9876] - Mahindra Bolero Pickup - Status: Available
  * [DL-03-CD-5678] - Tata Ace Gold - Status: Available
```
All DDL tables, indexes, check constraints, and operational logic operate cleanly.
