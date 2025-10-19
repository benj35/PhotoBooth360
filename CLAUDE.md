# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native mobile application for controlling a 360° photo booth system. The app coordinates three hardware components:
- **GoPro Hero 13 Black** (via Bluetooth BLE)
- **ESP32-controlled rotating booth** (via REST API)
- **Audio playback** for background music

## Common Development Commands

### Running the App
- `npm start` - Start Metro bundler
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator (macOS only)

### Testing & Code Quality
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint

### iOS-Specific Setup (macOS only)
Before first iOS run:
```bash
cd ios
pod install
cd ..
```

## Technology Stack

- **React Native 0.82** (New Architecture only, October 2025 release)
- **React 19.2** with TypeScript 5.7
- **Zustand 5** for state management
- **React Navigation 7** for routing
- **react-native-ble-plx** for Bluetooth Low Energy (GoPro)
- **axios** for HTTP requests (Booth ESP32 API)

## Architecture Overview

### Service Layer Pattern

The app uses a **Service + Orchestrator** architecture with three independent hardware services coordinated by a central orchestrator:

1. **GoProService** ([src/services/GoProService.ts](src/services/GoProService.ts))
   - Implements `IGoProService` interface
   - Handles Bluetooth BLE communication using GoPro's OpenGoPro protocol
   - Service UUID: `0000fea6-0000-1000-8000-00805f9b34fb`
   - Controls: recording start/stop, video mode, resolution
   - Status monitoring: battery, storage, recording state

2. **BoothService** ([src/services/BoothService.ts](src/services/BoothService.ts))
   - Implements `IBoothService` interface
   - REST API client for ESP32-controlled booth rotation
   - **Currently operates in mock mode** - actual ESP32 endpoints not yet implemented
   - Planned endpoints: `/rotate/start`, `/rotate/stop`, `/status`

3. **AudioService** ([src/services/AudioService.ts](src/services/AudioService.ts))
   - Implements `IAudioService` interface
   - Wraps `react-native-sound` for music playback

4. **SessionOrchestrator** ([src/services/SessionOrchestrator.ts](src/services/SessionOrchestrator.ts))
   - **Core coordination engine** - coordinates all three services for automated sessions
   - Implements event-driven state management with callbacks
   - Handles sequenced device startup/shutdown with delays between operations
   - Provides `emergencyStop()` for immediate halt of all devices
   - Session lifecycle: `idle` → `preparing` → `recording` → `stopping` → `idle/error`

### State Management (Zustand)

All services are exposed through Zustand stores for React components:

- **sessionStore** ([src/stores/sessionStore.ts](src/stores/sessionStore.ts))
  - Manages session configuration and state
  - Bridges UI to SessionOrchestrator
  - Subscribes to orchestrator state changes via callbacks

- **deviceStore** ([src/stores/deviceStore.ts](src/stores/deviceStore.ts))
  - Tracks GoPro and Booth connection states
  - Bridges UI to individual services

- **musicStore** ([src/stores/musicStore.ts](src/stores/musicStore.ts))
  - Manages music library and track selection

### Type System

All interfaces defined in [src/types/index.ts](src/types/index.ts):
- Service interfaces (`IGoProService`, `IBoothService`, etc.) enable mocking and testing
- Shared types (`SessionConfig`, `SessionState`, `DeviceConnectionState`)
- Hardware-specific types (`GoProStatus`, `BoothStatus`)

### UI Structure

Five main screens using React Navigation native stack:

1. **ConnectionScreen** - Initial device pairing (BLE + network)
2. **HomeScreen** - Main control interface with "START SESSION" button
3. **MusicSelectionScreen** - Browse and select background music
4. **SessionConfigScreen** - Configure duration, speed, video settings
5. **ManualControlScreen** - Individual device testing controls

### Path Aliases

The project uses module path aliases configured in both [babel.config.js](babel.config.js) and [tsconfig.json](tsconfig.json):

```typescript
import goProService from '@services/GoProService';
import { useSessionStore } from '@stores/sessionStore';
import HomeScreen from '@screens/HomeScreen';
import { SessionConfig } from '@types/index';
```

Available aliases: `@services/*`, `@stores/*`, `@screens/*`, `@components/*`, `@types/*`, `@utils/*`

## Development Workflow

### Adding New Features

1. **Define types** in `src/types/index.ts`
2. **Implement service logic** in `src/services/` (follow service interface pattern)
3. **Create/update Zustand store** in `src/stores/` if state management needed
4. **Build UI components** in `src/screens/` or `src/components/`
5. **Use path aliases** for cleaner imports

### Working with Hardware Services

**GoPro Service:**
- Requires **physical device** (BLE doesn't work in simulators)
- Uses OpenGoPro BLE specification
- Commands are Uint8Arrays encoded to base64 for BLE transmission
- Check `isDeviceConnected()` before operations

**Booth Service:**
- Currently in **mock mode** - all operations log but don't fail
- Real ESP32 REST API endpoints need implementation:
  - `POST /rotate/start` with `{ speed: 0-100 }`
  - `POST /rotate/stop`
  - `GET /status`
- Update commented-out axios calls when ESP32 is ready

### Session Orchestration Flow

When user taps "START SESSION":
1. Validate device connections
2. Load music track (if selected)
3. Configure GoPro settings (video mode, resolution)
4. **Sequenced startup** with delays:
   - Start booth rotation
   - Start GoPro recording
   - Play music
5. Schedule auto-stop after configured duration
6. Update UI via state callbacks

Emergency stop forces all devices to halt via `Promise.allSettled()`.

## Important Notes

### Hardware Dependencies
- **BLE testing requires physical iOS/Android device** (not simulators)
- Bluetooth permissions must be granted in Info.plist (iOS) and AndroidManifest.xml (Android)
- Location permission required on Android for BLE scanning

### Video Processing (Phase 3)
- Original plan used `react-native-ffmpeg` (deprecated)
- Currently uses `ffmpeg-kit-react-native` (also deprecated as of Jan 2025)
- Future implementation will need alternative video processing solution

### Development Phase Status
- **Phase 1** 🚀 IN PROGRESS: Hardware integration, file management, manual editing workflow
  - Sunday 1: Hardware Integration & Testing (ESP32 + GoPro physical testing)
  - Sunday 2: Automated Session Flow (full orchestration)
  - Sunday 3: File Management & Download (GoPro WiFi downloads)
  - Sunday 4: Manual Editing Workflow Documentation
  - Sunday 5: End-to-End Testing & First Event Prep
  - **See:** [docs/PHASE1_PLAN.md](docs/PHASE1_PLAN.md) for detailed weekly plan
- **Phase 2** 📋 FUTURE: Automated editing & delivery (FFmpeg scripts, Telegram bot)
  - **See:** [docs/FUTURE_AUTOMATION.md](docs/FUTURE_AUTOMATION.md) for automation roadmap
- **Phase 3** 📋 FUTURE: Scaling features (cloud processing, WhatsApp, analytics)

### Current Development Context (2025-10-19)

**Business Model:**
- 360° photo booth rental service for events (weddings, corporate, birthdays)
- Customer workflow: Record → Edit → Deliver video via Telegram within 5-30 minutes
- Pricing: Individual videos $5-15, Event packages $200-500 for 3-4 hours

**Hardware Setup:**
- Portable WiFi router with static IP assignments
- ESP32 Booth Controller: 192.168.1.100 (REST API)
- GoPro Hero 13 Black: 192.168.1.101 (BLE + WiFi hybrid)
- Bluetooth speaker for live music playback

**Development Schedule:**
- Working on Sundays only (4-6 hour sessions)
- Aiming for first paid event after Phase 1 completion (5 weeks)

**Key Technical Decisions:**
- GoPro: BLE for control commands, WiFi for file downloads (hybrid approach)
- Network: Static IP reservations for predictable device addressing
- Music: Live playback during recording + add again in post-production
- Editing: Manual workflow with templates (Windows laptop + FFmpeg/After Effects)
- Delivery: Manual Telegram delivery (automation in Phase 2)
- Storage: Local only (phone + laptop + external drive backup)

**Reference Documentation:**
- Master plan: [docs/PHASE1_PLAN.md](docs/PHASE1_PLAN.md)
- Network setup: [docs/NETWORK_SETUP.md](docs/NETWORK_SETUP.md)
- Future automation: [docs/FUTURE_AUTOMATION.md](docs/FUTURE_AUTOMATION.md)
- Event operations: [docs/EVENT_SETUP_GUIDE.md](docs/EVENT_SETUP_GUIDE.md)

### Service Singleton Pattern
All services export singleton instances:
```typescript
export default new GoProService();
```

Import and use the singleton directly - don't instantiate new instances.

### TypeScript Configuration
- Extends `@react-native/typescript-config` base configuration
- Uses `moduleResolution: "bundler"` for React Native 0.82 New Architecture
- Path aliases defined in `compilerOptions.paths`

## Testing Checklist

Before hardware integration:
- App builds without errors
- Navigation works between all screens
- Mock services respond correctly
- UI updates reflect state changes

With hardware:
- GoPro BLE discovery and pairing
- GoPro recording commands work
- ESP32 network connection established
- Full session completes successfully
- Emergency stop halts all devices
