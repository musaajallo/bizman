# Time & Attendance — Implementation Plan

> **Module:** HR
> **Status:** Not Started
> **Plan written:** 2026-03-25

---

## Overview

A hardware-agnostic time and attendance system that can operate in three modes simultaneously:

| Mode | Hardware | How it works |
|---|---|---|
| **QR Code** | Any camera (phone, tablet, USB webcam) | Employee scans personal QR → companion PWA posts clock event |
| **ZKTeco** | ZKTeco fingerprint/face terminals | Device pushes events via ZKTeco ADMS protocol to server endpoint |
| **Generic webhook** | Any third-party scanner or fingerprint reader | Third-party device POSTs to a documented webhook endpoint |

All three modes write to the same `AttendanceRecord` table. A nightly (or real-time) processing job converts raw records into structured `AttendanceLog` entries that downstream modules (Timesheets, Payroll) can consume.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Input Sources                          │
│                                                             │
│  [ZKTeco Terminal]   [QR Companion App]   [3rd Party Scanner]│
│        │                    │                    │          │
│  ADMS PUSH              PWA scan POST        Webhook POST   │
└──────────┼──────────────────┼────────────────────┼──────────┘
           │                  │                    │
           ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  AfricsCore API Routes                       │
│  /api/attendance/zkteco                                      │
│  /api/attendance/qr                                          │
│  /api/attendance/webhook                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                  AttendanceRecord (raw)
                  source, employeeId, type, timestamp, deviceId
                           │
                    Processing Job
                  (cron or on-write trigger)
                           │
                           ▼
                   AttendanceLog (derived)
                   date, employee, status, hoursWorked,
                   lateMinutes, earlyDepartureMinutes
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        Timesheet auto-draft       Payroll deductions
```

---

## Prisma Models

```prisma
// ── Devices ──────────────────────────────────────────────────

model AttendanceDevice {
  id            String   @id @default(cuid())
  tenantId      String
  name          String                        // "Reception Kiosk", "Server Room Scanner"
  type          String                        // "zkteco" | "qr_kiosk" | "webhook" | "manual"
  serialNumber  String?                       // ZKTeco device serial
  location      String?                       // "Head Office – Ground Floor"
  apiKey        String   @unique @default(cuid()) // Used to authenticate webhook/QR posts
  isActive      Boolean  @default(true)
  lastHeartbeat DateTime?
  lastSyncAt    DateTime?
  metadata      Json?                         // ZKTeco-specific config (IP, port, etc.)
  createdAt     DateTime @default(now())

  records       AttendanceRecord[]

  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@index([tenantId])
}

// ── Raw Clock Events ──────────────────────────────────────────

model AttendanceRecord {
  id            String   @id @default(cuid())
  tenantId      String
  employeeId    String
  deviceId      String?                       // Null for manual entries
  type          String                        // "clock_in" | "clock_out" | "break_start" | "break_end"
  method        String                        // "qr" | "fingerprint" | "face" | "card" | "manual"
  timestamp     DateTime
  raw           Json?                         // Raw payload from device (for debugging/audit)
  source        String                        // "zkteco" | "qr_kiosk" | "webhook" | "manual"
  isManual      Boolean  @default(false)
  overriddenById String?                      // HR user who manually added/corrected
  note          String?
  createdAt     DateTime @default(now())

  employee      Employee        @relation(fields: [employeeId], references: [id])
  device        AttendanceDevice? @relation(fields: [deviceId], references: [id])
  @@index([tenantId, employeeId, timestamp])
  @@index([tenantId, timestamp])
}

// ── Processed Daily Logs ──────────────────────────────────────

model AttendanceLog {
  id                    String   @id @default(cuid())
  tenantId              String
  employeeId            String
  date                  DateTime @db.Date
  status                String
  // "present" | "absent" | "half_day" | "leave" | "holiday" | "weekend" | "unresolved"
  shiftId               String?
  scheduledStart        DateTime?
  scheduledEnd          DateTime?
  actualClockIn         DateTime?
  actualClockOut        DateTime?
  hoursWorked           Decimal? @db.Decimal(5, 2)
  lateMinutes           Int      @default(0)
  earlyDepartureMinutes Int      @default(0)
  overtimeMinutes       Int      @default(0)
  breakMinutes          Int      @default(0)
  isPublicHoliday       Boolean  @default(false)
  notes                 String?
  timesheetEntryId      String?  @unique      // Set when synced to timesheet
  processedAt           DateTime @default(now())
  updatedAt             DateTime @updatedAt

  employee      Employee  @relation(fields: [employeeId], references: [id])
  shift         Shift?    @relation(fields: [shiftId], references: [id])

  @@unique([employeeId, date])
  @@index([tenantId, date])
}

// ── Shifts ────────────────────────────────────────────────────

model Shift {
  id              String   @id @default(cuid())
  tenantId        String
  name            String                        // "Morning", "Night", "Flexi"
  type            String   @default("fixed")    // "fixed" | "flexi" | "open"
  startTime       String                        // "08:00" (24hr, local time)
  endTime         String                        // "17:00"
  breakMinutes    Int      @default(60)
  gracePeriodMins Int      @default(15)         // Late tolerance before marked late
  overtimeAfterMins Int    @default(0)          // Minutes past endTime before OT kicks in
  workDays        String[]                      // ["mon","tue","wed","thu","fri"]
  isDefault       Boolean  @default(false)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  assignments     ShiftAssignment[]
  logs            AttendanceLog[]

  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@index([tenantId])
}

model ShiftAssignment {
  id          String    @id @default(cuid())
  tenantId    String
  shiftId     String
  employeeId  String?                           // Null = department-level assignment
  departmentId String?
  effectiveFrom DateTime
  effectiveTo   DateTime?                       // Null = indefinite
  createdAt   DateTime  @default(now())

  shift       Shift    @relation(fields: [shiftId], references: [id])
  employee    Employee? @relation(fields: [employeeId], references: [id])
  @@index([tenantId, employeeId])
}

// ── QR Codes ──────────────────────────────────────────────────

model EmployeeQRCode {
  id          String    @id @default(cuid())
  tenantId    String
  employeeId  String
  code        String    @unique @default(cuid())
  isActive    Boolean   @default(true)
  expiresAt   DateTime?                         // Null = never expires
  createdAt   DateTime  @default(now())
  revokedAt   DateTime?

  employee    Employee  @relation(fields: [employeeId], references: [id])
  @@index([employeeId])
  @@index([code])                               // Fast lookup on scan
}
```

---

## API Endpoints

### ZKTeco ADMS Push — `/api/attendance/zkteco`

ZKTeco devices use their ADMS (Attendance Data Management System) protocol. The device is configured with the server URL and pushes attendance records via HTTP POST.

**ZKTeco handshake flow:**
1. Device sends `GET /api/attendance/zkteco?SN=<serial>` → server responds with `GET OPTION` headers
2. Device sends attendance records via `POST /api/attendance/zkteco`
3. Server acknowledges with `OK`
4. Server can queue commands (e.g. user sync, time sync) in the response

**Key headers ZKTeco sends:**
```
Content-Type: application/x-www-form-urlencoded
```

**Payload fields:**
```
SN          Device serial number
table       "ATTLOG" (attendance) | "OPERLOG" | "ISODOORLOG"
Stamp       Unix timestamp of record
UserID      Employee's enrollment ID on the device
AttTime     Attendance timestamp "YYYY-MM-DD HH:MM:SS"
AttState    0=clock-in, 1=clock-out, 2=break-out, 3=break-in, 4=overtime-in, 5=overtime-out
Verify      1=fingerprint, 4=password, 15=face
```

**Server response (for handshake):**
```
GET OPTION FROM: server
ATTLOGStamp=<last_received_timestamp>
OPERLOGStamp=<last_received_timestamp>
ErrorDelay=30
Delay=10
TransTimes=00:00;14:05
TransInterval=1
TimeZone=0
Realtime=1
Encrypt=None
```

### QR Code Scan — `/api/attendance/qr`

Posted by the companion PWA when a QR code is scanned at a kiosk.

```typescript
// POST /api/attendance/qr
// Headers: { "X-Device-Key": "<device api key>" }
{
  code: string;        // The scanned QR code value
  timestamp: string;   // ISO 8601 — device local time
  type: "clock_in" | "clock_out";  // Optional; inferred from last record if omitted
}

// Response
{
  success: true;
  employeeName: string;
  photo?: string;
  action: "clock_in" | "clock_out";
  time: string;
}
```

Auto-detect clock-in vs clock-out: if the employee's last record today was a `clock_in`, the next scan is treated as `clock_out`, and vice versa.

### Generic Webhook — `/api/attendance/webhook`

For third-party fingerprint readers, access control systems, or any custom hardware.

```typescript
// POST /api/attendance/webhook
// Headers: { "X-Api-Key": "<device api key>" }
// Or HMAC: { "X-Signature": "sha256=<hmac_hex>" }
{
  employee_id: string;   // Employee ID in AfricsCore
  timestamp: string;     // ISO 8601
  type?: "clock_in" | "clock_out";  // Optional; auto-detected if omitted
  method?: "fingerprint" | "face" | "card" | "qr" | "pin";
  device_ref?: string;   // Vendor-specific device identifier
}
```

---

## QR Companion App (PWA)

A standalone kiosk-mode web app designed to run full-screen on a tablet, phone, or PC with a webcam.

**Route:** `/scan` (public, no user auth — auth is device-level via API key)

**UI Flow:**
```
[Camera feed with overlay frame]
         ↓ QR detected
[Loading spinner + beep sound]
         ↓ API responds
[Employee photo + name + "Clocked In — 08:47"]
   or    [Employee photo + name + "Clocked Out — 17:03"]
         ↓ 3 seconds
[Back to camera feed]
```

**Features:**
- Uses `@zxing/browser` or `html5-qrcode` for QR decoding in the browser
- Offline queue: IndexedDB buffer stores scans when offline, syncs on reconnect
- Device registration: first-time setup screen where admin enters the device API key
- Auto-wake lock: prevents screen from sleeping
- Sound feedback: distinct tones for success / unknown QR / error
- Configurable direction: "clock-in only", "clock-out only", or "auto-detect"

**Kiosk Setup (admin):**
1. Create device in admin UI → copy API key
2. Open `/scan` on the kiosk device
3. Enter API key on first-run screen → saved to localStorage
4. Device is now operational

---

## ZKTeco Device Setup

**Steps to integrate an existing ZKTeco terminal:**

1. In AfricsCore: create an `AttendanceDevice` of type `zkteco`, note the device serial
2. On the ZKTeco device: navigate to **Communication → ADMS** settings
3. Set server address to `https://yourdomain.com/api/attendance/zkteco`
4. Set port to `443` (HTTPS)
5. Enable ADMS push
6. Device will initiate handshake and begin pushing records

**Employee enrollment mapping:**
- ZKTeco stores employees by a numeric user ID (1–999 typically)
- In AfricsCore: each employee has a `zktecoUserId` field (added to Employee model)
- During sync, attendance records are matched on this ID

**Supported ZKTeco models:** Any terminal that supports ADMS push (ZK series, uFace, SpeedFace, etc.)

---

## Shift & Scheduling Logic

### Shift resolution order (per employee per day):
1. Direct employee assignment (`ShiftAssignment.employeeId`)
2. Department-level assignment (`ShiftAssignment.departmentId`)
3. Tenant default shift (`Shift.isDefault = true`)
4. Fallback: mark as "unresolved" — HR must assign manually

### Attendance log processing (runs on each clock record, or via nightly cron):
```
For each employee with records today:
  1. Resolve their shift for the day
  2. First record → actual clock-in
  3. Last record of opposite type → actual clock-out
  4. hoursWorked = clockOut - clockIn - breakMinutes
  5. lateMinutes = max(0, clockIn - (shiftStart + gracePeriod))
  6. earlyDepartureMinutes = max(0, (shiftEnd - gracePeriod) - clockOut)
  7. overtimeMinutes = max(0, hoursWorked - (shiftDuration - breakMinutes))
  8. status = derive from hoursWorked / leave records / holidays
```

---

## Integration with Existing HR Modules

### → Timesheets
- Attendance logs can auto-draft a timesheet for the pay period
- Employee reviews and submits; HR approves
- Discrepancies flagged (e.g. attended but no timesheet, or timesheet hours differ from attendance log)

### → Overtime
- If `overtimeMinutes > 0` on an attendance log, suggest creating an OvertimeRequest
- HR can bulk-approve generated overtime suggestions

### → Leave
- When processing daily logs, check for approved `LeaveRequest` for the date
- If leave is approved → mark as `leave` (not `absent`) in the log
- Public holidays (from employee's country-of-operation) → mark as `holiday`

### → Payroll
- Attendance stats (late days, absent days, overtime hours) fed into payroll run
- Late deductions configurable (e.g. dock 30 min salary for each late arrival)

---

## Pages

```
/africs/hr/attendance                    Dashboard (today's summary, recent activity)
/africs/hr/attendance/records            Raw attendance records (filterable by employee, date, device)
/africs/hr/attendance/logs               Processed daily logs (filterable, bulk-correct)
/africs/hr/attendance/logs/[employeeId]  Per-employee attendance history
/africs/hr/attendance/shifts             Shift list
/africs/hr/attendance/shifts/new         Create shift
/africs/hr/attendance/shifts/[id]        Edit shift + assigned employees
/africs/hr/attendance/devices            Registered devices list
/africs/hr/attendance/devices/new        Register device (type, name, location, get API key)
/africs/hr/attendance/devices/[id]       Device detail (last heartbeat, record count, sync log)
/africs/hr/attendance/qr-codes           Employee QR code management (generate, print, revoke)
/scan                                    QR companion kiosk app (public, device-auth only)
```

---

## Implementation Order

### Phase 1 — Core engine + manual entry
Schema, shifts, attendance records, processed logs, admin override UI, dashboard. No hardware yet — just the data model and manual entry to validate the logic.

### Phase 2 — QR companion app
`/scan` PWA with camera QR decoding, device registration, offline queue, auto clock-in/out detection. Can go live independently with just a phone or tablet.

### Phase 3 — ZKTeco integration
ADMS push receiver, handshake handling, device management UI, employee enrollment mapping. Test against a real ZKTeco device.

### Phase 4 — Generic webhook + FaceID
Webhook endpoint with HMAC auth, API key management, WebAuthn face clock-in for mobile browser.

### Phase 5 — Downstream integration
Auto-draft timesheets from logs, overtime suggestions, payroll deduction rules, late/absence alerting.

---

## Key Design Decisions

**Why separate `AttendanceRecord` (raw) and `AttendanceLog` (processed)?**
Raw records are immutable audit trail — what the device actually sent. Processed logs are derived and correctable by HR. This separation means a manual HR correction updates the log without tampering with the raw device data.

**Why device-level API key auth on `/scan` instead of user auth?**
The kiosk runs unattended. A device API key is scoped to one device, can be revoked without affecting other devices, and doesn't require an HR user to be logged in at all times.

**QR code rotation:**
QR codes on printed ID cards should never expire (or expire annually). Digital QR codes (shown in self-service app) can be rotated on demand for security. The `EmployeeQRCode` model supports multiple active codes per employee to handle transition during rotation.

**ZKTeco user ID mapping:**
ZKTeco terminals have their own internal user numbering. Rather than forcing ZKTeco IDs to match employee IDs, a separate `zktecoUserId` field on the Employee record allows flexible mapping and supports multiple devices with overlapping user ID ranges.
