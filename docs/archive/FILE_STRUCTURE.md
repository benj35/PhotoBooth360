# Project File Structure

Complete file tree for the 360° Photo Booth mobile application.

```
PhotoBooth360/
│
├── 📄 README.md                      # Main project overview
├── 📄 QUICK_START.md                 # Fast setup guide
├── 📄 ARCHITECTURE.md                # Technical architecture documentation
├── 📄 ROADMAP.md                     # Development phases and timeline
├── 📄 EXTENDING.md                   # Guide for extending the system
├── 📄 PROJECT_SUMMARY.md             # Complete project summary
├── 📄 FILE_STRUCTURE.md              # This file
│
└── mobile-app/                       # React Native mobile application
    │
    ├── 📄 package.json               # Dependencies and scripts
    ├── 📄 tsconfig.json              # TypeScript configuration
    ├── 📄 babel.config.js            # Babel configuration
    ├── 📄 metro.config.js            # Metro bundler config
    ├── 📄 .eslintrc.js               # ESLint rules
    ├── 📄 .prettierrc.js             # Prettier formatting
    ├── 📄 .gitignore                 # Git ignore rules
    ├── 📄 app.json                   # App metadata
    ├── 📄 index.js                   # App entry point
    ├── 📄 App.tsx                    # Root component with navigation
    ├── 📄 README.md                  # Mobile app specific docs
    │
    ├── src/
    │   │
    │   ├── types/                    # TypeScript type definitions
    │   │   └── 📄 index.ts           # All interfaces and types
    │   │
    │   ├── services/                 # Device control services
    │   │   ├── 📄 SessionOrchestrator.ts    # Main coordination service
    │   │   ├── 📄 GoProService.ts           # GoPro BLE integration
    │   │   ├── 📄 BoothService.ts           # ESP32 REST API client
    │   │   └── 📄 AudioService.ts           # Music playback service
    │   │
    │   ├── stores/                   # Zustand state management
    │   │   ├── 📄 sessionStore.ts    # Session state and config
    │   │   ├── 📄 deviceStore.ts     # Device connections
    │   │   └── 📄 musicStore.ts      # Music library
    │   │
    │   └── screens/                  # UI screens
    │       ├── 📄 ConnectionScreen.tsx       # Device setup
    │       ├── 📄 HomeScreen.tsx             # Main control interface
    │       ├── 📄 MusicSelectionScreen.tsx   # Music browser
    │       ├── 📄 SessionConfigScreen.tsx    # Settings
    │       └── 📄 ManualControlScreen.tsx    # Manual device control
    │
    ├── ios/                          # iOS native project
    │   ├── Podfile                   # CocoaPods dependencies
    │   └── [iOS project files]
    │
    └── android/                      # Android native project
        ├── build.gradle              # Gradle build config
        └── [Android project files]
```

---

## File Descriptions

### Root Level Documentation

#### 📄 README.md
- Main project overview
- Feature highlights
- Quick start instructions
- Technology stack
- Use cases and applications

#### 📄 QUICK_START.md
- Fast setup guide
- What's been built
- Getting started steps
- Current status
- Next actions
- Testing checklist

#### 📄 ARCHITECTURE.md
- System architecture overview
- Layer breakdown
- Service descriptions
- Data flow diagrams
- Error handling strategy
- Technical decisions

#### 📄 ROADMAP.md
- Development phases
- Phase 1: Foundation ✅ Complete
- Phase 2: Hardware Integration
- Phase 3: Video Processing
- Phase 4: Cloud Features
- Phase 5: Commercial Launch

#### 📄 EXTENDING.md
- How to add new devices
- Creating custom UI screens
- Extending video processing
- Adding new session types
- Integration examples
- Best practices

#### 📄 PROJECT_SUMMARY.md
- Complete implementation summary
- What's included
- Next steps
- Key features
- Technical highlights

---

### Mobile App Structure

#### Configuration Files

**package.json**
- Dependencies list
- NPM scripts
- Project metadata
- Engine requirements

**tsconfig.json**
- TypeScript compiler options
- Path aliases (@services, @stores, etc.)
- Include/exclude patterns

**babel.config.js**
- React Native preset
- Module resolver for aliases
- Transformation rules

**metro.config.js**
- Metro bundler configuration
- Asset handling
- Source map settings

**.eslintrc.js**
- Linting rules
- React Native specific rules
- Code quality enforcement

**.prettierrc.js**
- Code formatting rules
- Consistent code style
- Auto-formatting configuration

---

### Source Code Organization

#### 📁 src/types/
Contains all TypeScript interfaces and type definitions.

**index.ts** includes:
- `SessionConfig`: Session parameters
- `SessionState`: Current session status
- `MusicTrack`: Music track information
- `DeviceConnectionState`: Device status
- `GoProStatus`: GoPro specific status
- `BoothStatus`: Booth specific status
- Service interfaces (IGoProService, etc.)

#### 📁 src/services/
Device control and coordination services.

**SessionOrchestrator.ts**
- Coordinates all devices
- Manages session lifecycle
- Error handling and recovery
- State change notifications
- Emergency stop functionality

**GoProService.ts**
- Bluetooth Low Energy communication
- GoPro Hero 13 Black integration
- Start/stop recording
- Status monitoring
- Settings configuration
- Based on OpenGoPro BLE API

**BoothService.ts**
- Network communication with ESP32
- Rotation control
- Speed adjustment
- Status polling
- Mock mode for development

**AudioService.ts**
- Music playback management
- Track loading and preloading
- Playback control (play/pause/stop)
- Duration and position tracking
- Volume control

#### 📁 src/stores/
Zustand state management stores.

**sessionStore.ts**
- Session configuration state
- Real-time session status
- Actions: startSession, stopSession
- Config updates
- Emergency stop

**deviceStore.ts**
- Device connection states
- GoPro and booth status
- Connection actions
- Status refresh
- Real-time updates

**musicStore.ts**
- Available music tracks
- Selected track
- Library management
- Track preloading
- Selection state

#### 📁 src/screens/
React Native UI screens.

**ConnectionScreen.tsx**
- Device setup interface
- GoPro BLE pairing
- Booth network connection
- Connection status indicators
- Navigation to main app

**HomeScreen.tsx**
- Main control interface
- One-button session start
- Real-time progress tracking
- Session status display
- Quick action buttons
- Device status footer

**MusicSelectionScreen.tsx**
- Music library browser
- Track list with metadata
- Selection interface
- Currently selected indicator
- Option for no music

**SessionConfigScreen.tsx**
- Duration configuration
- Rotation speed settings
- Video mode selection
- Resolution options
- Reset to defaults

**ManualControlScreen.tsx**
- Individual device testing
- GoPro manual controls
- Booth manual controls
- Audio playback testing
- Real-time status monitoring

---

### App Entry Point

#### App.tsx
- Root component
- React Navigation setup
- Stack navigator
- Screen definitions
- Navigation types
- SafeArea provider

#### index.js
- App registration
- React Native entry point
- Loads App.tsx

---

## File Count Summary

```
Total Files Created: 25+

Documentation:       7 files
TypeScript Types:    1 file
Services:            4 files
Stores:              3 files
Screens:             5 files
Configuration:       7 files
Root Files:          3 files
```

---

## Lines of Code

```
Type Definitions:    ~300 lines
Services:           ~1,500 lines
Stores:              ~400 lines
Screens:           ~1,800 lines
Configuration:       ~150 lines
Documentation:     ~2,500 lines
─────────────────────────────
Total:             ~6,650 lines
```

---

## Key Patterns

### Import Aliases
```typescript
import { GoProService } from '@services/GoProService';
import { useSessionStore } from '@stores/sessionStore';
import { SessionConfig } from '@types/index';
```

### Service Pattern
```typescript
export class ServiceName implements IServiceInterface {
  async connect(): Promise<void> { }
  async disconnect(): Promise<void> { }
  // ... methods
}
export default new ServiceName();
```

### Store Pattern
```typescript
export const useStoreName = create<StoreInterface>((set, get) => ({
  state: initialState,
  actions: () => { set({ ... }) },
}));
```

### Screen Pattern
```typescript
export default function ScreenName({ navigation }: Props) {
  const store = useStore();
  return <View>...</View>;
}
```

---

## Navigation Structure

```
Connection Screen (initial)
    │
    └── Home Screen
         ├── Music Selection Screen
         ├── Session Config Screen
         └── Manual Control Screen
```

---

## Dependencies Overview

### Core
- react, react-native
- typescript

### Navigation
- @react-navigation/native
- @react-navigation/native-stack
- react-native-screens
- react-native-safe-area-context

### State Management
- zustand

### Device Communication
- react-native-ble-plx (Bluetooth)
- axios (HTTP)
- react-native-sound (Audio)

### Future (Phase 3)
- react-native-ffmpeg (Video processing)
- react-native-fs (File system)

---

## Build Outputs

### iOS
```
ios/
├── build/                    # Build artifacts
├── Pods/                     # CocoaPods dependencies
└── PhotoBooth360.xcworkspace # Xcode workspace
```

### Android
```
android/
├── app/build/                # Build artifacts
└── app/build/outputs/apk/    # APK files
```

---

## Development Workflow

```
1. Edit source files in src/
2. Metro bundler auto-reloads
3. Test in simulator/device
4. Commit changes
5. Document updates
```

---

**This structure provides a complete, organized, and scalable foundation for the 360° Photo Booth system.**

---

Last Updated: 2025-10-12
