# TransitOps Video Demonstration Outline & Script

This document details the exact script, operational sequences, visual layout transitions, and spoken narration guidelines for recording the TransitOps project video.

---

## 📋 Technical Setup Before Recording
Before starting the recording, ensure the following is configured:
1. **Split-Screen Screen Config**:
   - **Left side**: Chrome window with the Fleet Manager dashboard logged in.
   - **Right side**: Incognito Chrome window (mobile emulation mode) with the Driver portal.
2. **Terminal logs**: Keep a small terminal pane visible at the bottom showing live Express API server logs to capture sync calls.
3. **Database clean state**: Reset test records to ensure clean Available/On Trip transitions.
4. **Browser Notifications**: Enable notification permissions for `localhost` in the Driver window.

---

## 🎬 Section 1: Dashboard UI Overview & Authentication
**Duration**: 0:00 - 1:00
**Visual**: Start focused on the login page, then log in and showcase the dashboards.

| Step | Action | Visual Focus | Narrated Script |
|:---|:---|:---|:---|
| 1 | Focus on Login Box | Modern Outfit typography and clean gradient styles | *"Welcome to TransitOps, a premium, offline-first fleet operations management platform built for modern logistics."* |
| 2 | Log in as **Fleet Manager** | Active KPIs count, glassmorphism card panels, responsive master grids | *"Logging in as a Fleet Manager, we immediately see our main operations dashboard. It features live resource tracking, available vehicle registries, and real-time maintenance logs."* |
| 3 | Log in as **Safety Officer** in a new tab | Inline score editing forms, license expiration warnings | *"Our role-based security is strictly enforced by JWT tokens. If we log in as a Safety Officer, the UI dynamically changes to render compliance audits and driver scoring panels."* |

---

## 🎬 Section 2: Real-time Dispatch & VAPID Web Push
**Duration**: 1:00 - 2:15
**Visual**: Show side-by-side: Fleet Manager dashboard on the left, Driver mobile portal on the right.

| Step | Action | Visual Focus | Narrated Script |
|:---|:---|:---|:---|
| 1 | Create dispatch draft | Left panel form inputs (source, destination, driver, vehicle) | *"To assign a trip, the Fleet Manager opens the dispatch desk. The system dynamically validates inputs—ensuring the cargo weight doesn't exceed vehicle capacity."* |
| 2 | Click **"Dispatch Trip"** | Left side logs a dispatch; watch right side browser | *"When we click Dispatch, the database sets the statuses to 'On Trip' and sends a background Web Push notification using VAPID keys."* |
| 3 | Observe native warning notification | Right side OS alert appears (even if tab is backgrounded) | *"Instantly, a native OS push notification alerts the driver. Clicking this notification opens the TransitOps mobile portal to the active assignment details."* |

---

## 🎬 Section 3: Offline Logging & Automatic Sync
**Duration**: 2:15 - 3:45
**Visual**: Zoom into the Driver mobile layout on the right.

| Step | Action | Visual Focus | Narrated Script |
|:---|:---|:---|:---|
| 1 | Disconnect network | DevTools network panel toggles "Offline" | *"Now, let's test our offline-first synchronization. We'll toggle the network offline. The driver console immediately shows an Offline status indicator."* |
| 2 | Change status & submit expense | Click **"Start Trip"**; submit ₹350 toll expense form | *"While offline, the driver can still update the trip progress and record incident expenses. The data is cached locally inside an indexed queue."* |
| 3 | Reconnect network | DevTools network panel toggles "Online" | *"Once connectivity is restored, the queue processor automatically fires. The background worker uploads the updates in exact chronological order."* |
| 4 | Verify on Manager Dashboard | Refresh left-side manager logs | *"Back on the Fleet Manager desk, we can see the trip state updated to 'In Transit' and the express expense is registered successfully on the server."* |

---

## 🎬 Section 4: Analytics Report & PDF Printing
**Duration**: 3:45 - 4:30
**Visual**: Focus on the Financial Analytics panel.

| Step | Action | Visual Focus | Narrated Script |
|:---|:---|:---|:---|
| 1 | Open Analytics page | HSL gradients, custom curved Recharts | *"Next, we'll open the Analytics and ROI console, showing interactive fuel performance metrics and cost reports."* |
| 2 | Click **"Print & Save as PDF"** | Native print popup window rendering custom styles | *"With a single click, we can export our comprehensive fleet report. We decoupled the action to bypass all browser-level cross-origin frame blockers, ensuring a clean save to PDF."* |
| 3 | Wrap up | Outro screen | *"TransitOps delivers a fast, secure, and resilient operations suite. Thank you for watching."* |
