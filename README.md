# 360° Photo Booth

A complete React Native mobile application for controlling professional 360° photo booth systems.

## Features

- **Automated Sessions**: One-button start for coordinated recording with GoPro, booth rotation, and music
- **GoPro Integration**: Full BLE control of GoPro Hero 13 Black camera
- **ESP32 Booth Control**: Network-based control of booth rotation (mock implementation for now)
- **Music Integration**: Background music selection and playback during sessions
- **Manual Controls**: Individual device control for testing and debugging
- **Real-time Status**: Live monitoring of all connected devices

## Architecture

### Service Layer
- **GoProService**: BLE communication with GoPro Hero 13
- **BoothService**: REST API communication with ESP32 (mock for Phase 1)
- **AudioService**: Music playback management
- **SessionOrchestrator**: Coordinates all devices for automated sessions

### State Management (Zustand)
- **sessionStore**: Session configuration and state
- **deviceStore**: Device connection states and status
- **musicStore**: Music library and selection

### Screens
- **ConnectionScreen**: Device setup and pairing
- **HomeScreen**: Main control interface with one-button session start
- **MusicSelectionScreen**: Browse and select background music
- **SessionConfigScreen**: Configure session parameters (duration, speed, video mode, resolution)
- **ManualControlScreen**: Individual device controls for testing

## Prerequisites

- **Node.js 18+** (required)
- **React Native development environment setup**
  - For iOS: macOS with Xcode 15+, CocoaPods
  - For Android: Android Studio with SDK 34+
- **Physical devices for testing** (BLE requires physical hardware, not supported in simulators)

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Android Setup**
   - Ensure Android SDK is installed
   - Update `local.properties` with SDK path if needed

## Running the App

### iOS
```bash
npm run ios
```

Or open `ios/PhotoBooth360.xcworkspace` in Xcode and run

### Android
```bash
npm run android
```

## Configuration

### Bluetooth Permissions

**iOS** - Add to `Info.plist`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>We need Bluetooth to connect to your GoPro camera</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>We need Bluetooth to connect to your GoPro camera</string>
```

**Android** - Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

### Network Permissions (for Booth connection)

**Android** - Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

## Usage

### First Time Setup

1. **Launch the app** - You'll start on the Connection screen
2. **Connect GoPro**:
   - Enable Bluetooth on your device
   - Put GoPro in pairing mode (Settings > Connections > Connect Device > GoPro App)
   - Tap "Connect via Bluetooth" in the app
   - Wait for pairing to complete
3. **Connect Booth**:
   - Enter the booth's IP address (default: http://192.168.1.100)
   - Tap "Connect via Network"
   - For Phase 1, this will connect in mock mode
4. **Continue to App** once both devices are connected

### Running a Session

1. **Main Screen**: Configure your session
   - Tap "🎵 Music" to select background music (optional)
   - Tap "Edit Settings" to adjust duration, rotation speed, and video quality
2. **Start Session**: Tap the big "START SESSION" button
   - Booth rotation starts
   - GoPro begins recording
   - Music plays (if selected)
   - Session auto-stops after configured duration
3. **Monitor Progress**: Watch the timer and progress bar
4. **Emergency Stop**: Tap "🛑 Emergency" if needed

### Manual Controls

For testing individual devices:
1. Navigate to Manual Control screen
2. Toggle individual devices on/off
3. Adjust booth rotation speed
4. Test music playback

## Development Phases

### 🚀 Phase 1: MVP - Booth Operation (In Progress)
**Goal:** Run first paid event with manual editing workflow (5 Sundays)

- Week 1: Hardware integration (ESP32 + GoPro physical testing)
- Week 2: Automated session flow
- Week 3: File management & downloads
- Week 4: Manual editing workflow documentation
- Week 5: End-to-end testing & event prep

**See:** [docs/PHASE1_PLAN.md](docs/PHASE1_PLAN.md) for detailed plan

### 📋 Phase 2: Automation (Future)
**Goal:** Automate editing and delivery pipeline

- FFmpeg script automation
- Telegram bot auto-delivery
- Event template management
- Batch processing

**See:** [docs/FUTURE_AUTOMATION.md](docs/FUTURE_AUTOMATION.md)

### 📋 Phase 3: Scaling (Future)
**Goal:** Cloud processing and multi-event management

- Cloud video processing (Shotstack API)
- WhatsApp Business integration
- Multi-event dashboard
- Premium editing features

**See:** [docs/FUTURE_AUTOMATION.md](docs/FUTURE_AUTOMATION.md)

## GoPro BLE Commands

The app uses GoPro's OpenGoPro BLE API:
- Service UUID: `0000fea6-0000-1000-8000-00805f9b34fb`
- Command characteristic for recording start/stop
- Status characteristic for battery, storage, etc.

Reference: [GoPro OpenGoPro BLE Documentation](https://gopro.github.io/OpenGoPro/ble/)

## ESP32 REST API (To Be Implemented)

Expected endpoints for booth control:
```
POST /rotate/start
{
  "speed": 50  // 0-100
}

POST /rotate/stop

GET /status
{
  "rotating": false,
  "speed": 0,
  "temperature": 45,
  "errorCode": null
}
```

## Troubleshooting

### GoPro Won't Connect
- Ensure GoPro is in pairing mode
- Check Bluetooth permissions are granted
- Try restarting the GoPro
- Ensure GoPro firmware is up to date

### App Crashes on Launch
- Clear Metro bundler cache: `npm start -- --reset-cache`
- Rebuild the app: `npm run android` or `npm run ios`

### BLE Not Working
- BLE requires physical device (won't work in simulator)
- Ensure location permissions are granted (Android requirement)

## Project Structure

```
PhotoBooth360/
├── src/
│   ├── services/          # Device control services
│   │   ├── GoProService.ts
│   │   ├── BoothService.ts
│   │   ├── AudioService.ts
│   │   └── SessionOrchestrator.ts
│   ├── stores/            # Zustand state management
│   │   ├── sessionStore.ts
│   │   ├── deviceStore.ts
│   │   └── musicStore.ts
│   ├── screens/           # UI screens
│   │   ├── ConnectionScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── MusicSelectionScreen.tsx
│   │   ├── SessionConfigScreen.tsx
│   │   └── ManualControlScreen.tsx
│   └── types/             # TypeScript definitions
│       └── index.ts
├── App.tsx                # Root component
├── package.json
└── [documentation files]
```

## Tech Stack

- **React Native 0.82** (October 2025): Latest release with New Architecture only
- **React 19.2**: Latest React version
- **TypeScript 5.7**: Type-safe development
- **Zustand 5**: Lightweight state management
- **React Navigation 7**: Navigation and routing
- **react-native-ble-plx 3.5**: Bluetooth Low Energy communication
- **react-native-sound**: Audio playback
- **axios 1.12**: HTTP client for booth communication

## Contributing

This project is in active development. Key areas for contribution:
- Testing GoPro BLE integration with real hardware
- ESP32 firmware and REST API implementation
- Video processing pipeline
- UI/UX improvements

## License

MIT

## Contact

For questions or support, please open an issue in the repository.
