# TransitOps: Full-Stack Web Implementation Plan

This implementation plan details the simultaneous build-out of the backend (Prisma, MySQL, Next.js API Routes) and frontend (Next.js 16, TypeScript, Tailwind CSS, Shadcn UI, React Hook Form, Zod) for **TransitOps**.

## Target Roles & Permissions (RBAC)
* **Fleet Manager:** Oversees fleet assets, maintenance logs, vehicle registration, and general configurations. Has full read-write permissions across all tables.
* **Driver:** Schedules trips, drafts delivery dispatch worksheets, and manages active delivery states. Has read-write access for trips but cannot edit vehicle registrations, compliance, or safety logs.
* **Safety Officer:** Audits driver compliance, monitors license expiry countdowns, evaluates safety metrics, and suspends/unsuspends drivers.
* **Financial Analyst:** Reviews fuel costs, maintenance receipts, expense line-items, operating efficiency, and computes ROI metrics. Has restricted write access (cannot modify trip dispatches or registries).

The project is structured into **5 sequential steps**. 

> [!IMPORTANT]
> At the completion of each step, the developer agent MUST:
> 1. Verify/test the APIs and features for that module.
> 2. Ask the user whether they want to commit the verified changes to Git.
> 3. Obtain explicit user permission before proceeding to build the next module.
> 
> All database seeds, test inputs, and UI displays MUST use localized Indian details: INR currency (₹), Indian mobile contact formats (+91 XXXXX XXXXX), Indian RTO registration plate numbers (e.g., MH-12-PQ-1234), and Indian city/route names (e.g., Mumbai to Pune).

---

## Step 1: Core Database, Authentication, and Layout Setup
Build the database foundation, implement the custom JWT authentication layer, and design the initial layout structure supporting role switching.

### 1.1 Tasks & Deliverables
* **Gitignore Audit (Confidentiality Enforcement):**
  * Verify `.gitignore` configuration explicitly to prevent tracking of any secret configurations, environment files (`.env`, `.env.local`), database connection strings, or credentials BEFORE creating any credentials or writing confidential/sensitive components.
* **Database Setup:** 
  * Initialize Prisma with MySQL.
  * Define `User` and `Role` models supporting the four enums: `FLEET_MANAGER`, `DRIVER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`.
* **Backend API:** 
  * `POST /api/auth/login` (Verify credentials with bcrypt, generate JWT).
  * `GET /api/auth/me` (Middleware/helper for parsing & validating JWT, returning user profile and active role).
* **Frontend Pages:**
  * Base layout with theme toggle (Dark Mode bonus) and Role indicator badge.
  * Login screen using `react-hook-form`, `zod`, and Shadcn UI.
  * Auth contexts/hooks for managing session state and RBAC policies.

### 1.2 Verification & API Testing
* **Test Case 1:** Attempt log in with invalid credentials -> Verify `401 Unauthorized`.
* **Test Case 2:** Log in with seeded admin credentials -> Verify `200 OK` and receipt of valid JWT.
* **Test Case 3:** Access `/api/auth/me` with JWT header -> Verify user profile response.

---

## Step 2: Vehicle Registry & Driver Management Modules
Implement full CRUD operations for vehicles and drivers, enforcing uniqueness and validation rules.

### 2.1 Tasks & Deliverables
* **Database Models:**
  * Define `Vehicle` and `Driver` models.
* **Backend API:**
  * `GET /api/vehicles` and `POST /api/vehicles` (Enforce unique registration number).
  * `PUT /api/vehicles/:id` and `DELETE /api/vehicles/:id`.
  * `GET /api/drivers` and `POST /api/drivers` (Validate license expiry dates and formats).
  * `PUT /api/drivers/:id` and `DELETE /api/drivers/:id`.
* **Frontend Pages:**
  * **Vehicle Registry Page:** List, registration modal, search, and status updates (Available, In Shop, Retired, On Trip).
  * **Driver Management Page:** List, registration form (with date pickers for license expiry), safety score displays.

### 2.2 Verification & API Testing
* **Test Case 1:** Try to register a duplicate vehicle registration number -> Verify `400 Bad Request` conflict error.
* **Test Case 2:** Create vehicle with model, capacity, status.
* **Test Case 3:** Register a driver with an expired license date -> Verify error indicating driver license is expired.

---

## Step 3: Trip Dispatch & Lifecycle Validation
Build the trip management system, which enforces the core operational business rules.

### 3.1 Tasks & Deliverables
* **Database Models:**
  * Define `Trip` model.
* **Backend API:**
  * `POST /api/trips` (Create trip draft).
  * `PUT /api/trips/:id/dispatch` (Perform validation and set status = Dispatched; triggers push notifications/alarms to assigned driver).
  * `PUT /api/trips/:id/status` (Update Zomato-style intermediate states: 'En Route to Pickup', 'Loading Cargo', 'In Transit').
  * `PUT /api/trips/:id/complete` (Record final odometer & fuel usage, restore status = Available).
  * `PUT /api/trips/:id/cancel` (Restore driver and vehicle status = Available).
* **Validation Middleware/Rules:**
  * Prevent dispatch if vehicle is `Retired` or `In Shop`.
  * Prevent dispatch if driver has expired license or status is `Suspended`.
  * Prevent dispatch if driver or vehicle is already `On Trip`.
  * Ensure cargo weight $\le$ vehicle load capacity.
* **Frontend Pages:**
  * **Trip Planner Dashboard:** Forms to select available drivers and vehicles (dynamic filters that hide occupied/retired/suspended/in-shop resources).
  * **Active Dispatch Panel:** View ongoing trips, with action buttons to "Complete" (odometer/fuel input form) or "Cancel" trips.

### 3.2 Verification & API Testing
* **Test Case 1:** Dispatch a trip with cargo weight exceeding vehicle limit -> Verify rejection.
* **Test Case 2:** Dispatch a trip successfully -> Verify both vehicle and driver automatically change status to `On Trip`.
* **Test Case 3:** Complete the trip -> Verify vehicle/driver change back to `Available`.

---

## Step 4: Maintenance & Expense Management
Handle vehicle upkeep, automatically removing vehicles from the active pool and calculating lifetime costs.

### 4.1 Tasks & Deliverables
* **Database Models:**
  * Define `MaintenanceLog`, `FuelLog`, and `Expense` models.
* **Backend API:**
  * `POST /api/maintenance` (Open log -> Automatically sets vehicle to `In Shop`).
  * `PUT /api/maintenance/:id/close` (Close log -> Restores vehicle to `Available` unless retired).
  * `POST /api/expenses` (Record tolls, fuel, or miscellaneous costs).
* **Frontend Pages:**
  * **Maintenance Portal:** Add maintenance requests, view histories, and complete open repairs.
  * **Logbook Page:** Input logs for fuel transactions and general expenses.

### 4.2 Verification & API Testing
* **Test Case 1:** Open maintenance log for `Van-05` -> Verify vehicle status immediately becomes `In Shop`.
* **Test Case 2:** Try to select `Van-05` for a new trip dispatch -> Verify it is hidden or blocked from dispatch selection.
* **Test Case 3:** Close maintenance -> Verify vehicle is restored to `Available`.

---

## Step 5: Executive Dashboard, Analytics, and CSV Export
Provide fleet-wide intelligence, KPI visualization, and data extraction functionality.

### 5.1 Tasks & Deliverables
* **Backend API:**
  * `GET /api/dashboard/kpis` (Compute real-time fleet utilization, active vehicles, duty status).
  * `GET /api/analytics/performance` (Calculate fuel efficiency, operating costs, and ROI per vehicle).
  * `/api/analytics/export` (Stream data as CSV format).
* **Frontend Pages:**
  * **KPI Dashboard:** Visual metrics cards.
  * **Analytics Page:** Charts showing operational cost trends and ROI benchmarks (using Recharts).
  * **Export Panel:** Buttons to download reports.

### 5.2 Verification & API Testing
* **Test Case 1:** Verify calculation formulas:
  * $\text{Fleet Utilization (\%)} = \frac{\text{Active Vehicles}}{\text{Total Active + Available Vehicles}} \times 100$
  * $\text{Vehicle ROI (\%)} = \frac{\text{Revenue} - (\text{Fuel Cost} + \text{Maintenance Cost})}{\text{Acquisition Cost}} \times 100$
* **Test Case 2:** Trigger CSV export -> Verify response has headers `Content-Type: text/csv`.
