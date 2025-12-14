# GoPro WiFi Setup Guide

## GoPro Hero 13 Black WiFi Configuration

### Your GoPro Details
- **Camera Name (SSID):** GP50113778
- **WiFi Password:** 2gP-Cn5-sSV
- **WiFi IP Address:** 10.5.5.9
- **HTTP API Port:** 8080

### Booth WiFi Details
- **Network Name (SSID):** Benjua
- **WiFi Password:** AZBH@2025

### Enabling GoPro WiFi

1. **On GoPro:**
   - Swipe down from top
   - Tap **Preferences**
   - Tap **Connections**
   - Enable **Wireless Connections**
   - Tap **WiFi**
   - Turn ON
   - Note the WiFi name (SSID) and password

2. **On Phone:**
   - Go to WiFi settings
   - Connect to network: **GP50113778**
   - Enter password: **2gP-Cn5-sSV**
   - Wait for connection

### GoPro WiFi API Endpoints

Base URL: `http://10.5.5.9:8080`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/gp/gpControl/status` | GET | Get GoPro status |
| `/gp/gpMediaList` | GET | List all media files |
| `/videos/DCIM/100GOPRO/{filename}` | GET | Download video file |
| `/gp/gpControl/command/shutter?p=1` | GET | Start recording |
| `/gp/gpControl/command/shutter?p=0` | GET | Stop recording |

### File Naming Convention

GoPro files follow this pattern:
- **Video:** `GOPR0001.MP4`, `GOPR0002.MP4`, etc.
- **Directory:** `/DCIM/100GOPRO/`

### Testing Connection

```bash
# Test if connected to GoPro WiFi
curl http://10.5.5.9:8080/gp/gpControl/status

# List media files
curl http://10.5.5.9:8080/gp/gpMediaList

# Download a video
curl http://10.5.5.9:8080/videos/DCIM/100GOPRO/GOPR0001.MP4 -o video.mp4
```

### App Workflow

1. **Recording Phase** (Booth WiFi):
   - Phone connected to booth WiFi (192.168.4.1)
   - Control booth rotation via REST API
   - Control GoPro via BLE commands
   - Video saves to GoPro SD card

2. **Download Phase** (GoPro WiFi):
   - Manually switch phone to GoPro WiFi
   - App connects to 10.5.5.9:8080
   - Downloads latest video
   - Renames: `EventName_CustomerName_Timestamp.mp4`
   - Saves to: `/storage/emulated/0/Android/data/com.photobooth360/files/PhotoBooth360/Videos/`

3. **Return to Recording** (Booth WiFi):
   - Manually switch back to booth WiFi
   - Ready for next customer

### Manual WiFi Switching Steps

**After recording a session:**
1. Pull down notification shade
2. Long-press WiFi icon
3. Disconnect from booth WiFi
4. Connect to "HERO13" (password: 4yj-zx7-zHt)
5. Wait 5-10 seconds
6. Return to app
7. Tap "Download Latest Video"
8. Wait for download to complete
9. Switch back to booth WiFi
10. Ready for next customer

### Future Automation

In Phase 2, we can explore:
- Programmatic WiFi switching (requires native code)
- Dual-device setup (one for control, one for downloads)
- Batch download at end of event

### Troubleshooting

**Can't see GoPro WiFi:**
- Make sure GoPro wireless is ON
- Try turning WiFi off/on on GoPro
- Restart GoPro

**Connection timeout:**
- Make sure phone is connected to GoPro WiFi
- Check IP address is 10.5.5.9
- GoPro WiFi may have auto-turned off (check GoPro)

**Download fails:**
- Check file exists on GoPro
- Verify filename (case-sensitive)
- Ensure enough phone storage space
