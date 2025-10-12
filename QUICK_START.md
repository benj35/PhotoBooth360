# 360° Photo Booth - Quick Start Guide

## Project Overview

This mobile application controls a 360° photo booth system that coordinates:
- **GoPro Hero 13 Black** camera (via Bluetooth BLE)
- **ESP32-controlled booth** rotation (via REST API)
- **Audio playback** for background music
- **Automated session orchestration**

## What's Been Built

### ✅ Complete Implementation

1. **Service Layer**
   - `GoProService`: Full BLE integration with GoPro Hero 13
   - `BoothService`: REST API client (mock mode for now)
   - `AudioService`: Music playback management
   - `SessionOrchestrator`: Coordinates all devices for automated sessions

2. **State Management (Zustand)**
   - `sessionStore`: Session config and state
   - `deviceStore`: Device connections
   - `musicStore`: Music library

3. **UI Screens (React Native)**
   - Connection setup screen
   - Main control interface
   - Music selection
   - Session configuration
   - Manual device controls

4. **Features**
   - One-button automated session start
   - Real-time status monitoring
   - Configurable session parameters
   - Individual device controls for testing

## Getting Started

### 1. Install Dependencies

```bash
cd PhotoBooth360/mobile-app
npm install
```

### 2. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 3. Run the App

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

## Current Status & Next Steps

### Phase 1 ✅ (COMPLETE)
- Full project structure
- All services implemented
- Complete UI with 5 screens
- Ready for testing

### Phase 2 📋 (Next)
**Hardware Testing:**
1. Test GoPro BLE connection with physical device
2. Implement ESP32 REST API on the booth hardware
3. Update `BoothService.ts` with real endpoints
4. Test end-to-end session flow

**ESP32 API Endpoints Needed:**
```
POST /rotate/start   { "speed": 50 }
POST /rotate/stop
GET /status
```

### Phase 3 📋 (Future)
- Video processing pipeline
- FFmpeg video + audio merging
- Intro/outro clips
- Video gallery

## Architecture Highlights

### Device Coordination Flow
```
User taps "START SESSION"
    ↓
SessionOrchestrator coordinates:
    1. Load music track
    2. Configure GoPro settings
    3. Start booth rotation
    4. Start GoPro recording
    5. Play music
    6. Auto-stop after duration
```

### Service Abstraction Pattern
All services implement interfaces (`IGoProService`, `IBoothService`, etc.) making it easy to:
- Mock for testing
- Swap implementations
- Test components independently

## Key Files

```
mobile-app/
├── src/services/
│   ├── SessionOrchestrator.ts    # Main coordination logic
│   ├── GoProService.ts           # GoPro BLE (ready for testing)
│   ├── BoothService.ts           # ESP32 REST (mock mode)
│   └── AudioService.ts           # Music playback
├── src/stores/
│   ├── sessionStore.ts           # Session state
│   ├── deviceStore.ts            # Device connections
│   └── musicStore.ts             # Music library
└── src/screens/
    ├── ConnectionScreen.tsx      # Device setup
    ├── HomeScreen.tsx            # Main interface
    └── [other screens]
```

## Testing Checklist

### Without Hardware (Current)
- [x] App builds and runs
- [x] Navigation works
- [x] UI renders correctly
- [x] Mock services respond

### With GoPro (Phase 2)
- [ ] GoPro discovered via BLE scan
- [ ] Successful pairing
- [ ] Start/stop recording commands work
- [ ] Status updates received

### With Booth (Phase 2)
- [ ] Network connection to ESP32
- [ ] Rotation start/stop commands
- [ ] Status polling works

### Full Integration (Phase 2)
- [ ] Automated session completes successfully
- [ ] All devices synchronized
- [ ] Graceful error handling
- [ ] Emergency stop works

## Configuration

### Default Session Settings
- Duration: 20 seconds
- Rotation Speed: 50%
- Video Mode: Standard
- Resolution: 4K

All configurable via the Session Config screen.

## Troubleshooting

**App won't build:**
```bash
# Clear cache
npm start -- --reset-cache

# Clean rebuild
cd android && ./gradlew clean && cd ..
npm run android
```

**BLE issues:**
- Must use physical device (not simulator)
- Check Bluetooth permissions granted
- Ensure GoPro in pairing mode

**Booth connection fails:**
- Phase 1 uses mock mode (expected)
- Will work once ESP32 API implemented

## Next Actions

1. **Test on physical device** with actual GoPro
2. **Develop ESP32 REST API** for booth control
3. **Integrate real endpoints** in BoothService
4. **Test full session flow** with all hardware

## Notes

- **Mock Mode**: BoothService currently operates in mock mode - all functions log but don't fail
- **BLE Ready**: GoProService is fully implemented per OpenGoPro spec
- **Extensible**: Architecture designed for easy addition of video processing, cloud features, etc.

---

**Project Status**: Core application complete and ready for hardware integration testing.
