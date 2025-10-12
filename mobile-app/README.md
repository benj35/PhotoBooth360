# 360° Photo Booth Mobile App

A React Native mobile application for controlling a 360° photo booth system with automated recording sessions.

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

- Node.js 18+
- React Native development environment setup
  - For iOS: Xcode, CocoaPods
  - For Android: Android Studio, SDK
- Physical devices for testing (BLE requires physical hardware)

## Installation

1. **Clone the repository**
   ```bash
   cd PhotoBooth360/mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Android Setup**
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

### ✅ Phase 1 (Complete)
- React Native project setup
- Full service layer implementation
- Zustand state management
- All UI screens and navigation
- GoPro BLE integration (ready for testing)
- Mock Booth service (REST API calls prepared)
- Audio service wrapper

### 📋 Phase 2 (Next)
- Test GoPro BLE integration with physical device
- Implement actual ESP32 REST API
- Update BoothService to use real endpoints
- Add video file transfer from GoPro
- Test end-to-end session flow

### 📋 Phase 3 (Future)
- Video processing pipeline
- FFmpeg integration for video + audio merging
- Intro/outro video addition
- Cloud processing option
- Video gallery and sharing

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
mobile-app/
├── src/
│   ├── services/          # Device communication services
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
├── App.tsx                # Root component with navigation
├── index.js               # App entry point
└── package.json
```

## Tech Stack

- **React Native 0.76**: Cross-platform mobile framework
- **TypeScript**: Type-safe development
- **Zustand**: Lightweight state management
- **React Navigation**: Navigation and routing
- **react-native-ble-plx**: Bluetooth Low Energy communication
- **react-native-sound**: Audio playback
- **axios**: HTTP client for booth communication

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
