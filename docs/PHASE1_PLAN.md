# Phase 1: MVP - Booth Operation with Manual Editing

**Goal:** Run your first event successfully with manual video delivery
**Timeline:** 4-5 Sundays (working with your schedule)
**Status:** 🚀 In Progress - Starting Sunday 1

---

## Overview

This phase focuses on getting the core booth operational for your first paid event. You'll be able to run sessions, download videos, and manually edit/deliver them to customers via Telegram.

**What you'll have after Phase 1:**
- ✅ Fully automated recording sessions (booth + GoPro + music)
- ✅ Reliable video downloads from GoPro
- ✅ Customer tracking system
- ✅ Manual editing workflow (5 min per video)
- ✅ Manual Telegram delivery
- ✅ Ready to book your first event

---

## Storage & Capacity Planning

### Video Storage Math

**Per video:**
- GoPro Hero 13 at 5.3K/30fps: ~5-8 MB per second
- 20-second raw video: **~100-160 MB**
- Edited video (compressed): **~30-50 MB**

**Storage scenarios:**

| Event Size | Videos | Raw Storage | Edited Storage | Total |
|------------|--------|-------------|----------------|-------|
| Small (50 people) | 50 | 8 GB | 2.5 GB | **10.5 GB** |
| Medium (100 people) | 100 | 16 GB | 5 GB | **21 GB** |
| Large (200 people) | 200 | 32 GB | 10 GB | **42 GB** |

### Local Storage Plan
- **Phone/Tablet**: 128GB minimum (can hold 2-3 large events before offload)
- **Processing laptop**: 512GB SSD (holds 10+ events)
- **External backup drive**: 1TB ($50) - archive all events

### Workflow
1. Record to GoPro SD card (128GB card = ~200 videos)
2. Download to phone during event
3. Transfer to laptop for editing
4. Delete raw files after delivery (keep edited versions)
5. Monthly backup to external drive

---

## Network Architecture

### Equipment Setup

```
┌─────────────────────────────────────────────────────────┐
│              YOUR EVENT NETWORK                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Portable WiFi Router] 192.168.1.1                    │
│       ├── ESP32 Booth Controller → 192.168.1.100       │
│       ├── GoPro Hero 13 → 192.168.1.101                │
│       └── Phone/Tablet (React Native App)              │
│                                                         │
│  [Bluetooth Speaker] ← Connected to phone              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Static IP Configuration

**Why static IPs?**
- WiFi routers assign random IPs by default
- Your app needs to know EXACTLY where ESP32 and GoPro are
- Static IP = device always gets the same IP address

**One-time setup (detailed in NETWORK_SETUP.md):**
1. Connect ESP32 to your router
2. Find ESP32 MAC address in router admin panel
3. Create DHCP reservation: MAC → 192.168.1.100
4. Repeat for GoPro → 192.168.1.101
5. Hard-code these IPs in your app

**Result:** Every event, same IPs, app always knows where to send commands ✅

---

## GoPro Connection Strategy

### Hybrid BLE + WiFi Approach (RECOMMENDED)

**Use BLE for:**
- Initial pairing/discovery
- Camera control commands (start/stop recording)
- Quick status checks (battery, recording state)
- **Why:** Fast, reliable, low latency

**Use WiFi for:**
- Downloading video files after recording
- Preview thumbnails
- Bulk operations
- **Why:** Only way to transfer large files

**Why this is best:**
- BLE is perfect for commands (millisecond response)
- WiFi is necessary for file transfer (BLE too slow - would take 10+ minutes per video)
- **GoPro is designed for this hybrid approach** in their official SDK

### Implementation Flow
```typescript
1. App starts → Scan for GoPro via BLE
2. User pairs → Save GoPro device ID
3. During session:
   - Send start/stop recording via BLE ✅ Fast
   - Monitor status via BLE
4. After session:
   - Connect to GoPro WiFi (192.168.1.101)
   - Download video file via HTTP API
   - Disconnect, ready for next customer
```

---

## Weekly Development Plan

### Sunday 1: Hardware Integration & Testing ✅ TODAY

**Goal:** Connect all physical devices and verify basic control

**Tasks:**
1. **Network Setup (1 hour)**
   - Configure router with static IPs
   - Document MAC addresses
   - Test connectivity from phone
   - **Reference:** [NETWORK_SETUP.md](NETWORK_SETUP.md)

2. **ESP32 Integration (2 hours)**
   - Get ESP32 REST API endpoint details
   - Replace mock BoothService with real API calls
   - Test rotation commands (start/stop/speed)
   - Add error handling
   - **Code location:** [src/services/BoothService.ts](../src/services/BoothService.ts)

3. **GoPro BLE Testing (2 hours)**
   - Pair physical GoPro to app via Bluetooth
   - Test start/stop recording commands
   - Verify status monitoring (battery, storage)
   - **Reference:** [GoPro BLE Docs](https://gopro.github.io/OpenGoPro/ble)
   - **Code location:** [src/services/GoProService.ts](../src/services/GoProService.ts)

**Testing Checklist:**
- [ ] Router assigns correct static IPs to ESP32 and GoPro
- [ ] App finds and pairs with GoPro via BLE
- [ ] Can start/stop booth rotation from app
- [ ] Can start/stop GoPro recording from app
- [ ] Status updates (battery, recording state) show in app UI
- [ ] No connection drops during 5 consecutive sessions

**Deliverable:** App can control booth and GoPro independently

---

### Sunday 2: Automated Session Flow

**Goal:** Full automated session runs smoothly end-to-end

**Tasks:**
1. **Session Orchestration Testing (1.5 hours)**
   - Test full automated sequence (booth + GoPro + music)
   - Fine-tune timing delays between device startups
   - Add session duration configuration UI
   - Test emergency stop functionality
   - **Code location:** [src/services/SessionOrchestrator.ts](../src/services/SessionOrchestrator.ts)

2. **Audio Playback Implementation (1.5 hours)**
   - Connect Bluetooth speaker to phone
   - Add 3-5 royalty-free music tracks to app
   - Test music playback during session
   - Sync music start with recording start
   - **Code location:** [src/services/AudioService.ts](../src/services/AudioService.ts)

3. **Customer Tracking Setup (1 hour)**
   - Add input field for customer phone number
   - Store session data (timestamp, phone, event name)
   - Create simple session log (JSON file or AsyncStorage)
   - **Code location:** [src/screens/HomeScreen.tsx](../src/screens/HomeScreen.tsx)

**Testing Checklist:**
- [ ] Full 20-second session runs smoothly
- [ ] Music plays during recording (Bluetooth speaker)
- [ ] Booth rotation timing is correct
- [ ] GoPro starts recording at right moment
- [ ] Everything stops automatically after duration
- [ ] Customer phone numbers saved correctly
- [ ] Can run 10 sessions back-to-back without issues

**Deliverable:** One-button automated sessions with customer tracking

---

### Sunday 3: File Management & Download

**Goal:** Videos download and organize automatically

**Tasks:**
1. **GoPro WiFi File Transfer (2 hours)**
   - Implement GoPro WiFi connection (after BLE pairing)
   - Get list of videos from GoPro via HTTP API
   - Download latest video after each session
   - Save with customer identifier (phone number + timestamp)
   - **Reference:** [GoPro HTTP Docs](https://gopro.github.io/OpenGoPro/http)
   - **Code location:** [src/services/GoProService.ts](../src/services/GoProService.ts)

2. **File Organization System (1 hour)**
   - Create folder structure: `/Events/[EventName]/[PhoneNumber]_[Timestamp].mp4`
   - Auto-transfer downloads to laptop (or manual via USB)
   - Implement storage monitoring (warn when space low)

3. **Session Completion Flow (1 hour)**
   - Mark session as "recorded" after download
   - Show customer confirmation screen
   - Queue next customer
   - **Code location:** [src/stores/sessionStore.ts](../src/stores/sessionStore.ts)

**Testing Checklist:**
- [ ] Videos download successfully from GoPro
- [ ] Files are named correctly with customer info
- [ ] Can find videos easily for editing
- [ ] Storage warnings work correctly
- [ ] Download works even with multiple queued sessions
- [ ] No duplicate downloads

**Deliverable:** Videos auto-download and organize by customer

---

### Sunday 4: Manual Editing Workflow Documentation

**Goal:** Fast, repeatable editing process documented

**Tasks:**
1. **Create Editing Templates (2 hours)**
   - Design 2-3 event templates (wedding, corporate, birthday)
   - Set up FFmpeg template scripts OR After Effects templates
   - Create intro/outro clips (2-3 seconds each)
   - Test with sample videos
   - **Save templates in:** `/templates/`

2. **Editing Workflow Documentation (1 hour)**
   - Write step-by-step editing guide
   - Include template customization steps
   - Document music sync process
   - Create delivery checklist
   - **Document location:** [EDITING_WORKFLOW.md](EDITING_WORKFLOW.md)

3. **Manual Delivery Process (1 hour)**
   - Set up personal Telegram account for sending
   - Create message templates for delivery
   - Test sending video files via Telegram
   - Document customer communication flow
   - **Document location:** [MANUAL_DELIVERY.md](MANUAL_DELIVERY.md)

**Testing Checklist:**
- [ ] Can edit a video in under 5 minutes
- [ ] Templates look professional
- [ ] Music syncs correctly with video
- [ ] Intro/outro transitions are smooth
- [ ] Telegram delivery works reliably
- [ ] Have message templates ready

**Deliverable:** Complete editing and delivery workflow documented

---

### Sunday 5: End-to-End Testing & First Event Prep

**Goal:** Ready to book your first paid event

**Tasks:**
1. **Full Workflow Simulation (2 hours)**
   - Simulate 10-customer event at home
   - Time each step (recording, download, editing, delivery)
   - Identify bottlenecks
   - Optimize slow steps

2. **Error Handling & Edge Cases (1 hour)**
   - Test with low GoPro battery
   - Test with weak WiFi signal
   - Test when storage is full
   - Add user-friendly error messages

3. **Event Preparation Documentation (1 hour)**
   - Create pre-event equipment checklist
   - Create event setup guide (15-min setup)
   - Create troubleshooting guide
   - Pack backup equipment list
   - **Document location:** [EVENT_SETUP_GUIDE.md](EVENT_SETUP_GUIDE.md)

4. **Create Future Automation Documentation (30 min)**
   - Document what to automate in Phase 2
   - Save Telegram bot automation plan
   - Save cloud processing research
   - Create Phase 2 roadmap
   - **Document location:** [FUTURE_AUTOMATION.md](FUTURE_AUTOMATION.md)

**Testing Checklist:**
- [ ] Can run 10 sessions in 30 minutes
- [ ] All common errors handled gracefully
- [ ] Event setup takes under 15 minutes
- [ ] Know exactly what to do if something breaks
- [ ] Documentation is complete and organized
- [ ] Confident to book first event

**Deliverable:** Production-ready system for first event

---

## Success Criteria

**You're ready for your first event when:**
- ✅ Can run 20+ sessions without crashes
- ✅ Videos download reliably from GoPro
- ✅ Know exactly where each video file is saved
- ✅ Can edit a video in under 5 minutes
- ✅ Have tested full setup at home 3+ times
- ✅ Have backup plan for every device failure
- ✅ Can set up equipment in 15 minutes
- ✅ Can troubleshoot common issues independently

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| **GoPro Connection** | BLE for control, WiFi for downloads | Fast commands, reliable transfers |
| **Network Setup** | Static IP reservations | Predictable, no IP hunting |
| **Music Playback** | Live + post-production | Better customer experience |
| **Editing** | Manual (local laptop - Windows) | Learn workflow before automating |
| **Delivery** | Manual Telegram | Simple, will automate in Phase 2 |
| **Storage** | Local (phone + laptop) | No recurring costs, full control |

---

## Documentation References

- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Technical architecture overview
- **[CLAUDE.md](../CLAUDE.md)** - AI assistant context and project guidance
- **[NETWORK_SETUP.md](NETWORK_SETUP.md)** - Router and static IP configuration
- **[EDITING_WORKFLOW.md](EDITING_WORKFLOW.md)** - Manual editing steps
- **[EVENT_SETUP_GUIDE.md](EVENT_SETUP_GUIDE.md)** - How to set up at events
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common problems & solutions
- **[FUTURE_AUTOMATION.md](FUTURE_AUTOMATION.md)** - Phase 2/3 automation plans

---

## Progress Tracking

Update this section each Sunday:

### Sunday 1 - [DATE]
- [ ] Network setup complete
- [ ] ESP32 integration working
- [ ] GoPro BLE control working
- **Blockers:**
- **Notes:**

### Sunday 2 - [DATE]
- [ ] Automated sessions working
- [ ] Audio playback implemented
- [ ] Customer tracking working
- **Blockers:**
- **Notes:**

### Sunday 3 - [DATE]
- [ ] File downloads working
- [ ] Organization system complete
- [ ] Session completion flow done
- **Blockers:**
- **Notes:**

### Sunday 4 - [DATE]
- [ ] Editing templates created
- [ ] Workflow documented
- [ ] Delivery process ready
- **Blockers:**
- **Notes:**

### Sunday 5 - [DATE]
- [ ] End-to-end testing complete
- [ ] Event prep documentation done
- [ ] Ready for first booking
- **Blockers:**
- **Notes:**

---

**Last Updated:** 2025-10-19
**Phase Status:** In Progress
**Next Milestone:** Sunday 1 - Hardware Integration
