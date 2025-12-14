# WiFi Credentials Update - Complete ✅

## Changes Made

Updated the WiFi switching system to use the correct WiFi credentials for your specific setup.

## Your WiFi Networks

### Booth WiFi (Main Network)
- **SSID:** Benjua
- **Password:** AZBH@2025
- **Purpose:** Controls booth rotation (ESP32) and GoPro recording (BLE)
- **IP Range:** 192.168.x.x (booth at 192.168.4.1)

### GoPro WiFi
- **SSID:** GP50113778
- **Password:** 2gP-Cn5-sSV
- **IP Address:** 10.5.5.9
- **Purpose:** Download recorded videos via HTTP API

## What Was Fixed

### 1. WiFiManagerService Updated
**File:** [src/services/WiFiManagerService.ts](../src/services/WiFiManagerService.ts)

**Before:**
```typescript
private goProSSID: string = 'HERO13';
private goProPassword: string = '4yj-zx7-zHt';
```

**After:**
```typescript
private goProSSID: string = '';  // Will be set via setGoProCredentials()
private goProPassword: string = '';
```

**New Methods:**
- `setGoProCredentials(ssid, password)` - Configure GoPro WiFi
- `getConfiguredNetworks()` - Debug helper to check saved credentials

### 2. ConnectionScreen Updated
**File:** [src/screens/ConnectionScreen.tsx](../src/screens/ConnectionScreen.tsx)

**Changes:**
- Pre-filled with correct credentials (for easy testing)
- New WiFi setup modal with 4 fields:
  - Booth WiFi Name (SSID)
  - Booth WiFi Password
  - GoPro WiFi Name (SSID)
  - GoPro WiFi Password
- Saves both sets of credentials when connecting to booth

**Default Values (for convenience):**
```typescript
const [boothSSID, setBoothSSID] = useState('Benjua');
const [boothPassword, setBoothPassword] = useState('AZBH@2025');
const [goProSSID, setGoProSSID] = useState('GP50113778');
const [goProPassword, setGoProPassword] = useState('2gP-Cn5-sSV');
```

### 3. Documentation Updated
**Files:**
- [docs/GOPRO_WIFI_SETUP.md](GOPRO_WIFI_SETUP.md) - Updated with correct credentials
- [docs/ESP32_TESTING_GUIDE.md](ESP32_TESTING_GUIDE.md) - Added location permission fix
- [docs/WIFI_CREDENTIALS_UPDATE.md](WIFI_CREDENTIALS_UPDATE.md) - This file

## How It Works Now

### First Time Setup (Connection Screen)

1. **User opens app** → Connection Screen
2. **Connects to booth** → Taps "Connect via Network"
3. **Location permission requested** → User grants permission
4. **WiFi modal appears** with pre-filled credentials:
   ```
   Booth WiFi (Main Network)
   ├─ Benjua
   └─ AZBH@2025

   GoPro WiFi
   ├─ GP50113778
   └─ 2gP-Cn5-sSV
   ```
5. **User taps "Save & Continue"** → Credentials saved to WiFiManagerService
6. **Booth connected** ✅

### During Recording Session

**Booth WiFi (Benjua):**
```
1. Customer enters info
2. Start session
3. Booth starts rotating (ESP32 via REST)
4. GoPro starts recording (via BLE)
5. Music plays
6. Session runs for 20 seconds
7. All devices stop
```

**Auto-enable GoPro WiFi via BLE (CRITICAL for Hero 13):**
```
8. SessionOrchestrator calls goProService.enableWiFi()
9. BLE command sent: [0x03, 0x11, 0x01, 0x01] (Enable AP)
10. Wait 3 seconds for WiFi network to broadcast
11. GoPro WiFi "GP50113778" now visible in scan
```

**Auto-switch to GoPro WiFi (GP50113778):**
```
12. SessionOrchestrator calls wifiManager.switchToGoProWiFi()
13. Disconnect from "Benjua"
14. Connect to "GP50113778" (using saved password)
15. Test HTTP connection to 10.5.5.9:8080
16. ✅ Ready for video download
```

**Video Download:**
```
17. Get latest video from GoPro media list
18. Download via HTTP: /videos/DCIM/100GOPRO/GOPR0001.MP4
19. Save to app directory
```

**Auto-switch back to Booth WiFi (Benjua):**
```
20. SessionOrchestrator calls wifiManager.switchToBoothWiFi()
21. Disconnect from "GP50113778"
22. Connect to "Benjua" (using saved password)
23. (Optional) Call goProService.disableWiFi() to save GoPro battery
24. ✅ Ready for next customer
```

## Testing Steps

### Step 1: Verify GoPro WiFi is ON
```
1. On GoPro Hero 13:
   - Swipe down → Preferences → Connections
   - Enable "Wireless Connections"
   - Enable "WiFi"
   - Verify SSID shows: GP50113778
   - Verify password shows: 2gP-Cn5-sSV
```

### Step 2: Test WiFi Visibility
```
1. On your phone:
   - Go to WiFi settings
   - Look for "GP50113778" in available networks
   - If you DON'T see it:
     ✗ GoPro WiFi is not broadcasting
     → Check GoPro WiFi is ON
     → Restart GoPro WiFi
```

### Step 3: Test Manual Connection (Before App Testing)
```
1. Manually connect phone to "GP50113778"
2. Open phone browser: http://10.5.5.9:8080/gp/gpControl/status
3. You should see JSON data
4. If it works ✅ → GoPro HTTP API is working
5. Disconnect and reconnect to "Benjua"
```

### Step 4: Test App WiFi Switching
```
1. Open app → Connection Screen
2. Connect to booth
3. Grant location permission
4. WiFi modal appears with pre-filled credentials
5. Verify credentials are correct
6. Tap "Save & Continue"
7. Navigate to Customer Input → Home
8. Start a recording session
9. After 20 seconds, session stops
10. Check console:
    ✅ [WiFiManager] Switching to GoPro WiFi: GP50113778
    ✅ [WiFiManager] Connected to GoPro WiFi
    ✅ [SessionOrchestrator] GoPro HTTP API is reachable
```

## Troubleshooting

### Issue: Can't see GP50113778 in WiFi scan
**Possible causes:**
1. GoPro WiFi is OFF
2. GoPro is too far away (WiFi range ~30 feet)
3. GoPro battery is dead
4. GoPro WiFi auto-turned off (timeout)

**Solutions:**
1. Check GoPro screen - WiFi icon should be visible
2. Move phone closer to GoPro
3. Charge GoPro
4. Turn GoPro WiFi OFF and back ON

### Issue: WiFi switch fails with "Connection timeout"
**Possible causes:**
1. Wrong GoPro WiFi password
2. GoPro WiFi not broadcasting
3. Android WiFi switching timeout (default 30 seconds)

**Solutions:**
1. Verify password: 2gP-Cn5-sSV (case-sensitive!)
2. Test manual connection first
3. Check console logs for exact error

### Issue: Connected to GoPro WiFi but API not reachable
**Possible causes:**
1. GoPro HTTP server not running
2. Wrong IP address (should be 10.5.5.9)
3. GoPro in wrong mode (needs to be powered on)

**Solutions:**
1. Restart GoPro
2. Verify IP: `http://10.5.5.9:8080/gp/gpControl/status`
3. Check GoPro is fully booted

## Console Output (Expected)

### Successful WiFi Switching with BLE Activation

```
[ConnectionScreen] WiFi credentials saved:
[ConnectionScreen] - Booth: Benjua
[ConnectionScreen] - GoPro: GP50113778

[Session] Starting session...
[Session] Recording for 20 seconds...

[SessionOrchestrator] All devices stopped successfully
[SessionOrchestrator] Starting automatic video download workflow...

[SessionOrchestrator] Enabling GoPro WiFi Access Point via BLE...
[GoPro] Enabling WiFi Access Point via BLE...
[GoPro] ✅ WiFi enable command sent
[GoPro] WiFi network should be broadcasting now: GP50113778
[GoPro] WiFi should be ready for connection
[SessionOrchestrator] ✅ GoPro WiFi enabled via BLE
[SessionOrchestrator] Waiting 3 seconds for WiFi network to become visible...

[SessionOrchestrator] Switching to GoPro WiFi network for download...
[WiFiManager] Switching to GoPro WiFi: GP50113778
[WiFiManager] Disconnected from current network
[WiFiManager] ✅ Connected to GoPro WiFi
[WiFiManager] Current SSID: GP50113778

[SessionOrchestrator] ✅ Connected to GoPro WiFi

[GoProWiFi] Testing connection to GoPro WiFi...
[GoProWiFi] Connection test: SUCCESS

[SessionOrchestrator] ✅ GoPro HTTP API is reachable
[SessionOrchestrator] Ready for video download!
```

## Next Steps

1. **Test on physical device** with actual hardware
2. **Verify GoPro WiFi visibility** in phone settings
3. **Test manual GoPro WiFi connection** first
4. **Test automatic WiFi switching** in app
5. **Implement video download button** (next feature)

## Success Criteria

- [x] WiFiManagerService configured with correct credentials
- [x] ConnectionScreen pre-filled with credentials
- [x] Modal allows editing if credentials change
- [x] Both credentials saved when connecting to booth
- [ ] GoPro WiFi visible in phone WiFi scan
- [ ] Automatic switch to GoPro WiFi succeeds
- [ ] GoPro HTTP API reachable after switch
- [ ] Automatic switch back to Booth WiFi succeeds
- [ ] Ready for next customer after download

## Files Modified

1. `src/services/WiFiManagerService.ts` - Added setGoProCredentials()
2. `src/screens/ConnectionScreen.tsx` - New WiFi modal with 4 fields
3. `docs/GOPRO_WIFI_SETUP.md` - Updated with correct credentials
4. `docs/ESP32_TESTING_GUIDE.md` - Added location permission fix
5. `docs/WIFI_CREDENTIALS_UPDATE.md` - This documentation

---

**Ready for testing!** 🚀

The app now has the correct WiFi credentials hardcoded and ready to test the automatic WiFi switching workflow.
