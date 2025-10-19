# System Overview - Visual Guide

Quick visual reference for understanding the 360° Photo Booth system.

---

## 🎯 One-Page System Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    360° PHOTO BOOTH SYSTEM                      │
│                                                                 │
│  📱 Mobile App Controls:                                        │
│     • GoPro Hero 13 Black (Bluetooth)                          │
│     • ESP32 Rotating Booth (WiFi)                              │
│     • Background Music (Local)                                 │
│                                                                 │
│  🎯 One-Button Operation:                                       │
│     Tap → Everything Starts → Auto Stops → Done               │
│                                                                 │
│  ✅ Status: Phase 1 Complete - Ready for Hardware Testing      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Connection │  │    Home    │  │   Music    │            │
│  │   Screen   │→ │   Screen   │  │  Selection │            │
│  └────────────┘  └──────┬─────┘  └────────────┘            │
│                         │                                    │
│                    ┌────▼────┐  ┌────────────┐             │
│                    │ Session │  │   Manual   │             │
│                    │  Config │  │  Control   │             │
│                    └─────────┘  └────────────┘             │
└───────────────────────────┬──────────────────────────────────┘
                           │ UI Events
┌───────────────────────────▼──────────────────────────────────┐
│                   STATE MANAGEMENT (Zustand)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Session    │  │    Device    │  │    Music     │      │
│  │    Store     │  │    Store     │  │    Store     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                            │ Actions
┌────────────────────────────▼─────────────────────────────────┐
│                    SERVICE LAYER                             │
│                ┌──────────────────────┐                      │
│                │  Session Orchestrator │                     │
│                │  (Coordinates All)    │                     │
│                └──────────┬────────────┘                     │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│    ┌────▼─────┐     ┌─────▼────┐     ┌─────▼────┐         │
│    │  GoPro   │     │   Booth  │     │  Audio   │         │
│    │ Service  │     │ Service  │     │ Service  │         │
│    └────┬─────┘     └─────┬────┘     └─────┬────┘         │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                  │
          │ BLE             │ REST API         │ Native
          │                 │                  │
┌─────────▼──────┐  ┌───────▼────────┐  ┌─────▼──────┐
│  GoPro Hero    │  │  ESP32 Booth   │  │   Device   │
│  13 Black      │  │  Controller    │  │   Audio    │
└────────────────┘  └────────────────┘  └────────────┘
     (Camera)         (Rotation)          (Speakers)
```

---

## 🔄 Session Flow Diagram

```
User Taps "START SESSION"
         │
         ▼
┌────────────────────┐
│  Validate Devices  │  ← Check GoPro & Booth connected
└────────┬───────────┘
         │ ✓ All connected
         ▼
┌────────────────────┐
│  Load Music Track  │  ← If music selected
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Configure GoPro   │  ← Set video mode & resolution
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Start Booth Rotate │  ← Begin rotation at configured speed
└────────┬───────────┘
         │ Wait 200ms
         ▼
┌────────────────────┐
│ Start GoPro Record │  ← Begin video recording
└────────┬───────────┘
         │ Wait 200ms
         ▼
┌────────────────────┐
│  Play Music Track  │  ← Start audio playback
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Session Running   │  ← Status: RECORDING
│  Timer Counting    │     Progress bar updating
└────────┬───────────┘
         │ Duration expires
         ▼
┌────────────────────┐
│   Stop All:        │
│   1. Audio         │  ← Stop in reverse order
│   2. GoPro         │
│   3. Booth         │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Session Complete  │  ← Status: IDLE
│  Ready for Next    │
└────────────────────┘
```

---

## 📱 Screen Flow Diagram

```
Launch App
    │
    ▼
┌─────────────────┐
│  CONNECTION     │  ← Connect GoPro & Booth
│   SCREEN        │
└────────┬────────┘
         │ Devices Connected
         ▼
┌─────────────────┐
│   HOME SCREEN   │◄──┐
│  (Main Control) │   │
└────┬────────┬───┘   │
     │        │       │
     │        └───────┼──────┐
     │                │      │
     ▼                ▼      ▼
┌──────────┐   ┌──────────┐ ┌──────────┐
│  MUSIC   │   │ SESSION  │ │  MANUAL  │
│SELECTION │   │  CONFIG  │ │ CONTROL  │
└────┬─────┘   └────┬─────┘ └────┬─────┘
     │              │            │
     └──────────────┴────────────┘
                    │
                    └─► Back to HOME
```

---

## 🎮 User Actions Map

```
┌──────────────────────────────────────────────────────────┐
│                    MAIN ACTIONS                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🔵 START SESSION                                        │
│     └─► Starts everything automatically                 │
│                                                          │
│  🔴 STOP SESSION                                         │
│     └─► Stops everything gracefully                     │
│                                                          │
│  🛑 EMERGENCY STOP                                       │
│     └─► Force stops all devices immediately             │
│                                                          │
│  🎵 SELECT MUSIC                                         │
│     └─► Browse and choose background track              │
│                                                          │
│  ⚙️  CONFIGURE SESSION                                   │
│     └─► Adjust duration, speed, quality                 │
│                                                          │
│  🎮 MANUAL CONTROL                                       │
│     └─► Test individual devices                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Device Integration Map

```
MOBILE APP (React Native)
        │
        ├─────► GoPro Hero 13
        │       │
        │       ├─ Technology: Bluetooth Low Energy (BLE)
        │       ├─ Status: ✅ Service Ready (needs testing)
        │       ├─ Features:
        │       │   • Start/stop recording
        │       │   • Battery monitoring
        │       │   • Storage checking
        │       │   • Video mode control
        │       │   • Resolution settings
        │       │
        │       └─ API: OpenGoPro BLE Specification
        │
        ├─────► ESP32 Booth Controller
        │       │
        │       ├─ Technology: REST API over WiFi
        │       ├─ Status: 🔷 Mock Mode (API needs implementation)
        │       ├─ Features:
        │       │   • Start/stop rotation
        │       │   • Speed control (0-100%)
        │       │   • Status monitoring
        │       │   • Temperature checking
        │       │
        │       └─ Endpoints: POST /rotate/start, /rotate/stop
        │                    GET /status
        │
        └─────► Device Audio
                │
                ├─ Technology: react-native-sound
                ├─ Status: ✅ Service Ready
                ├─ Features:
                │   • Load and play music
                │   • Volume control
                │   • Playback synchronization
                │   • Track duration
                │
                └─ Format: MP3, WAV (standard formats)
```

---

## 📊 Data Flow Diagram

```
Session Configuration
        │
        ▼
┌───────────────┐
│  musicTrackId │────┐
│  duration     │    │
│  rotSpeed     │    │
│  videoMode    │    │
│  resolution   │    │
└───────────────┘    │
                     │
                     ▼
            ┌────────────────┐
            │Session         │
            │Orchestrator    │
            └────┬───────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│ GoPro  │  │ Booth  │  │ Audio  │
│Commands│  │Commands│  │Commands│
└────┬───┘  └────┬───┘  └────┬───┘
     │           │           │
     ▼           ▼           ▼
┌────────┐  ┌────────┐  ┌────────┐
│ GoPro  │  │ Booth  │  │ Audio  │
│ Status │  │ Status │  │ Status │
└────┬───┘  └────┬───┘  └────┬───┘
     │           │           │
     └───────────┼───────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Device Store   │
        │ Updates        │
        └────┬───────────┘
             │
             ▼
        ┌────────────────┐
        │ UI Updates     │
        │ (Real-time)    │
        └────────────────┘
```

---

## 🎨 UI Component Hierarchy

```
App
 │
 ├─ NavigationContainer
 │   │
 │   └─ Stack.Navigator
 │       │
 │       ├─ ConnectionScreen
 │       │   ├─ GoPro Connection Card
 │       │   ├─ Booth Connection Card
 │       │   └─ Continue Button
 │       │
 │       ├─ HomeScreen
 │       │   ├─ Status Card
 │       │   │   ├─ Status Text
 │       │   │   ├─ Timer (if recording)
 │       │   │   └─ Progress Bar
 │       │   ├─ Config Display
 │       │   ├─ Start/Stop Button
 │       │   ├─ Quick Actions
 │       │   └─ Device Status Footer
 │       │
 │       ├─ MusicSelectionScreen
 │       │   ├─ Header
 │       │   ├─ Track List
 │       │   │   └─ Track Items
 │       │   └─ Clear Button
 │       │
 │       ├─ SessionConfigScreen
 │       │   ├─ Duration Options
 │       │   ├─ Speed Options
 │       │   ├─ Video Mode Options
 │       │   ├─ Resolution Options
 │       │   └─ Save/Reset Buttons
 │       │
 │       └─ ManualControlScreen
 │           ├─ GoPro Card
 │           ├─ Booth Card
 │           ├─ Audio Card
 │           └─ Warning Card
```

---

## 🚦 Status Indicators Legend

```
SESSION STATUS:
    🟢 IDLE       → Ready to start
    🟡 PREPARING  → Getting ready
    🔴 RECORDING  → Session in progress
    🟠 STOPPING   → Shutting down
    ⚠️  ERROR     → Something went wrong

DEVICE STATUS:
    🟢 Connected  → Device ready
    ⚪ Not Connected → Device unavailable
    🔵 Connecting → In progress

PROGRESS:
    ▰▰▰▰▰▱▱▱▱▱ 50% → Visual progress bar
    ⏱️  15s / 20s   → Timer display
```

---

## 🔄 Development Phases Visual

```
Phase 1: FOUNDATION ✅ (COMPLETE)
├─ React Native Setup
├─ Service Layer Implementation
├─ State Management
├─ UI Development
└─ Documentation

Phase 2: HARDWARE 🔄 (NEXT)
├─ GoPro Testing
├─ ESP32 Development
├─ Integration Testing
└─ Bug Fixes

Phase 3: PROCESSING 📋 (FUTURE)
├─ Video Transfer
├─ FFmpeg Integration
├─ Intro/Outro
└─ Gallery

Phase 4: CLOUD 📋 (FUTURE)
├─ Backend API
├─ Cloud Processing
├─ Multi-Booth
└─ Analytics

Phase 5: LAUNCH 📋 (FUTURE)
├─ Production Hardening
├─ Documentation
├─ Support System
└─ Commercial Release
```

---

## 📈 Project Timeline

```
Week 1 ✅   Setup & Services
Week 2 ✅   UI & Integration
Week 3 🔄   Hardware Testing
Week 4 📋   ESP32 Development
Week 5 📋   Video Processing
Week 6+ 📋  Advanced Features
```

---

## 💾 File Size Breakdown

```
Source Code:     ~3,500 lines
Documentation:   ~2,500 lines
Configuration:     ~150 lines
────────────────────────────
Total:           ~6,150 lines

Services:           1,500 lines (24%)
UI Screens:         1,800 lines (29%)
Stores:              400 lines (7%)
Types:               300 lines (5%)
Docs:              2,500 lines (41%)
Config:              150 lines (2%)
```

---

## 🎯 Key Metrics

```
✅ Phase 1 Completion:    100%
📱 Screens Built:         5/5
⚙️  Services Implemented:  4/4
🗂️  Stores Created:        3/3
📚 Documentation Files:   9
🔧 Configuration Files:   7
```

---

## 🚀 Quick Reference Commands

```bash
# Setup
npm install
cd ios && pod install && cd ..

# Run
npm run ios         # iOS app
npm run android     # Android app
npm start           # Metro bundler

# Development
npm run lint        # Linting
npx tsc --noEmit    # Type check

# Clean
npm start -- --reset-cache
```

---

This visual overview provides a quick reference for understanding the entire system at a glance.

For detailed information, see the other documentation files.

---

Last Updated: 2025-10-12
