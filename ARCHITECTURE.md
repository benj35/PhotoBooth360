# Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Mobile App (React Native)            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Session    │  │   Device     │  │    Music     │  │
│  │    Store     │  │    Store     │  │    Store     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │                             │
│                  ┌────────▼─────────┐                   │
│                  │    Session       │                   │
│                  │  Orchestrator    │                   │
│                  └────────┬─────────┘                   │
│                           │                             │
│         ┌─────────────────┼─────────────────┐           │
│         │                 │                 │           │
│    ┌────▼────┐      ┌─────▼─────┐    ┌─────▼─────┐    │
│    │ GoPro   │      │   Booth   │    │   Audio   │    │
│    │ Service │      │  Service  │    │  Service  │    │
│    └────┬────┘      └─────┬─────┘    └─────┬─────┘    │
└─────────┼──────────────────┼────────────────┼──────────┘
          │                  │                │
          │ BLE              │ REST API       │ Native
          │                  │                │
┌─────────▼──────┐  ┌────────▼────────┐  ┌───▼──────┐
│  GoPro Hero    │  │   ESP32 Booth   │  │  Device  │
│  13 Black      │  │   Controller    │  │  Audio   │
└────────────────┘  └─────────────────┘  └──────────┘
```

## Layer Breakdown

### 1. UI Layer (React Native Screens)

**Screens:**
- `ConnectionScreen`: Initial device setup and pairing
- `HomeScreen`: Main control interface with session start button
- `MusicSelectionScreen`: Music library browser
- `SessionConfigScreen`: Session parameter configuration
- `ManualControlScreen`: Individual device testing

**Navigation:**
- React Navigation (Native Stack)
- Type-safe navigation with TypeScript

### 2. State Management (Zustand)

**sessionStore**
```typescript
{
  config: SessionConfig        // Session parameters
  state: SessionState          // Current session status
  startSession()              // Start automated session
  stopSession()               // Stop current session
  updateConfig()              // Update session parameters
}
```

**deviceStore**
```typescript
{
  devices: DeviceConnectionState  // Connection states
  connectGoPro()                 // Connect to GoPro via BLE
  connectBooth()                 // Connect to booth via network
  refreshStatus()                // Poll device status
}
```

**musicStore**
```typescript
{
  availableTracks: MusicTrack[]  // Library of music
  selectedTrack: MusicTrack      // Currently selected
  loadTracks()                   // Load music library
  selectTrack()                  // Preload a track
}
```

### 3. Service Layer

#### SessionOrchestrator
**Purpose**: Coordinates all devices for automated recording sessions

**Key Methods:**
- `startSession(config)`: Orchestrates startup sequence
- `stopSession()`: Gracefully stops all devices
- `emergencyStop()`: Force stops all devices immediately
- `onStateChange(callback)`: Subscribe to state updates

**Session Lifecycle:**
```
IDLE → PREPARING → RECORDING → STOPPING → IDLE
                        ↓
                     ERROR
```

**Startup Sequence:**
1. Validate device connections
2. Load music track (if selected)
3. Configure GoPro settings
4. Start booth rotation
5. Start GoPro recording
6. Start music playback
7. Schedule auto-stop timer

#### GoProService
**Purpose**: Bluetooth Low Energy communication with GoPro Hero 13

**Technology:** react-native-ble-plx

**Key Methods:**
- `connect()`: Scan and pair with GoPro
- `startRecording()`: Send shutter ON command
- `stopRecording()`: Send shutter OFF command
- `getStatus()`: Query camera status
- `setVideoMode(mode)`: Configure video mode
- `setResolution(resolution)`: Set video resolution

**BLE Details:**
- Service UUID: `0000fea6-0000-1000-8000-00805f9b34fb`
- Command Characteristic: `b5f90072-aa8d-11e3-9046-0002a5d5c51b`
- Status Characteristic: `b5f90076-aa8d-11e3-9046-0002a5d5c51b`

**Reference:** [GoPro OpenGoPro BLE API](https://gopro.github.io/OpenGoPro/ble/)

#### BoothService
**Purpose**: Network communication with ESP32 booth controller

**Technology:** axios HTTP client

**Key Methods:**
- `connect(baseUrl)`: Establish connection to ESP32
- `startRotation(speed)`: Begin booth rotation
- `stopRotation()`: Stop booth rotation
- `getStatus()`: Query booth status

**Expected API Endpoints:**
```
POST /rotate/start
Body: { "speed": 50 }  // 0-100

POST /rotate/stop

GET /status
Response: {
  "rotating": false,
  "speed": 0,
  "temperature": 45,
  "errorCode": null
}
```

**Current Implementation:** Mock mode - logs operations but doesn't fail

#### AudioService
**Purpose**: Music playback during sessions

**Technology:** react-native-sound

**Key Methods:**
- `loadTrack(uri)`: Preload audio file
- `play()`: Start playback
- `stop()`: Stop playback
- `getDuration()`: Get track length
- `getCurrentTime()`: Get playback position

## Data Flow

### Automated Session Flow

```
User taps "START SESSION"
        ↓
  sessionStore.startSession()
        ↓
  SessionOrchestrator.startSession(config)
        ↓
  ┌───────────────────────────────────┐
  │ 1. Validate connections           │
  │ 2. audioService.loadTrack()       │
  │ 3. goProService.setVideoMode()    │
  │ 4. goProService.setResolution()   │
  │ 5. boothService.startRotation()   │
  │ 6. goProService.startRecording()  │
  │ 7. audioService.play()            │
  │ 8. Schedule auto-stop timer       │
  └───────────────────────────────────┘
        ↓
  State updates broadcast to UI
        ↓
  Timer expires
        ↓
  SessionOrchestrator.stopSession()
        ↓
  ┌───────────────────────────────────┐
  │ 1. audioService.stop()            │
  │ 2. goProService.stopRecording()   │
  │ 3. boothService.stopRotation()    │
  └───────────────────────────────────┘
        ↓
  State returns to IDLE
```

### Device Connection Flow

```
User navigates to Connection Screen
        ↓
User taps "Connect via Bluetooth"
        ↓
  deviceStore.connectGoPro()
        ↓
  goProService.connect()
        ↓
  ┌────────────────────────────────┐
  │ 1. Enable Bluetooth            │
  │ 2. Start BLE scan              │
  │ 3. Find GoPro device           │
  │ 4. Connect to device           │
  │ 5. Discover characteristics   │
  │ 6. Subscribe to notifications  │
  └────────────────────────────────┘
        ↓
  goProService.getStatus()
        ↓
  deviceStore updates connection state
        ↓
  UI shows connected status
```

## Error Handling Strategy

### Graceful Degradation
- If one device fails, attempt to stop others gracefully
- Log all errors for debugging
- Update UI with error state

### Error Recovery
```typescript
try {
  await startSession()
} catch (error) {
  // 1. Stop all devices
  await emergencyStop()

  // 2. Update state to error
  updateState({ status: 'error', error: error.message })

  // 3. Notify user
  Alert.alert('Session Error', error.message)
}
```

### Emergency Stop
- Available at any time via UI button
- Forces all devices to stop immediately
- Uses `Promise.allSettled()` to attempt all stops regardless of individual failures

## Testing Strategy

### Unit Testing
- Mock all device services
- Test SessionOrchestrator logic
- Test state management stores

### Integration Testing
- Test with mock devices
- Verify coordination timing
- Test error handling paths

### Hardware Testing
- Phase 2: Test with actual GoPro
- Phase 2: Test with actual ESP32 booth
- Phase 2: End-to-end session testing

## Scalability Considerations

### Future Enhancements
1. **Multiple Camera Support**: Extend to control multiple GoPros
2. **Cloud Processing**: Upload videos for server-side processing
3. **Analytics**: Track session metrics and booth usage
4. **Remote Management**: Control multiple booths from one app
5. **Custom Branding**: Per-event intro/outro customization

### Architectural Flexibility
- Service interfaces allow easy swapping of implementations
- State management separated from UI logic
- Modular service design enables independent testing

## Security Considerations

### Current
- BLE pairing with GoPro (uses standard pairing)
- Local network communication with booth

### Future (Phase 3)
- JWT authentication for cloud features
- Encrypted video uploads
- Secure ESP32 communication (HTTPS/TLS)

## Performance Optimization

### Current
- Minimal re-renders via Zustand
- Efficient BLE characteristic subscriptions
- Audio preloading to avoid delays

### Future
- Video thumbnail generation
- Background video processing
- Offline mode support

---

**Last Updated:** 2025-10-12
**Version:** 1.0.0 (Phase 1 Complete)
