# Troubleshooting GoPro WiFi Not Visible

**Issue:** GoPro WiFi network "GP50113778" not appearing in WiFi scans after BLE command

---

## Enhanced Debugging Added ✅

I've added extensive logging to help diagnose the issue. When you run the next test session, you'll see detailed output showing exactly what's happening.

---

## What to Check in the Next Test

### Step 1: Check BLE Connection Status

When the session stops, look for these logs:

```
[GoPro] enableWiFi() called
[GoPro] isConnected: true  ← Should be TRUE
[GoPro] commandChar exists: true  ← Should be TRUE
```

**If you see `false` for either:**
- BLE connection was lost during recording
- Need to keep GoPro BLE connected throughout session

### Step 2: Check BLE Command Execution

Look for these logs:

```
[GoPro] Enabling WiFi Access Point via BLE...
[GoPro] Command bytes: [3, 17, 1, 1]
[GoPro] Base64 command: AxEBAQ==
[GoPro] Sending BLE command to characteristic...
[GoPro] ✅ WiFi enable command sent successfully
```

**If you see an error instead:**
- BLE command failed to send
- Check error details in logs

### Step 3: Check GoPro Screen

**CRITICAL:** Look at your GoPro's physical screen:

```
[GoPro] IMPORTANT: Check your GoPro screen - WiFi icon should appear
```

**After the BLE command:**
- WiFi icon should appear on GoPro screen
- If no WiFi icon appears → BLE command didn't work

### Step 4: Check WiFi Scan Results

Look for this section in logs:

```
[WiFiManager] Scanning for available WiFi networks...
[WiFiManager] Found 5 WiFi networks:
[WiFiManager]   1. Benjua (Signal: -45)
[WiFiManager]   2. NeighborWiFi (Signal: -67)
[WiFiManager]   3. GP50113778 (Signal: -52)  ← This should be present!
```

**If GP50113778 is NOT in the list:**
- BLE command sent but GoPro WiFi didn't activate
- Need alternative approach

---

## Possible Scenarios

### Scenario 1: BLE Not Connected

**Logs you'll see:**
```
[GoPro] isConnected: false
[GoPro] Cannot enable WiFi: GoPro is not connected via BLE
```

**Solution:**
- GoPro BLE disconnected during recording
- Check if recording causes BLE disconnect
- May need to reconnect BLE after recording stops

### Scenario 2: BLE Command Sent But WiFi Still Not Visible

**Logs you'll see:**
```
[GoPro] ✅ WiFi enable command sent successfully
[WiFiManager] ❌ GoPro WiFi NOT FOUND in scan!
```

**Possible Causes:**

1. **Wrong BLE Command**
   - Command bytes might be incorrect for Hero 13
   - OpenGoPro spec might differ for Hero 13

2. **Need Longer Wait Time**
   - Currently waiting 3 seconds after BLE command
   - GoPro WiFi hardware might need 5-10 seconds

3. **GoPro WiFi Already On**
   - If "Wireless Connections" is ON, WiFi might be in standby
   - BLE command might do nothing
   - Try turning "Wireless Connections" OFF first

4. **GoPro Firmware Issue**
   - Hero 13 firmware might not support this command
   - May need different approach

### Scenario 3: Permission Issue

**Logs you'll see:**
```
[WiFiManager] WiFi scan failed: Error: Location permission denied
```

**Solution:**
- Location permission needed for WiFi scan
- Should already be granted from ConnectionScreen
- Check permission still active

---

## Alternative Approaches to Try

### Option A: Manual WiFi Enable

**If BLE command doesn't work:**

1. On GoPro, before starting session:
   - Swipe down → Connections
   - Turn "Wireless Connections" OFF
   - Turn "Wireless Connections" ON
   - WiFi should auto-enable

2. Keep GoPro screen active:
   - Set "Screen Saver" to NEVER
   - This keeps WiFi active

### Option B: Use GoPro Quik App Method

**If OpenGoPro BLE command doesn't work:**

Research shows GoPro Quik app can activate WiFi. We could:

1. Reverse engineer GoPro Quik's BLE sequence
2. Use their exact BLE commands
3. May require different UUIDs or multi-step handshake

### Option C: Increase Wait Time

**Try waiting longer after BLE command:**

Current code:
```typescript
await this.delay(3000);  // 3 seconds
```

Try:
```typescript
await this.delay(10000);  // 10 seconds
```

GoPro WiFi hardware might be slow to initialize.

### Option D: Keep WiFi Always On

**Simplest workaround:**

1. Manually enable GoPro WiFi before event starts
2. Leave it on for entire event (3-4 hours)
3. Skip BLE WiFi command entirely
4. Just do WiFi switching

**Pros:**
- No complex BLE commands needed
- Guaranteed to work

**Cons:**
- Battery drain (WiFi consumes power)
- Have to remember to enable WiFi manually

---

## What to Do Next

### Test with Enhanced Logging

1. Deploy updated app: `npm run android`
2. Start a recording session
3. **Carefully copy ALL console logs** after session stops
4. Share logs with me - I'll analyze them

### Critical Logs to Capture

```
# From GoProService
[GoPro] enableWiFi() called
[GoPro] isConnected: ???
[GoPro] commandChar exists: ???
[GoPro] Command bytes: ???
[GoPro] Base64 command: ???
[GoPro] ✅ WiFi enable command sent successfully (or error)

# From WiFiManagerService
[WiFiManager] Scanning for available WiFi networks...
[WiFiManager] Found X WiFi networks:
[WiFiManager]   1. ???
[WiFiManager]   2. ???
[WiFiManager] ✅ GoPro WiFi FOUND (or NOT FOUND)
```

### Physical Checks

**On GoPro screen, after session stops:**
- [ ] Is WiFi icon visible?
- [ ] Does screen show "WiFi ON" or similar?
- [ ] Try swiping to connections - what does it show?

**On phone WiFi settings:**
- [ ] Open phone Settings → WiFi
- [ ] Is "GP50113778" in the list?
- [ ] If not, wait 10 seconds and check again

---

## Expected Outcomes

### Success Case ✅

```
[GoPro] ✅ WiFi enable command sent successfully
[GoPro] IMPORTANT: Check your GoPro screen - WiFi icon should appear
<User checks: WiFi icon IS visible>
[WiFiManager] ✅ GoPro WiFi FOUND in scan: GP50113778
[WiFiManager] Signal strength: -52
[WiFiManager] ✅ Successfully switched to GoPro WiFi
```

### Failure Case ❌

```
[GoPro] ✅ WiFi enable command sent successfully
[GoPro] IMPORTANT: Check your GoPro screen - WiFi icon should appear
<User checks: NO WiFi icon>
[WiFiManager] ❌ GoPro WiFi NOT FOUND in scan!
[WiFiManager] This means GoPro WiFi is not broadcasting
[WiFiManager] Possible causes:
  1. BLE WiFi enable command failed
  2. GoPro WiFi hardware not responding
  3. Need more wait time after BLE command
```

---

## Quick Reference: OpenGoPro BLE Command

**Enable WiFi Command:**
```
Command Type: 0x03 (Set Setting)
Setting ID: 0x11 (AP Control)
Length: 0x01 (1 byte)
Value: 0x01 (Enable)

Full command: [0x03, 0x11, 0x01, 0x01]
Base64: AxEBAQ==
```

**Source:** OpenGoPro BLE Specification
**Link:** https://gopro.github.io/OpenGoPro/ble

---

## Ready to Test

Enhanced debugging is in place. Next session will reveal exactly what's happening!
