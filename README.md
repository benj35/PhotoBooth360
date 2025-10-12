# 360° Photo Booth System

A complete mobile application system for controlling a professional 360° photo booth with automated recording sessions.

## 🎥 What It Does

This React Native mobile app provides **one-button control** of an entire 360° photo booth setup:
- **GoPro Hero 13 Black** camera recording (via Bluetooth)
- **360° rotating booth** controlled by ESP32 (via WiFi)
- **Background music** playback synchronized with recording
- **Automated session management** - start everything at once, stop automatically

Perfect for events, parties, weddings, and commercial photo booth operations.

## ✨ Key Features

### Automated Sessions
- **One-Tap Recording**: Start GoPro, booth rotation, and music simultaneously
- **Auto-Stop**: Sessions end automatically after configured duration
- **Real-Time Monitoring**: Live progress tracking with timer and visual feedback

### Device Management
- **GoPro Integration**: Full BLE control of GoPro Hero 13 Black
- **Booth Control**: Network-based control of booth rotation speed
- **Music Playback**: Background music selection and playback
- **Status Monitoring**: Real-time battery, storage, and connection status

### Flexible Configuration
- Session duration (10-60 seconds)
- Rotation speed (25-100%)
- Video mode (standard, slow-motion, time-lapse)
- Resolution (1080p, 4K, 5.3K)
- Background music selection

### Safety Features
- **Emergency Stop**: Immediately halt all devices
- **Error Recovery**: Graceful error handling with automatic cleanup
- **Device Validation**: Ensures all devices connected before session start

## 📱 Screenshots & UI

### Main Screens
1. **Connection Screen**: Device setup and pairing
2. **Home Screen**: One-button session control with live status
3. **Music Selection**: Browse and select background tracks
4. **Session Config**: Adjust all session parameters
5. **Manual Control**: Test individual devices

## 🏗️ Architecture

```
Mobile App (React Native + TypeScript)
    ├── Services Layer
    │   ├── SessionOrchestrator (coordinates all devices)
    │   ├── GoProService (BLE communication)
    │   ├── BoothService (REST API)
    │   └── AudioService (music playback)
    ├── State Management (Zustand)
    │   ├── sessionStore
    │   ├── deviceStore
    │   └── musicStore
    └── UI Layer (React Native screens)
        └── 5 screens with navigation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- React Native development environment
- iOS: Xcode + CocoaPods (macOS only)
- Android: Android Studio + SDK

### Installation

```bash
# Navigate to project
cd PhotoBooth360/mobile-app

# Install dependencies
npm install

# iOS: Install pods
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### First Launch

1. **Connect GoPro**: Enable Bluetooth, put GoPro in pairing mode, connect via app
2. **Connect Booth**: Enter ESP32 IP address (currently uses mock mode)
3. **Start Recording**: Navigate to home screen and tap "START SESSION"

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)**: Get up and running fast
- **[Architecture Documentation](ARCHITECTURE.md)**: Deep dive into system design
- **[Mobile App README](mobile-app/README.md)**: Detailed setup and configuration

## 🛠️ Technology Stack

### Mobile App
- **React Native 0.76** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **Zustand** - Lightweight state management
- **React Navigation** - Navigation and routing

### Device Communication
- **react-native-ble-plx** - Bluetooth Low Energy (GoPro)
- **axios** - HTTP client (ESP32 booth)
- **react-native-sound** - Audio playback

### Future (Phase 3)
- **FFmpeg** - Video processing
- **Cloud Storage** - Video hosting
- **.NET Backend** - Processing pipeline

## 📋 Project Status

### ✅ Phase 1 - Complete (Current)
- [x] Full React Native project structure
- [x] All service implementations
- [x] Complete UI with 5 screens
- [x] State management with Zustand
- [x] GoPro BLE integration (ready for testing)
- [x] Mock booth service
- [x] Audio service
- [x] Session orchestration logic

### 📋 Phase 2 - Hardware Integration (Next)
- [ ] Test GoPro BLE with physical device
- [ ] Implement ESP32 REST API
- [ ] Update booth service with real endpoints
- [ ] End-to-end session testing
- [ ] Video file transfer from GoPro

### 📋 Phase 3 - Video Processing (Future)
- [ ] FFmpeg integration
- [ ] Video + audio merging
- [ ] Intro/outro clips
- [ ] Cloud processing option
- [ ] Video gallery and sharing

## 🎯 Use Cases

### Event Photography
- Weddings and parties
- Corporate events
- Festivals and concerts
- Product launches

### Commercial Operations
- Photo booth rental businesses
- Mall and venue installations
- Marketing activations
- Social media content creation

## 🔧 Hardware Requirements

### Required
- **Mobile Device**: iOS or Android phone/tablet
- **GoPro Hero 13 Black**: For video recording
- **ESP32 Microcontroller**: For booth rotation control
- **Rotating Booth**: 360° platform with motor

### Optional
- **Speakers**: For music playback
- **Lighting**: For better video quality
- **Backdrop**: For professional setup

## 🤝 Contributing

This is an active development project. Key areas for contribution:
- GoPro BLE testing and refinement
- ESP32 firmware development
- Video processing pipeline
- UI/UX improvements
- Testing and bug reports

## 📝 ESP32 API Specification

The booth controller should implement these REST endpoints:

```
POST /rotate/start
Content-Type: application/json
{ "speed": 50 }  // 0-100

POST /rotate/stop

GET /status
Response: {
  "rotating": boolean,
  "speed": number,
  "temperature": number,
  "errorCode": number | null
}
```

## 🔐 Permissions Required

### iOS
- Bluetooth Always Usage
- Microphone (for audio playback)

### Android
- Bluetooth
- Bluetooth Admin
- Bluetooth Scan/Connect
- Fine Location (required for BLE)
- Internet
- Network State

## 🐛 Troubleshooting

### GoPro Won't Connect
- Ensure GoPro is in pairing mode
- Check Bluetooth permissions
- Try restarting the GoPro
- Update GoPro firmware

### App Crashes
```bash
# Clear Metro cache
npm start -- --reset-cache

# Rebuild
npm run android
```

### BLE Not Working
- BLE requires physical device (not simulator)
- Ensure location permissions granted (Android)

## 📄 License

MIT License - See LICENSE file for details

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check documentation in `/docs`
- Review example sessions

## 🙏 Acknowledgments

- **GoPro OpenGoPro**: For comprehensive BLE API documentation
- **React Native Community**: For excellent mobile development tools
- **Zustand**: For simple and effective state management

---

**Built with ❤️ for the photo booth industry**

**Version:** 1.0.0 (Phase 1 Complete)
**Last Updated:** 2025-10-12
