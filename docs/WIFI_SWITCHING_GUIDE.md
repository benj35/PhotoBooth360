# Automatic WiFi Switching Guide

## Overview

The PhotoBooth360 app implements **automatic WiFi switching** to enable real-time video delivery during events. This allows seamless transitions between:
- **Booth WiFi** - Controls booth rotation (ESP32) and GoPro recording (BLE)
- **GoPro WiFi** - Downloads recorded videos (HTTP API)

## How It Works

### 1. Initial Setup (Connection Screen)

When you connect to the booth:
1. App detects your current WiFi network (Booth WiFi)
2. Modal appears asking for WiFi password
3. Credentials are saved in `WiFiManagerService`
4. GoPro WiFi credentials are pre-configured (HERO13 / 4yj-zx7-zHt)

**Why save password?**
The app needs the password to automatically reconnect to Booth WiFi after downloading videos from GoPro.

### 2. Recording Session Workflow

**BOOTH WiFi Connected (192.168.4.1):**
```
1. Customer enters info → Start session
2. Booth starts rotating (via ESP32 REST API)
3. GoPro starts recording (via BLE)
4. Music plays (via AudioService)
5. Session runs for configured duration (e.g., 20 seconds)
6. All devices stop
```

### 3. Automatic WiFi Switch (Post-Recording)

**Session stops → Automatic WiFi switching begins:**

```typescript
// SessionOrchestrator.stopSession()
await goProService.stopRecording();
await boothService.stopRotation();

// === AUTOMATIC WIFI SWITCHING ===
console.log('Switching to GoPro WiFi...');
const success = await wifiManager.switchToGoProWiFi();

if (success) {
  // Test HTTP connection
  const connected = await goProWiFiService.testConnection();

  if (connected) {
    console.log('✅ Ready for video download!');
    // UI shows download button
  }
}
```

**Behind the scenes:**
1. Disconnect from Booth WiFi
2. Wait 1 second
3. Connect to GoPro WiFi (SSID: "HERO13", Password: "4yj-zx7-zHt")
4. Wait 2 seconds for connection to stabilize
5. Test HTTP connection to 10.5.5.9:8080
6. UI updates to show download button

### 4. Video Download Phase

**GOPRO WiFi Connected (10.5.5.9):**
```
User taps "Download Latest Video"
↓
1. Get latest video from GoPro media list
2. Download via HTTP: /videos/DCIM/100GOPRO/GOPR0001.MP4
3. Save to app directory with custom name
4. Update SessionRecord status: downloading → editing
```

### 5. Return to Booth WiFi

**After download completes → Switch back to Booth WiFi:**

```typescript
// After video download
const success = await wifiManager.switchToBoothWiFi();

if (success) {
  console.log('✅ Reconnected to Booth WiFi');
  console.log('Ready for next customer!');
}
```

**Behind the scenes:**
1. Disconnect from GoPro WiFi
2. Wait 1 second
3. Connect to Booth WiFi (using saved credentials)
4. Wait 2 seconds for connection to stabilize
5. Verify connection to booth
6. Ready for next session

## Code Architecture

### WiFiManagerService

**File:** `src/services/WiFiManagerService.ts`

**Key Methods:**
- `setBoothCredentials(ssid, password)` - Save booth WiFi info
- `switchToGoProWiFi()` - Switch to GoPro network
- `switchToBoothWiFi()` - Switch back to booth network
- `getCurrentSSID()` - Get current network name
- `isConnectedToGoPro()` - Check if on GoPro WiFi
- `isConnectedToBooth()` - Check if on Booth WiFi

**Implementation:**
```typescript
import WifiManager from 'react-native-wifi-reborn';

async switchToGoProWiFi(): Promise<boolean> {
  // Disconnect from current
  await WifiManager.disconnect();
  await this.sleep(1000);

  // Connect to GoPro
  await WifiManager.connectToProtectedSSID(
    'HERO13',
    '4yj-zx7-zHt',
    false,
    false
  );

  await this.sleep(2000);

  // Verify connection
  const currentSSID = await this.getCurrentSSID();
  return currentSSID === 'HERO13';
}
```

### Integration Points

**1. SessionOrchestrator** - Triggers WiFi switch after recording
```typescript
async stopSession() {
  // Stop all devices
  await goProService.stopRecording();
  await boothService.stopRotation();

  // Switch to GoPro WiFi
  await wifiManager.switchToGoProWiFi();
  await goProWiFiService.testConnection();
}
```

**2. ConnectionScreen** - Captures booth WiFi credentials
```typescript
const handleConnectBooth = async () => {
  await connectBooth(boothUrl);

  // Get current network
  const ssid = await wifiManager.getCurrentSSID();

  // Show modal to collect password
  setDetectedSSID(ssid);
  setShowWiFiModal(true);
};
```

**3. GoProWiFiService** - Handles downloads on GoPro WiFi
```typescript
async downloadVideo(filename, destinationPath, onProgress) {
  const downloadUrl = 'http://10.5.5.9:8080/videos/DCIM/100GOPRO/' + filename;

  await RNFS.downloadFile({
    fromUrl: downloadUrl,
    toFile: destinationPath,
    progress: (res) => {
      const percent = (res.bytesWritten / res.contentLength) * 100;
      onProgress(percent);
    }
  }).promise;
}
```

## Real-Time Workflow Timeline

**Typical 2-3 minute workflow:**

| Time | Network | Activity | Status |
|------|---------|----------|--------|
| 0:00 | Booth | Customer enters info | - |
| 0:10 | Booth | Recording starts (20s) | Recording |
| 0:30 | Booth | Recording stops | Stopping |
| 0:35 | Switch | Switching to GoPro WiFi | Switching |
| 0:40 | GoPro | Testing HTTP connection | - |
| 0:45 | GoPro | Download video (30-60s) | Downloading |
| 1:30 | Switch | Switching back to Booth WiFi | Switching |
| 1:35 | Booth | Edit video in background | Editing |
| 2:15 | Booth | Upload to Telegram | Uploading |
| 2:30 | Booth | Ready for next customer | Idle |

**Throughput:** ~30 customers/hour with automatic switching

## Permissions Required

### Android Manifest

```xml
<!-- WiFi permissions -->
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
```

### iOS Info.plist

WiFi switching may have limitations on iOS. If iOS doesn't support programmatic WiFi switching:
- Fall back to manual switching with UI prompts
- OR use dual-device approach (one phone controls, another downloads)

## Troubleshooting

### WiFi Switch Fails

**Symptoms:** Can't switch to GoPro WiFi or back to Booth WiFi

**Solutions:**
1. Check WiFi permissions are granted
2. Verify GoPro WiFi is enabled (check GoPro screen)
3. Verify booth WiFi password was saved correctly
4. Try manual WiFi switch as fallback
5. Restart app and re-enter booth credentials

### GoPro HTTP Not Reachable

**Symptoms:** Connected to GoPro WiFi but downloads fail

**Solutions:**
1. Verify GoPro IP is 10.5.5.9 (default)
2. Check GoPro WiFi is ON (not just BLE)
3. Test with curl: `curl http://10.5.5.9:8080/gp/gpControl/status`
4. Restart GoPro WiFi
5. Check phone is actually connected (getCurrentSSID)

### Can't Reconnect to Booth

**Symptoms:** After GoPro download, can't reconnect to booth

**Solutions:**
1. Verify booth WiFi password is correct
2. Check booth WiFi is still broadcasting
3. Try manual reconnection
4. Restart booth router if needed

## Testing WiFi Switching

### Manual Test

```typescript
import wifiManager from '@services/WiFiManagerService';

// Test full workflow
await wifiManager.testWiFiSwitching();

// Output:
// [WiFiManager] Current network: MyBoothNetwork
// [WiFiManager] Switching to GoPro WiFi...
// [WiFiManager] GoPro switch result: SUCCESS
// [WiFiManager] Switching back to Booth WiFi...
// [WiFiManager] Booth switch result: SUCCESS
```

### Integration Test

1. Connect to booth WiFi → Enter password in modal
2. Start recording session → Wait for completion
3. Observe automatic switch to GoPro WiFi
4. Check console for successful HTTP connection
5. Download video (manually trigger)
6. Observe automatic switch back to Booth WiFi

## Future Enhancements

**Phase 2:**
- Background WiFi switching (no UI interruption)
- Retry logic for failed switches
- Fallback to manual prompts if automatic fails
- WiFi state persistence (remember networks)
- Network quality monitoring (signal strength)

**Phase 3:**
- iOS support (if possible, otherwise dual-device)
- Predictive switching (switch before user action)
- Batch download optimization
- Offline queue (download when WiFi available)
