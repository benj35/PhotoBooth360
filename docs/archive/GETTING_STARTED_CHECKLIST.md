# Getting Started Checklist

Your step-by-step guide to getting the 360° Photo Booth app running.

---

## ✅ Prerequisites Setup

### System Requirements
- [ ] **Node.js 18+** installed
  ```bash
  node --version  # Should be 18 or higher
  ```

- [ ] **npm** or **yarn** installed
  ```bash
  npm --version
  ```

### iOS Development (macOS only)
- [ ] **Xcode** installed (latest version from App Store)
- [ ] **Xcode Command Line Tools** installed
  ```bash
  xcode-select --install
  ```
- [ ] **CocoaPods** installed
  ```bash
  sudo gem install cocoapods
  ```

### Android Development
- [ ] **Android Studio** installed
- [ ] **Android SDK** installed (API 33+)
- [ ] **Android Emulator** or physical device configured
- [ ] **Environment variables** set (ANDROID_HOME)

---

## 📱 Project Setup

### Step 1: Navigate to Project
```bash
cd PhotoBooth360/mobile-app
```

### Step 2: Install Dependencies
- [ ] Install npm packages
  ```bash
  npm install
  ```

  **Expected time:** 2-5 minutes

  **What this does:**
  - Installs React Native and dependencies
  - Installs Bluetooth libraries
  - Installs audio libraries
  - Installs navigation libraries

### Step 3: iOS Setup (macOS only)
- [ ] Install CocoaPods dependencies
  ```bash
  cd ios
  pod install
  cd ..
  ```

  **Expected time:** 2-5 minutes

  **What this does:**
  - Installs native iOS dependencies
  - Sets up Xcode workspace

### Step 4: Verify Installation
- [ ] Check for errors in terminal
- [ ] Verify `node_modules` folder exists
- [ ] Verify `ios/Pods` folder exists (iOS)

---

## 🚀 Running the App

### iOS (macOS only)

#### Option A: Command Line
- [ ] Start Metro bundler
  ```bash
  npm start
  ```

- [ ] In a new terminal, run iOS
  ```bash
  npm run ios
  ```

  **Expected time:** 1-2 minutes (first run)

#### Option B: Xcode
- [ ] Open `ios/PhotoBooth360.xcworkspace` in Xcode
- [ ] Select simulator or device
- [ ] Click Run button (▶️)

### Android

#### Option A: Command Line
- [ ] Start Metro bundler (if not running)
  ```bash
  npm start
  ```

- [ ] In a new terminal, run Android
  ```bash
  npm run android
  ```

  **Expected time:** 2-5 minutes (first run)

#### Option B: Android Studio
- [ ] Open `android` folder in Android Studio
- [ ] Wait for Gradle sync
- [ ] Select emulator or device
- [ ] Click Run button (▶️)

---

## 🔍 Verifying the App Works

### Initial Launch
- [ ] App opens without crashing
- [ ] Connection screen is displayed
- [ ] UI renders correctly
- [ ] No red error screens

### Navigation Test
- [ ] Tap "Continue to App" (will show warning - that's OK)
- [ ] Navigate to each screen:
  - [ ] Home Screen
  - [ ] Music Selection
  - [ ] Session Config
  - [ ] Manual Control

### Mock Mode Test
- [ ] On Connection screen, note the "Connect" buttons
- [ ] These will work in mock mode for now
- [ ] Real connections require hardware

---

## 🐛 Troubleshooting

### Metro Bundler Issues
If you see "Metro bundler not running":
- [ ] Run `npm start` in a separate terminal
- [ ] Wait for "Metro waiting on..." message
- [ ] Then run `npm run ios` or `npm run android`

### iOS Build Errors
If build fails:
- [ ] Clear Pods cache
  ```bash
  cd ios
  pod deintegrate
  pod install
  cd ..
  ```
- [ ] Clean build folder in Xcode (⇧⌘K)
- [ ] Try again

### Android Build Errors
If build fails:
- [ ] Clean Gradle cache
  ```bash
  cd android
  ./gradlew clean
  cd ..
  ```
- [ ] Clear Metro cache
  ```bash
  npm start -- --reset-cache
  ```
- [ ] Try again

### App Crashes on Launch
- [ ] Check Metro bundler is running
- [ ] Check for error messages in terminal
- [ ] Try clearing cache:
  ```bash
  npm start -- --reset-cache
  ```

### Permission Errors (Android)
- [ ] Check app has Bluetooth permissions
- [ ] Check app has Location permissions (required for BLE)
- [ ] Grant permissions in device Settings

---

## 📲 Testing Without Hardware

### What You Can Test Now

#### Connection Screen
- [ ] UI renders correctly
- [ ] Input field works for booth IP
- [ ] Buttons are clickable
- [ ] Status indicators display

#### Home Screen
- [ ] Session status card shows "IDLE"
- [ ] Config values display correctly
- [ ] "START SESSION" button is disabled (no devices)
- [ ] Quick action buttons work
- [ ] Device status footer shows disconnected

#### Music Selection
- [ ] Mock tracks load and display
- [ ] Can select a track
- [ ] Selection shows checkmark
- [ ] Can clear selection

#### Session Config
- [ ] Duration options work
- [ ] Speed options work
- [ ] Video mode selection works
- [ ] Resolution selection works
- [ ] Reset to defaults works
- [ ] Save settings works

#### Manual Control
- [ ] Shows "Not connected" for each device
- [ ] UI is properly styled
- [ ] Warning message displays

---

## 🔌 Testing With Hardware (Phase 2)

### GoPro Hero 13 Testing
When you have the camera:

- [ ] Put GoPro in pairing mode
  - Settings → Connections → Connect Device → GoPro App

- [ ] In app, tap "Connect via Bluetooth"

- [ ] Wait for discovery (up to 30 seconds)

- [ ] Verify connection:
  - [ ] Green status dot
  - [ ] Battery percentage shown
  - [ ] Storage shown

- [ ] Test manual control:
  - [ ] Toggle recording on
  - [ ] Verify GoPro starts recording
  - [ ] Toggle recording off
  - [ ] Verify GoPro stops recording

### ESP32 Booth Testing
When booth hardware is ready:

- [ ] Implement ESP32 REST API (see ROADMAP.md)

- [ ] Get booth IP address

- [ ] In app, enter IP address

- [ ] Tap "Connect via Network"

- [ ] Verify connection:
  - [ ] Green status dot
  - [ ] Status shows "Ready"

- [ ] Test manual control:
  - [ ] Toggle rotation on
  - [ ] Verify booth starts spinning
  - [ ] Adjust speed
  - [ ] Verify speed changes
  - [ ] Toggle rotation off
  - [ ] Verify booth stops

### Full Session Test
With both devices connected:

- [ ] Select music track

- [ ] Configure session settings

- [ ] Return to home screen

- [ ] Tap "START SESSION"

- [ ] Verify:
  - [ ] Booth starts rotating
  - [ ] GoPro starts recording
  - [ ] Music starts playing
  - [ ] Timer counts up
  - [ ] Progress bar advances

- [ ] Wait for auto-stop

- [ ] Verify:
  - [ ] All devices stop
  - [ ] Status returns to IDLE
  - [ ] No errors shown

---

## 📝 Development Setup

### VS Code Setup (Recommended)
- [ ] Install extensions:
  - [ ] React Native Tools
  - [ ] ESLint
  - [ ] Prettier
  - [ ] TypeScript

- [ ] Configure auto-format on save

### Code Quality
- [ ] Run linter
  ```bash
  npm run lint
  ```

- [ ] Check TypeScript
  ```bash
  npx tsc --noEmit
  ```

---

## 🎯 Next Actions After Setup

### 1. Familiarize Yourself
- [ ] Read ARCHITECTURE.md
- [ ] Browse through service files
- [ ] Understand state management
- [ ] Review screen components

### 2. Test Thoroughly
- [ ] Test all screens
- [ ] Test navigation
- [ ] Test UI interactions
- [ ] Note any issues

### 3. Hardware Preparation
- [ ] Order/obtain GoPro Hero 13 Black
- [ ] Plan ESP32 booth build
- [ ] Read ESP32 API spec in ROADMAP.md

### 4. Documentation
- [ ] Read remaining docs
- [ ] Understand extension patterns
- [ ] Review roadmap

---

## ✨ Success Indicators

You'll know setup is successful when:

✅ App launches without errors
✅ All screens are accessible
✅ UI is responsive and polished
✅ Mock data displays correctly
✅ Navigation flows smoothly
✅ No TypeScript errors
✅ No linting errors

---

## 🎓 Learning Resources

### React Native
- Official Docs: https://reactnative.dev/
- Environment Setup: https://reactnative.dev/docs/environment-setup

### Project Specific
- [QUICK_START.md](QUICK_START.md) - Fast overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [EXTENDING.md](EXTENDING.md) - Customization guide

### Community
- React Native Community Discord
- Stack Overflow (react-native tag)
- GoPro OpenGoPro docs

---

## 📞 Getting Help

### If You're Stuck

1. **Check the docs**
   - Read relevant .md files
   - Check troubleshooting sections

2. **Review error messages**
   - Read full error in terminal
   - Search error message online

3. **Check common issues**
   - Metro bundler not running
   - Cache issues
   - Permission issues

4. **Start fresh**
   ```bash
   # Clean everything
   cd ios && pod deintegrate && pod install && cd ..
   cd android && ./gradlew clean && cd ..
   npm start -- --reset-cache
   ```

---

## 🎉 Congratulations!

Once you complete this checklist, you'll have:

✅ A fully functional 360° photo booth control app
✅ Understanding of the architecture
✅ Ability to test and extend the system
✅ Foundation for hardware integration

**Next Steps:**
- Move to Phase 2 (Hardware Integration)
- Test with real devices
- Build amazing 360° experiences!

---

**Ready to build? Let's go! 🚀**

---

Last Updated: 2025-10-12
