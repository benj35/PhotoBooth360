# ESP32 Booth Testing Guide

**Created:** 2025-10-19
**Updated:** 2025-12-14 (Added WiFi switching location permission fix)
**Purpose:** Test ESP32 booth controller integration with React Native app

---

## 🔧 IMPORTANT FIXES: GoPro WiFi Switching

### Fix 1: Location Permission for WiFi Switching ✅

**Problem:** WiFi switching failed with error:
```
Error: Location permission (ACCESS_FINE_LOCATION) is not granted
```

**Solution Applied:**
1. **AndroidManifest.xml** - Removed `maxSdkVersion="30"` restriction from location permissions
2. **ConnectionScreen.tsx** - Added runtime location permission request when connecting to booth
3. **User Experience** - Permission requested with clear explanation

### Fix 2: GoPro Hero 13 WiFi Activation via BLE ✅

**Problem:** GoPro WiFi network "GP50113778" not visible in WiFi scan even with "Wireless Connections" enabled

**Root Cause:** Hero 13 uses BLE-first approach - WiFi must be activated via BLE command before network becomes visible

**Solution Applied:**
1. **GoProService.ts** - Added BLE commands to enable/disable WiFi Access Point:
   - Enable: `[0x03, 0x11, 0x01, 0x01]`
   - Disable: `[0x03, 0x11, 0x01, 0x00]`
2. **SessionOrchestrator.ts** - Integrated BLE WiFi enablement into workflow:
   - Stop recording → Enable WiFi via BLE → Wait 3 seconds → Switch WiFi → Download

### How to Test the Complete Workflow
1. Connect to booth → Location permission dialog appears
2. Grant permission → WiFi credentials modal shown
3. Save credentials → Ready for session
4. Start session → Recording for configured duration
5. **NEW:** After recording stops:
   - GoPro WiFi enabled via BLE command
   - Wait 3 seconds for network to broadcast
   - Phone switches to GoPro WiFi "GP50113778"
   - GoPro HTTP API tested
   - Ready for video download ✅

---

## ✅ What We Just Implemented

**File:** [src/services/BoothService.ts](../src/services/BoothService.ts)

### API Integration:

```
Motor Control:
GET /api/motor?power=true&dir=fwd&speed=50
  - power: true/false (start/stop motor)
  - dir: fwd/rev (rotation direction)
  - speed: 1-100 (rotation speed)

LED Control:
GET /api/led?power=true&mode=solid&r=255&g=255&b=255
  - power: true/false (LED on/off)
  - mode: solid/blink
  - r, g, b: 0-255 (RGB values)
  - interval: milliseconds (for blink mode)
```

---

## 🧪 Testing Steps

### Step 1: Network Setup

**Before testing, ensure:**
1. ESP32 is powered on
2. ESP32 is connected to your WiFi router
3. Your phone/tablet is on the same WiFi network
4. You know the ESP32 IP address

**Find ESP32 IP Address:**
- Option A: Check router admin panel → Connected Devices
- Option B: Ask electrical engineer for configured IP
- Option C: Use IP scanner app on phone

**Expected IP:** `http://192.168.1.100` (or similar)

---

### Step 2: Test ESP32 Directly (Before App Testing)

**Use a web browser or Postman to test endpoints:**

#### Test 1: Stop Motor (Connection Test)
```
URL: http://192.168.1.100/api/motor?power=false
Expected: Motor should NOT be running
```

#### Test 2: Start Motor
```
URL: http://192.168.1.100/api/motor?power=true&dir=fwd&speed=30
Expected: Motor starts rotating forward at 30% speed
```

#### Test 3: Stop Motor
```
URL: http://192.168.1.100/api/motor?power=false
Expected: Motor stops
```

#### Test 4: LED Test (Optional)
```
URL: http://192.168.1.100/api/led?power=true&mode=solid&r=255&g=0&b=0
Expected: LED turns RED
```

**If these work ✅ → ESP32 API is working correctly!**

---

### Step 3: Run App on Physical Device

**Android:**
```bash
# Connect Android device via USB
# Enable USB debugging on phone
npm run android
```

**iOS:**
```bash
# Connect iPhone via USB
npm run ios
```

**Troubleshooting:**
- Make sure Metro bundler is running: `npm start`
- Make sure phone and computer are on same WiFi
- Check USB debugging is enabled (Android)

---

### Step 4: Test Connection Screen

**In the app:**

1. **Navigate to Connection Screen** (should be first screen)

2. **Connect to Booth:**
   - Enter ESP32 URL: `http://192.168.1.100`
   - Tap "Connect via Network"
   - **Expected:** Green checkmark, "Connected" message

3. **Check Console Logs:**
   - Open React Native debugger
   - Look for: `[Booth] ✅ Connected successfully`

**If connection fails:**
- Check IP address is correct
- Verify phone is on same WiFi
- Ping ESP32 from phone browser: `http://192.168.1.100/api/motor?power=false`
- Check ESP32 is powered on

---

### Step 5: Test Manual Controls

**Navigate to Manual Control Screen:**

1. **Start Rotation:**
   - Adjust speed slider to 50
   - Tap "Start Booth Rotation" button
   - **Expected:** Booth starts rotating
   - **Console:** `[Booth] ✅ Rotation started`

2. **Observe Rotation:**
   - Booth should rotate smoothly
   - No jerky movements
   - Speed should match slider

3. **Stop Rotation:**
   - Tap "Stop Booth Rotation" button
   - **Expected:** Booth stops
   - **Console:** `[Booth] ✅ Rotation stopped`

4. **Test Different Speeds:**
   - Try speed: 25 (slow)
   - Try speed: 75 (fast)
   - Try speed: 100 (max)
   - **Expected:** Speed changes accordingly

---

### Step 6: Test Automated Session (Without GoPro for now)

**From Home Screen:**

1. **Configure Session:**
   - Tap "Edit Settings"
   - Set duration: 10 seconds (for testing)
   - Set rotation speed: 50
   - Save settings

2. **Start Session:**
   - Tap "START SESSION" button
   - **Expected:**
     - Booth starts rotating after 1-2 seconds
     - Timer counts down from 10
     - Booth stops automatically at 0

3. **Verify Console Logs:**
   ```
   [Session] Starting session...
   [Session] State: preparing
   [Booth] Starting rotation at speed: 50
   [Booth] ✅ Rotation started
   [Session] State: recording
   ... (10 seconds pass)
   [Booth] Stopping rotation
   [Booth] ✅ Rotation stopped
   [Session] State: idle
   [Session] Session completed successfully
   ```

---

### Step 7: Test Emergency Stop

**While session is running:**

1. **Start a session** (duration: 20 seconds)
2. **Wait 5 seconds**
3. **Tap "🛑 Emergency Stop"**
4. **Expected:**
   - Booth stops immediately
   - Session cancels
   - Console: `[Session] Emergency stop triggered`

---

## 🐛 Troubleshooting

### Issue: "Booth is not connected" error

**Causes:**
- ESP32 not on same network
- Wrong IP address
- ESP32 powered off
- Network firewall blocking

**Solutions:**
1. Verify ESP32 IP with router admin
2. Test ESP32 URL in phone browser
3. Check WiFi connection on phone
4. Restart ESP32

---

### Issue: Motor doesn't rotate

**Causes:**
- Motor not wired correctly
- Power supply issue
- ESP32 firmware bug
- Wrong motor pins

**Solutions:**
1. Test motor directly from browser
2. Check ESP32 serial monitor for errors
3. Verify motor power supply
4. Contact electrical engineer

---

### Issue: Rotation is jerky/inconsistent

**Causes:**
- Low motor voltage
- Speed too low
- Mechanical friction
- PWM frequency issue

**Solutions:**
1. Try higher speed (70-100)
2. Check mechanical setup
3. Lubricate moving parts
4. Adjust ESP32 PWM settings

---

### Issue: App can't connect to ESP32

**Causes:**
- Phone on different WiFi network
- Wrong base URL format
- ESP32 web server not running
- Network timeout

**Solutions:**
1. Verify format: `http://192.168.1.100` (no trailing slash)
2. Increase timeout in BoothService.ts (currently 5000ms)
3. Check ESP32 serial monitor
4. Restart ESP32

---

## 📋 Testing Checklist

**Before Event:**
- [ ] ESP32 connects successfully from app
- [ ] Can start rotation at different speeds (25, 50, 75, 100)
- [ ] Can stop rotation reliably
- [ ] Rotation is smooth and consistent
- [ ] Emergency stop works immediately
- [ ] LED control works (optional)
- [ ] No connection drops during 10 consecutive tests
- [ ] Battery life: ESP32 runs for 4+ hours
- [ ] Can reconnect after ESP32 reboot

**Advanced Tests:**
- [ ] Test with weak WiFi signal (move away from router)
- [ ] Test rapid start/stop cycles
- [ ] Test session duration: 5s, 10s, 20s, 30s
- [ ] Test network reconnection after brief disconnect
- [ ] Multiple sessions without restart (50+ sessions)

---

## 🎯 Success Criteria

**ESP32 integration is complete when:**
1. ✅ App connects to ESP32 on first try
2. ✅ Rotation starts within 500ms of command
3. ✅ Speed control is accurate (±5%)
4. ✅ Emergency stop works 100% of time
5. ✅ Can run 50+ sessions without issues
6. ✅ No crashes or errors in console
7. ✅ Rotation is smooth and professional-looking

---

## 🔄 Next Steps (After ESP32 Testing)

Once ESP32 is working:
1. Test GoPro BLE pairing
2. Test combined session (ESP32 + GoPro)
3. Add backup phone camera control
4. Test dual-camera recording

---

## 📞 Need Help?

**If ESP32 isn't working:**
1. Check this guide first
2. Review console logs
3. Test ESP32 directly in browser
4. Contact electrical engineer
5. Share console logs with Claude Code for debugging

---

**Good luck with testing!** 🚀

**Update this doc with your findings and any issues encountered.**
