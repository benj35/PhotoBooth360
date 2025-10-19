# Network Setup Guide

This guide will help you configure your portable WiFi router to work with the ESP32 booth controller and GoPro camera using **static IP addresses**.

---

## Why Static IP Addresses?

By default, WiFi routers assign **dynamic IP addresses** (DHCP) to devices. This means:
- ESP32 might get 192.168.1.5 today, but 192.168.1.12 tomorrow
- Your app won't know where to find the ESP32
- You'd have to manually check IPs before every event ❌

**With static IP reservations:**
- ESP32 **always** gets 192.168.1.100
- GoPro **always** gets 192.168.1.101
- Your app knows exactly where to send commands ✅
- Works the same at every event

---

## Equipment Needed

- ✅ Portable WiFi router (you already have)
- ✅ ESP32 booth controller
- ✅ GoPro Hero 13 Black
- ✅ Phone/tablet with React Native app
- 💻 Laptop (for initial router configuration)

---

## Step-by-Step Setup

### Step 1: Router Initial Configuration

1. **Connect laptop to router**
   - Plug router into power
   - Connect laptop via WiFi (use password on router label)
   - Or connect via Ethernet cable for faster setup

2. **Access router admin panel**
   - Open browser, go to: `http://192.168.1.1` (or `192.168.0.1`)
   - Common router admin IPs:
     - TP-Link: `192.168.0.1` or `tplinkwifi.net`
     - Netgear: `192.168.1.1` or `routerlogin.net`
     - Linksys: `192.168.1.1`
   - Login with admin credentials (usually on router label)
   - Default username/password often: `admin/admin` or `admin/password`

3. **Configure WiFi network**
   - Navigate to: **Wireless Settings** or **WiFi Settings**
   - Set **Network Name (SSID):** `PhotoBooth360` (or your choice)
   - Set **Password:** Strong password (write it down!)
   - Set **Security:** WPA2-PSK (most compatible)
   - **Save** settings

4. **Confirm router IP (important!)**
   - Navigate to: **LAN Settings** or **Network Settings**
   - Verify **Router IP Address:** Should be `192.168.1.1`
   - If different (e.g., `192.168.0.1`), note it down
   - We'll use `192.168.1.x` network for this guide

---

### Step 2: Find Device MAC Addresses

A **MAC address** is a unique hardware identifier for each device. Format: `AA:BB:CC:DD:EE:FF`

#### For ESP32:

**Option A: Check device label/documentation**
- Your electrical engineer might have provided it
- Usually printed on ESP32 board or documentation

**Option B: Connect and find in router**
1. Connect ESP32 to your router WiFi (configure ESP32 code to connect to "PhotoBooth360")
2. In router admin panel → **DHCP Client List** or **Connected Devices**
3. Look for device named "ESP32" or similar
4. Note the MAC address (e.g., `A1:B2:C3:D4:E5:F6`)

#### For GoPro:

1. **Power on GoPro**
2. **Connect GoPro to WiFi:**
   - Swipe down on GoPro screen → **Preferences**
   - **Connections** → **Connect to Device**
   - **Wi-Fi** → **Network Info**
   - Select your "PhotoBooth360" network
   - Enter password
3. **Find MAC in router admin panel:**
   - Go to router admin → **DHCP Client List**
   - Look for "GoPro" or "HERO13"
   - Note the MAC address (e.g., `12:34:56:78:9A:BC`)

**Write down both MAC addresses - you'll need them next!**

---

### Step 3: Create Static IP Reservations

Now we'll tell the router: "Always give this MAC address the same IP"

1. **In router admin panel, navigate to:**
   - TP-Link: **DHCP** → **Address Reservation**
   - Netgear: **LAN Setup** → **Address Reservation**
   - Linksys: **Connectivity** → **DHCP Reservations**

2. **Add ESP32 reservation:**
   - Click **Add New** or **Add Reservation**
   - **MAC Address:** [Your ESP32 MAC from Step 2]
   - **Reserved IP:** `192.168.1.100`
   - **Description/Name:** "ESP32 Booth Controller"
   - **Enable:** ✅
   - Click **Save**

3. **Add GoPro reservation:**
   - Click **Add New** again
   - **MAC Address:** [Your GoPro MAC from Step 2]
   - **Reserved IP:** `192.168.1.101`
   - **Description/Name:** "GoPro Hero 13"
   - **Enable:** ✅
   - Click **Save**

4. **Restart router** (some routers require this)
   - Unplug power for 10 seconds
   - Plug back in and wait 1 minute

---

### Step 4: Verify Static IPs Work

1. **Power cycle all devices:**
   - Turn off ESP32 and GoPro
   - Wait 10 seconds
   - Turn them back on

2. **Reconnect devices to WiFi**
   - ESP32 should auto-connect (if configured correctly)
   - GoPro should auto-connect to "PhotoBooth360"

3. **Check assigned IPs in router admin:**
   - Go to **DHCP Client List**
   - Verify:
     - ESP32 → `192.168.1.100` ✅
     - GoPro → `192.168.1.101` ✅

4. **Test connectivity from your phone:**
   - Connect phone to "PhotoBooth360" WiFi
   - Open browser on phone
   - Try to ping/access ESP32: `http://192.168.1.100`
   - You should see ESP32 response (even if it's an error page, it means it's reachable)

---

### Step 5: Update React Native App Configuration

Now that IPs are fixed, update your app code:

**File:** `src/services/BoothService.ts`

```typescript
// At the top of the file
const ESP32_BASE_URL = 'http://192.168.1.100'; // ESP32 static IP

// In your API calls
async startRotation(speed: number): Promise<void> {
  const response = await axios.post(`${ESP32_BASE_URL}/rotate/start`, {
    speed: speed
  });
}
```

**File:** `src/services/GoProService.ts` (for WiFi file downloads)

```typescript
// For GoPro HTTP API (file downloads)
const GOPRO_WIFI_BASE_URL = 'http://192.168.1.101:8080';

async downloadLatestVideo(): Promise<string> {
  // Connect to GoPro via WiFi
  const response = await axios.get(`${GOPRO_WIFI_BASE_URL}/gopro/media/list`);
  // Download logic...
}
```

---

## Network Diagram

After setup, your network will look like this:

```
Internet (optional) ←→ [WiFi Router] 192.168.1.1
                              ↓
        ┌─────────────────────┼──────────────────────┐
        ↓                     ↓                      ↓
   [Phone/Tablet]     [ESP32 Booth]          [GoPro Hero 13]
   Dynamic IP      192.168.1.100 ✅       192.168.1.101 ✅
  (e.g., 192.168.1.50)   (Static)              (Static)
```

---

## Event Day Setup Procedure

**Every event, follow this checklist (takes ~2 minutes):**

1. ✅ Plug in router, wait 1 minute for boot
2. ✅ Power on ESP32 (auto-connects to WiFi)
3. ✅ Power on GoPro, connect to "PhotoBooth360" WiFi
4. ✅ Connect phone/tablet to "PhotoBooth360" WiFi
5. ✅ Open app, verify device connections
6. ✅ Test one session before customers arrive

**Troubleshooting if devices don't connect:**
- Check router is powered on
- Verify WiFi password hasn't changed
- Restart device (turn off/on)
- Check router DHCP client list to see if device is connected

---

## Troubleshooting Common Issues

### Problem: Can't access router admin panel

**Solutions:**
- Make sure you're connected to the router WiFi
- Try `192.168.0.1` instead of `192.168.1.1`
- Try router manufacturer's domain (e.g., `tplinkwifi.net`)
- Reset router (hold reset button 10 seconds) - **last resort!**

### Problem: Device shows in client list but wrong IP

**Cause:** Static reservation not working

**Solutions:**
- Double-check MAC address is correct (case-sensitive)
- Try deleting reservation and re-adding
- Restart router after adding reservation
- Make sure IP isn't already taken by another device

### Problem: ESP32 won't connect to WiFi

**Solutions:**
- Verify WiFi credentials in ESP32 code match router settings
- Check ESP32 is in range (move closer to router)
- Verify router security is WPA2-PSK (ESP32 might not support WPA3)
- Check ESP32 serial monitor for error messages

### Problem: GoPro won't connect to custom WiFi

**Solutions:**
- GoPro might require internet connection for initial setup
- Try connecting router to internet (via WAN port)
- Update GoPro firmware to latest version
- Try "forget network" on GoPro and reconnect

### Problem: App can't reach ESP32 even though connected

**Solutions:**
- Verify phone is on same WiFi network
- Check ESP32 web server is running (check serial monitor)
- Try accessing `http://192.168.1.100` in phone browser
- Check firewall settings on router (disable if testing)
- Verify ESP32 REST API endpoints are correct

### Problem: Devices get different IPs each time

**Cause:** Static reservation not saved

**Solutions:**
- Make sure you clicked "Save" in router admin
- Router might require reboot after adding reservations
- Some routers have separate "Apply" button - check for it

---

## Advanced: Portable Setup (No Internet Required)

If you want the booth to work anywhere without internet:

1. **Router in AP Mode (Access Point)**
   - Router doesn't need internet connection
   - Just creates local WiFi network
   - All devices communicate locally

2. **Mobile hotspot backup**
   - If router fails, use phone hotspot as backup
   - Connect ESP32 and GoPro to phone hotspot
   - Adjust IPs accordingly (phone hotspot uses different subnet)

---

## Security Considerations

**For events with public WiFi:**
- Use strong WiFi password (write on equipment case)
- Change password after each event if needed
- Don't connect router to internet (avoid hacking)
- Keep router firmware updated

**For equipment safety:**
- Don't share WiFi password with customers
- Use separate WiFi for booth control (not for guests)
- Physical security: keep router with equipment

---

## Backup Plan: If Router Fails at Event

**Option 1: Phone Hotspot**
1. Enable hotspot on phone: "PhotoBooth360_Backup"
2. Connect ESP32 and GoPro manually
3. Check their assigned IPs in hotspot settings
4. Temporarily update app code with new IPs
5. **Note:** Phone can't host hotspot AND run app simultaneously on some devices

**Option 2: Backup Router**
- Keep spare router ($30) with same configuration
- Pre-configured with same SSID/password/static IPs
- Swap and continue in 2 minutes

**Recommendation:** Always bring backup router to events

---

## Configuration Summary Sheet

**Print this and keep with equipment:**

```
─────────────────────────────────────────
PhotoBooth360 Network Configuration
─────────────────────────────────────────

WiFi Network Name (SSID): PhotoBooth360
WiFi Password: ___________________

Router Admin:
  IP: http://192.168.1.1
  Username: ___________________
  Password: ___________________

Device Static IPs:
  ESP32 Booth Controller: 192.168.1.100
    MAC Address: ___:___:___:___:___:___

  GoPro Hero 13: 192.168.1.101
    MAC Address: ___:___:___:___:___:___

Emergency Contact:
  Network Engineer: ___________________
  Phone: ___________________

─────────────────────────────────────────
```

---

**Setup Completed:** ☐ Not Started  ☐ In Progress  ☐ Verified Working

**Last Updated:** 2025-10-19
**Next Review:** Before first event
