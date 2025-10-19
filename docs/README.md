# PhotoBooth360 Documentation

This directory contains all planning, setup, and operational documentation for the 360° Photo Booth mobile application project.

---

## Quick Navigation

### Core Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[PHASE1_PLAN.md](PHASE1_PLAN.md)** | Master development plan for Phase 1 | Weekly reference, track progress |
| **[NETWORK_SETUP.md](NETWORK_SETUP.md)** | Router and static IP configuration | One-time setup, troubleshooting |
| **[FUTURE_AUTOMATION.md](FUTURE_AUTOMATION.md)** | Phase 2/3 automation plans | After Phase 1 complete |

### Operational Guides (To be created)

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[EVENT_SETUP_GUIDE.md](EVENT_SETUP_GUIDE.md)** | How to set up equipment at events | Before every event |
| **[EDITING_WORKFLOW.md](EDITING_WORKFLOW.md)** | Manual video editing steps | While editing videos |
| **[MANUAL_DELIVERY.md](MANUAL_DELIVERY.md)** | How to deliver videos via Telegram | After editing |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Common problems & solutions | When things go wrong |

---

## Project Context

**Business Model:**
- 360° photo booth rental for events (weddings, corporate, birthdays)
- Record 20-second 360° videos with GoPro on rotating booth
- Edit with event branding and music
- Deliver to customer via Telegram within 5-30 minutes

**Current Phase:** Phase 1 - MVP Development (Hardware Integration)

**Development Schedule:** Sundays only (4-6 hour sessions)

---

## Phase Overview

### Phase 1: MVP - Booth Operation (Current)
**Goal:** Run first paid event with manual editing workflow

**Deliverables:**
- ✅ Hardware integration (ESP32 + GoPro + Audio)
- ✅ Automated recording sessions
- ✅ File downloads and organization
- ✅ Manual editing workflow documented
- ✅ Event setup procedures

**Timeline:** 5 Sundays (weeks)

---

### Phase 2: Automation (Future)
**Goal:** Automate editing and delivery pipeline

**Features:**
- FFmpeg script automation
- Telegram bot auto-delivery
- Event template management
- Batch processing

**Timeline:** 6-8 weeks after first event

**Reference:** [FUTURE_AUTOMATION.md](FUTURE_AUTOMATION.md)

---

### Phase 3: Scaling (Future)
**Goal:** Handle multiple events, cloud processing

**Features:**
- Cloud video processing (Shotstack API)
- WhatsApp Business integration
- Multi-event management dashboard
- Premium editing features

**Timeline:** When running 3+ events per week

**Reference:** [FUTURE_AUTOMATION.md](FUTURE_AUTOMATION.md)

---

## Technical Architecture

### Hardware Components
- **ESP32 Booth Controller** (192.168.1.100) - Controls rotation via REST API
- **GoPro Hero 13 Black** (192.168.1.101) - Records video via BLE + WiFi
- **Portable WiFi Router** - Connects all devices with static IPs
- **Bluetooth Speaker** - Plays music during recording

### Software Stack
- **React Native 0.82** with TypeScript
- **Zustand** for state management
- **react-native-ble-plx** for GoPro BLE control
- **axios** for ESP32 REST API calls
- **FFmpeg** for video editing (Phase 2)

### GoPro Connection Strategy
- **BLE:** Camera control (start/stop recording, status checks)
- **WiFi:** File downloads after recording
- **Why hybrid:** BLE is fast for commands, WiFi required for file transfers

---

## Weekly Development Workflow

**Each Sunday:**

1. **Start (15 min)**
   - Review previous week's progress
   - Update [PHASE1_PLAN.md](PHASE1_PLAN.md) progress section
   - Set goals for today

2. **Code (3-4 hours)**
   - Follow weekly tasks from Phase 1 plan
   - Test with physical hardware
   - Document any issues encountered

3. **Test (1 hour)**
   - Verify functionality with real devices
   - Run checklist from weekly plan
   - Note any bugs or edge cases

4. **Document (30 min)**
   - Update progress in Phase 1 plan
   - Add notes to troubleshooting guide
   - Write down any questions for next week

5. **Plan (15 min)**
   - Confirm next Sunday's tasks
   - Identify potential blockers
   - Prepare any research needed

---

## Storage & File Organization

### Local Storage Structure
```
Phone/Tablet:
  /PhotoBooth360/
    └── Downloads/
        └── [EventName]/
            └── [PhoneNumber]_[Timestamp].mp4

Laptop:
  /Events/
    └── [EventName]/
        ├── Raw/
        │   └── Customer videos
        ├── Edited/
        │   └── Final videos
        └── Delivered/
            └── delivery_log.json

External Drive:
  /Backup/
    └── [EventName]/
        └── Edited videos (archive)
```

### Storage Capacity Planning
- **Small event (50 people):** ~10 GB
- **Medium event (100 people):** ~21 GB
- **Large event (200 people):** ~42 GB

**Reference:** [PHASE1_PLAN.md - Storage Section](PHASE1_PLAN.md#storage--capacity-planning)

---

## Important Links

### GoPro Documentation
- **Main:** https://github.com/gopro/OpenGoPro
- **BLE API:** https://gopro.github.io/OpenGoPro/ble
- **WiFi/HTTP API:** https://gopro.github.io/OpenGoPro/http

### Project Documentation
- **Root README:** [../README.md](../README.md)
- **Architecture:** [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **Claude Context:** [../CLAUDE.md](../CLAUDE.md)

---

## Troubleshooting Quick Reference

### Hardware Connection Issues
1. **ESP32 not reachable:** Check WiFi, verify static IP (192.168.1.100)
2. **GoPro BLE won't pair:** Requires physical device, check Bluetooth permissions
3. **Video download fails:** Switch from BLE to WiFi connection
4. **Music won't play:** Verify Bluetooth speaker connected to phone

**Full guide:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (to be created)

### Network Issues
1. **Devices get wrong IPs:** Verify static IP reservations in router
2. **Can't access router admin:** Try 192.168.0.1 or 192.168.1.1
3. **GoPro won't connect to WiFi:** Check WPA2 security, update firmware

**Full guide:** [NETWORK_SETUP.md](NETWORK_SETUP.md)

---

## Progress Tracking

### Current Status (2025-10-19)

**Phase 1 Progress:** Week 1 of 5

**Completed:**
- ✅ App structure and UI built
- ✅ Service layer implemented (mock mode)
- ✅ State management (Zustand stores)
- ✅ Documentation created

**In Progress:**
- 🚀 Hardware integration (ESP32 + GoPro)
- 🚀 Network setup with static IPs

**Next Up:**
- Automated session flow testing
- File download implementation
- Editing workflow documentation

---

## Document Maintenance

**When to update:**
- After completing each Sunday's work
- When discovering new issues/solutions
- When changing technical decisions
- After first event (lessons learned)

**Who updates:**
- You (developer) update technical docs
- Claude helps maintain consistency
- Both review before each Sunday session

---

**Last Updated:** 2025-10-19
**Maintained By:** Developer + Claude Code
**Next Review:** After Sunday 1 completion
