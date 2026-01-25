# PhotoBooth360 Laptop Video Processing Server

Node.js/Express server for processing 360° booth videos with overlays, music, and text labels.

## Features

- **Parallel Processing**: Processes up to 2 videos simultaneously (configurable)
- **Template System**: Pre-configured styles (Corporate, Party)
- **FFmpeg Processing**: Overlays, music mixing, text labels, compression
- **Job Queue**: Automatic queuing and status tracking
- **REST API**: Upload, status check, download endpoints

## Quick Start

### 1. Prerequisites

- **Node.js 18+** installed
- **FFmpeg** installed and in PATH
  - Download from: https://www.gyan.dev/ffmpeg/builds/
  - Extract to `C:\ffmpeg`
  - Add `C:\ffmpeg\bin` to System PATH
  - Restart terminal after adding to PATH

### 2. Install Dependencies

```bash
cd laptop-video-server
npm install
```

### 3. Add Assets

Place your files in the `assets/` folder:

- `assets/overlays/corporate-frame.png` - Corporate overlay (PNG with transparency)
- `assets/overlays/party-frame.png` - Party overlay (PNG with transparency)
- `assets/music/corporate-subtle.mp3` - Corporate background music
- `assets/music/party-upbeat.mp3` - Party background music

See [assets/README.md](assets/README.md) for asset requirements.

### 4. Start Server

**Development mode** (auto-restart on changes):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

Server runs on: **http://localhost:3001**

## API Endpoints

### POST /upload
Upload a video for processing.

**Form Data:**
- `file` - Video file (MP4)
- `eventName` - Event name (e.g., "WeddingReception")
- `customerName` - Customer name (e.g., "John_Smith")
- `customerPhone` - Phone number (e.g., "+251912345678")
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
  "inputFilename": "input.mp4",
  "createdAt": "2025-01-04T10:00:00Z",
  "startedAt": "2025-01-04T10:00:15Z"
}
```

**Status values:** `queued`, `processing`, `completed`, `failed`

### GET /download/:jobId
Download processed video (only when status is `completed`).

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

### GET /templates
List available templates.

## Configuration

### Parallel Processing

Edit `src/services/queue.ts` line 15:

```typescript
const MAX_CONCURRENT_JOBS = 2; // Change this value
```

**Recommended values:**
- `1` - Sequential (safest for low-end laptops)
- `2` - Default (balanced for most laptops)
- `3-4` - Powerful laptops with 8+ cores, 16GB+ RAM
- `6+` - Cloud servers only

### Templates

Templates are defined in `templates/*.json`. Each template specifies:
- Overlay image path
- Background music path
- Music volume (0.0 - 1.0)
- Text position, color, size
- Output quality (CRF value)

Example:
```json
{
  "id": "corporate",
  "name": "Corporate Professional",
  "description": "Clean professional look with subtle branding",
  "overlay": "overlays/corporate-frame.png",
  "music": "music/corporate-subtle.mp3",
  "musicVolume": 0.2,
  "textPosition": "bottom",
  "textColor": "#FFFFFF",
  "textSize": 36,
  "outputQuality": 23
}
```

## File Output

Processed videos are saved to `outputs/` with the filename format:
```
CustomerName_EventName_Date_PhotoBooth360.mp4
```

Example: `JohnSmith_WeddingReception_2025-01-04_PhotoBooth360.mp4`

## Testing

Test with curl:

```bash
# Upload a video
curl -X POST http://localhost:3001/upload \
  -F "file=@test.mp4;type=video/mp4" \
  -F "eventName=TestEvent" \
  -F "customerName=TestCustomer" \
  -F "customerPhone=+251912345678" \
  -F "template=party"

# Check status (replace JOB_ID)
curl http://localhost:3001/status/JOB_ID

# Download when completed
curl -O -J http://localhost:3001/download/JOB_ID
```

## Troubleshooting

**"FFmpeg not found"**
- Ensure FFmpeg is in PATH
- Restart terminal/server after adding to PATH
- Test: `ffmpeg -version` should work

**Videos process slowly**
- Reduce `MAX_CONCURRENT_JOBS` to 1
- Check CPU usage in Task Manager
- Close other applications

**Server crashes during processing**
- Reduce parallel jobs (set to 1)
- Check available RAM (need 2GB+ per concurrent job)
- Verify video files aren't corrupted

**Music not audible**
- Check music files exist in `assets/music/`
- Increase `musicVolume` in template config
- Test output with VLC or another robust video player

## Project Structure

```
laptop-video-server/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── types/index.ts        # TypeScript type definitions
│   ├── services/
│   │   ├── queue.ts          # Job queue with parallel processing
│   │   └── processor.ts      # FFmpeg video processing
│   └── routes/
│       ├── upload.ts         # POST /upload
│       ├── status.ts         # GET /status/:jobId
│       ├── download.ts       # GET /download/:jobId
│       └── health.ts         # GET /health, /templates
├── templates/                # Template configurations
│   ├── corporate.json
│   └── party.json
├── assets/                   # Your overlay images and music
│   ├── overlays/
│   └── music/
├── uploads/                  # Temporary upload storage
└── outputs/                  # Processed videos
```

## Future Plans

- Cloud hosting option (Phase 2+)
- More templates (Birthday, Wedding, Corporate Event)
- Custom branding per event
- Color grading filters
- Slow motion effects
- Multi-language text support
