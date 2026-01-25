# Laptop Video Processing Implementation

**Status:** ✅ Core implementation complete
**Date:** January 4, 2026
**Phase:** Phase 1c - React Native Integration

## Overview

We've successfully implemented a local laptop-based video processing workflow for PhotoBooth360. This allows automated video editing (overlays, music, text labels) on a Windows laptop at events, with the processed video delivered back to the phone for Telegram delivery.

## Architecture

```
┌─────────────┐      WiFi      ┌──────────────┐     WiFi     ┌─────────────┐
│   GoPro     │ ──────────────> │  React Native │ ───────────> │   Laptop    │
│  Hero 13    │   (Download)    │     Phone     │  (Upload)    │   Server    │
└─────────────┘                 └──────────────┘              └─────────────┘
                                        │                            │
                                        │                            │
                                        │         WiFi               │
                                        │  (Poll & Download)         │
                                        ▼                            ▼
                                ┌──────────────┐              ┌─────────────┐
                                │   Telegram   │              │   FFmpeg    │
                                │   Delivery   │              │  Processing │
                                └──────────────┘              └─────────────┘
```

## Complete Workflow

### 1. Recording Session
- User taps "START SESSION" on HomeScreen
- SessionOrchestrator starts GoPro, Booth, and Music
- Auto-stops after configured duration

### 2. Video Download (from GoPro)
- Enable GoPro WiFi via BLE
- Switch phone to GoPro WiFi network
- Download raw video via HTTP
- Switch back to booth WiFi

### 3. Laptop Processing (NEW)
- **Upload:** Transfer raw video to laptop server (Node.js/Express)
- **Process:** FFmpeg applies template (overlay, music, text, compression)
- **Poll:** Check status every 3 seconds until complete
- **Download:** Get processed video back to phone

### 4. Telegram Delivery (Manual)
- Open Telegram chat with customer
- Share processed video using native share sheet
- OR copy video path and manually attach

## Implementation Details

### Laptop Server (Node.js)

**Location:** `laptop-video-server/`

**Features:**
- ✅ Parallel processing (2 concurrent videos)
- ✅ Template system (Corporate, Party)
- ✅ FFmpeg integration (overlay, music, text, compression)
- ✅ Job queue with status polling
- ✅ REST API (upload, status, download, health)

**Key Files:**
- [laptop-video-server/src/services/queue.ts](../laptop-video-server/src/services/queue.ts) - Parallel job queue
- [laptop-video-server/src/services/processor.ts](../laptop-video-server/src/services/processor.ts) - FFmpeg processing
- [laptop-video-server/src/routes/upload.ts](../laptop-video-server/src/routes/upload.ts) - Upload endpoint
- [laptop-video-server/README.md](../laptop-video-server/README.md) - Complete server documentation

**Configuration:**
```typescript
// Change concurrent jobs in src/services/queue.ts
const MAX_CONCURRENT_JOBS = 2; // 1 for sequential, 2-4 for parallel
```

### React Native App

**New Services:**

1. **LaptopTransferService** ([src/services/LaptopTransferService.ts](../src/services/LaptopTransferService.ts))
   - Upload video with progress tracking
   - Poll status until complete
   - Download processed video
   - Complete workflow: `processVideo()`

2. **TelegramDeliveryService** ([src/services/TelegramDeliveryService.ts](../src/services/TelegramDeliveryService.ts))
   - Open Telegram chat via deep link
   - Share video using native share sheet
   - Copy video path to clipboard (fallback)
   - Manual delivery workflow

**Updated Services:**

1. **SessionOrchestrator** ([src/services/SessionOrchestrator.ts](../src/services/SessionOrchestrator.ts))
   - New method: `processVideoOnLaptop()`
   - Integrated into `stopSession()` workflow
   - Handles all 4 laptop processing steps automatically

**Updated Types:**

[src/types/index.ts](../src/types/index.ts) - Added:
- `SessionState` - New statuses: `uploading_to_laptop`, `processing_on_laptop`, `downloading_from_laptop`, `ready_for_delivery`
- `LaptopServerConfig` - Server URL and template selection
- `LaptopUploadResponse`, `LaptopStatusResponse`, `LaptopHealthResponse`
- `ILaptopTransferService` - Service interface

## API Endpoints

**Base URL:** `http://192.168.1.200:3001` (configurable)

### POST /upload
Upload raw video for processing.

**Multipart Form Data:**
- `file` - Video file (MP4)
- `eventName` - Event name
- `customerName` - Customer name
- `customerPhone` - Phone number
- `template` - Template ID ("corporate" or "party")

**Response:**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "message": "Video uploaded and queued for processing"
}
```

### GET /status/:jobId
Check processing status.

**Response:**
```json
{
  "jobId": "uuid-here",
  "status": "processing",
  "progress": 45,
  "inputFilename": "input.mp4"
}
```

Status: `queued`, `processing`, `completed`, `failed`

### GET /download/:jobId
Download processed video (when status is `completed`).

### GET /health
Check server status.

**Response:**
```json
{
  "online": true,
  "queueLength": 3,
  "processingCount": 2,
  "maxConcurrent": 2,
  "ffmpegVersion": "6.0",
  "uptime": 3600
}
```

## Session State Flow

```
idle
  ↓
preparing (configuring devices)
  ↓
recording (GoPro + Booth + Music active)
  ↓
stopping (stopping all devices)
  ↓
downloading (GoPro WiFi workflow)
  ↓
uploading_to_laptop (transferring to server)
  ↓
processing_on_laptop (FFmpeg processing)
  ↓
downloading_from_laptop (getting processed video)
  ↓
ready_for_delivery (video ready for Telegram)
```

## File Naming Convention

**Output filename format:**
```
CustomerName_EventName_Date_PhotoBooth360.mp4
```

**Example:**
```
JohnSmith_WeddingReception_2025-01-04_PhotoBooth360.mp4
```

## Templates

### Corporate Template
- **Overlay:** `assets/overlays/corporate-frame.png`
- **Music:** `assets/music/corporate-subtle.mp3` (20% volume)
- **Text:** White, 36pt, bottom position
- **Quality:** CRF 23 (balanced)

### Party Template
- **Overlay:** `assets/overlays/party-frame.png`
- **Music:** `assets/music/party-upbeat.mp3` (35% volume)
- **Text:** Gold (#FFD700), 40pt, bottom position
- **Quality:** CRF 23 (balanced)

## Network Configuration

**Required:**
- Laptop IP: `192.168.1.200` (static, configured in router)
- Laptop Server Port: `3001`
- Phone and laptop on same WiFi network (booth WiFi)

**Setup:**
1. Set static IP for laptop in router settings
2. Start laptop server: `cd laptop-video-server && npm run dev`
3. Verify connectivity: `http://192.168.1.200:3001/health`

## Testing Checklist

### Laptop Server Testing
- [ ] Server starts without errors
- [ ] FFmpeg is detected (`/health` returns version)
- [ ] Upload endpoint accepts videos
- [ ] Processing completes successfully
- [ ] Download returns processed video
- [ ] Parallel processing works (2 videos at once)
- [ ] Templates apply correctly (overlay + music + text)

### React Native Integration Testing
- [ ] `LaptopTransferService.checkHealth()` succeeds
- [ ] Video upload with progress tracking works
- [ ] Status polling updates UI correctly
- [ ] Processed video downloads successfully
- [ ] SessionOrchestrator integrates smoothly
- [ ] Error handling works (server offline, upload fails, etc.)

### Telegram Delivery Testing
- [ ] Telegram deep link opens app
- [ ] Share sheet shows Telegram option
- [ ] Video attaches and sends successfully
- [ ] Delivery message copies to clipboard

## Known Limitations & Future Improvements

### Current Limitations
1. **Templates:** Only 2 templates (Corporate, Party)
2. **Manual Telegram:** User must manually attach and send video
3. **No retry logic:** If upload/download fails, must restart session
4. **No cloud option:** Laptop must be present at every event
5. **No progress persistence:** Closing app loses processing status

### Phase 2+ Improvements
1. **Automated Telegram:** Bot API for automatic delivery
2. **More templates:** Birthday, Wedding, Custom branding
3. **Retry logic:** Automatic retry on network failures
4. **Cloud option:** Optional cloud processing server
5. **Custom overlays:** Per-event branding upload
6. **Video previews:** Show preview before delivery
7. **Delivery tracking:** Mark videos as delivered in app
8. **Batch processing:** Process multiple videos at once

## Troubleshooting

### "Laptop server not reachable"
- Check laptop IP: `ipconfig` (Windows) should show 192.168.1.200
- Verify server running: `npm run dev` in laptop-video-server
- Test connectivity: Open `http://192.168.1.200:3001/health` in browser
- Check firewall: Allow port 3001 in Windows Firewall

### "Upload fails immediately"
- Check video file exists on phone
- Verify file size (should be < 500MB for 30sec video)
- Check laptop disk space
- Review server logs for errors

### "Processing stuck at 0%"
- Check FFmpeg is installed and in PATH
- Verify template assets exist (overlays, music)
- Check server logs: `laptop-video-server/` console
- Review `outputs/` folder for partial files

### "Download fails"
- Verify job status is "completed" first
- Check phone storage space
- Ensure WiFi connection is stable
- Try manual download: `http://192.168.1.200:3001/download/JOB_ID`

### "Telegram won't open"
- Verify Telegram app is installed
- Check phone number format (+251...)
- Try manual share instead of deep link
- Copy video path and attach manually

## Next Steps

1. **Update HomeScreen UI** - Show laptop processing progress
2. **Add configuration screen** - Laptop IP and template selection
3. **Add delivery screen** - Telegram delivery with customer list
4. **End-to-end testing** - Test complete workflow with real event
5. **Create operator guide** - Step-by-step event setup instructions

## Files Created/Modified

### New Files
- `laptop-video-server/` (entire Node.js server project)
- `src/services/LaptopTransferService.ts`
- `src/services/TelegramDeliveryService.ts`
- `docs/LAPTOP_PROCESSING_IMPLEMENTATION.md` (this file)

### Modified Files
- `src/types/index.ts` - Added laptop processing types
- `src/services/SessionOrchestrator.ts` - Added laptop workflow

## References

- [Laptop Server README](../laptop-video-server/README.md)
- [Asset Requirements](../laptop-video-server/assets/README.md)
- [Phase 1 Plan](./PHASE1_PLAN.md)
- [Future Automation](./FUTURE_AUTOMATION.md)
