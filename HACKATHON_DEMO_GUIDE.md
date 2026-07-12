# TransitOps — Hackathon Submission Video Demo Guide

This step-by-step guide outlines how to record and showcase TransitOps for a winning hackathon submission. The video should highlight our roles-based portal, real-time WebSocket status updates, offline capability, and operational analytics.

---

## 🛠️ Setup for Recording

1. **Database**: Make sure your local MySQL instance is running and has the `transitops_db` schema loaded.
2. **Terminal 1 (Backend)**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm run dev
   ```
4. **Browsers**: Open two browser windows side-by-side or in separate workspaces:
   - **Window A (Admin/Manager)**: Open `http://localhost:3000` (logged in as **Fleet Manager**).
   - **Window B (Driver)**: Open `http://localhost:3000` (logged in as **Driver Rahul**).

---

## 🎥 Step-by-Step Recording Script

### Scene 1: Introduction & Login (0:00 - 0:30)
- **Visuals**: Show the TransitOps landing/login page.
- **Narrative**:
  > *"Welcome to TransitOps, a real-time fleet operations and logistics management control room. Built with Express, MySQL, Next.js, and WebSockets, TransitOps brings real-time, low-latency collaboration between drivers, fleet managers, safety officers, and financial analysts."*
- **Action**: Use the quick login credentials to log into the **Fleet Manager Dashboard**.

---

### Scene 2: Fleet Manager Dashboard & Operations (0:30 - 1:15)
- **Visuals**: Show the Fleet Manager interface. Click through the tabs: **Dashboard**, **Trips & Dispatch**, **Vehicle Registry**, **Drivers**, **Maintenance**, and **Analytics**.
- **Narrative**:
  > *"As a Fleet Manager, I have full operational visibility. I can manage our vehicle registry, track driver statuses, schedule maintenance logs, and dispatch active trips. Let's create a new trip draft."*
- **Action**:
  1. Click **Trips & Dispatch** tab.
  2. Fill out the "Create New Trip" form (e.g., Source: `Mumbai`, Destination: `Pune`, Vehicle: `MH-12-PQ-1234`, Driver: `Rahul Sharma`, Weight: `5000 kg`, Distance: `150 km`).
  3. Click **Create Trip Draft**.
  4. Find the newly created draft in the Trips table.

---

### Scene 3: Real-Time WebSocket Dispatch Overlay (1:15 - 2:00)
- **Visuals**: Show Window A (Fleet Manager) and Window B (Driver Rahul) side-by-side.
- **Action**:
  1. In Window A, click the **Dispatch** button on the trip we just created.
  2. **Watch Window B (Driver Rahul)**: Observe the immediate appearance of the **fullscreen overlay alert** accompanied by the **audio siren** in real-time without any page refresh!
- **Narrative**:
  > *"When the Fleet Manager dispatches the trip, our WebSocket server pushes the dispatch update immediately. The driver's device plays a siren alert and prompts them with a dispatch overlay with route details. No manual polling, no latency."*
- **Action**: In Window B (Driver), click **Accept & Start** on the overlay. The overlay disappears and displays the active trip panel.

---

### Scene 4: Live Trip Status Updates & Real-Time Sync (2:00 - 3:00)
- **Visuals**: Keep Window A (Fleet Manager) and Window B (Driver) side-by-side.
- **Action**:
  1. In Window B (Driver), click **Arrived at Source (Start Loading)** to update status to `Loading Cargo`.
  2. Notice that Window A (Fleet Manager)'s Trips list and Active Trips KPI immediately update to `Loading Cargo`.
  3. In Window B, click **Cargo Loaded (Start Transit)** to update to `In Transit`.
  4. Notice the real-time update in Window A.
  5. In Window B, click **Arrived at Destination (Complete Delivery)**.
  6. Fill in the completion form:
     - Final Odometer: `12,150` (starting was 12,000)
     - Fuel Added: `40 Liters`
     - Fuel Cost: `4,000 INR`
  7. Click **Submit & Complete**.
- **Narrative**:
  > *"As the driver updates the delivery states—from Pickup, to Loading Cargo, to In Transit, and finally completing the trip—the WebSocket connection keeps the Fleet Manager dashboard synchronized in real-time. Upon completion, the driver inputs final odometer and fuel metrics, automatically logging expenses and releasing both driver and vehicle back into the available pool."*

---

### Scene 5: Safety Officer Dashboard (3:00 - 3:45)
- **Visuals**: Log out from Window A and log in as the **Safety Officer** (`safety@transitops.in`).
- **Narrative**:
  > *"Next, the Safety Officer portal focuses on safety compliance. Here, we track safety scores, monitor driver license expirations with automated status alerts, and have immediate suspension overrides."*
- **Action**:
  1. Click the **Driver Audit** tab.
  2. Locate a driver and click **Suspend** (or **Reinstate**). Explain that this updates their database record and broadcasts their new status.
  3. Show the **Score Analytics** charts.

---

### Scene 6: Financial Analyst Dashboard & Analytics (3:45 - 4:30)
- **Visuals**: Log out and log in as the **Financial Analyst** (`finance@transitops.in`).
- **Narrative**:
  > *"Finally, the Financial Analyst Dashboard provides cost visibility. We can track total operational expenditures, run fuel efficiency audits, and check vehicle-specific ROI metrics. Let's look at the Expense Ledger."*
- **Action**:
  1. Click **Expense Ledger** tab.
  2. Notice the newly added `Fuel` expense from Rahul's completed trip appears at the top.
  3. Click **Export CSV** to demonstrate the data export feature.
  4. Show the **Cost Charts** tab with expense breakdown and ROI analysis.

---

### Scene 7: Conclusion (4:30 - 5:00)
- **Visuals**: Show both dashboards or the TransitOps brand logo.
- **Narrative**:
  > *"TransitOps empowers logistics teams with a secure, highly-integrated, and blazing-fast operations center. Thanks to standard WebSocket integration, all active panels stay in sync as drivers move across the country. Thank you for watching!"*
