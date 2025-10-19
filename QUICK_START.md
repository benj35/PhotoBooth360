# 🚀 PhotoBooth360 Quick Start

**Last Updated:** 2025-10-19 | **Current Phase:** Phase 1 - Week 1

This is your quick reference guide for the project. For detailed plans, see [docs/](docs/) folder.

---

## 📋 Today's Mission (Sunday 1)

**Goal:** Connect physical hardware and verify basic control

### Tasks:
- [ ] Configure router with static IPs → [Guide](docs/NETWORK_SETUP.md)
- [ ] Integrate ESP32 REST API → Update [BoothService.ts](src/services/BoothService.ts)
- [ ] Test GoPro BLE control → Test [GoProService.ts](src/services/GoProService.ts)

**Estimated Time:** 4-6 hours

---

## 🗺️ The Complete Plan

### Phase 1: MVP (5 Sundays) - Get Ready for First Event

| Week | Focus | Deliverable |
|------|-------|-------------|
| **1** (Today) | Hardware integration | ESP32 + GoPro working |
| **2** | Automated sessions | Full session flow works |
| **3** | File management | Videos download & organize |
| **4** | Editing workflow | Templates & manual editing |
| **5** | Testing & prep | Ready for first event |

**Full Plan:** [docs/PHASE1_PLAN.md](docs/PHASE1_PLAN.md)

### Phase 2: Automation (Future)
- FFmpeg script automation
- Telegram bot delivery
- Template management

**Details:** [docs/FUTURE_AUTOMATION.md](docs/FUTURE_AUTOMATION.md)

### Phase 3: Scaling (Future)
- Cloud processing
- WhatsApp integration
- Multi-event management

**Details:** [docs/FUTURE_AUTOMATION.md](docs/FUTURE_AUTOMATION.md)

---

## 🔧 Hardware Setup

### Network Configuration

```
[WiFi Router] 192.168.1.1
    ├── ESP32 Booth → 192.168.1.100 (static)
    ├── GoPro Hero 13 → 192.168.1.101 (static)
    └── Phone/Tablet → Dynamic IP
```

**Setup Guide:** [docs/NETWORK_SETUP.md](docs/NETWORK_SETUP.md)

### GoPro Connection Strategy
- **BLE:** Camera control (start/stop, status)
- **WiFi:** File downloads after session
- **Why both:** BLE is fast, WiFi needed for large files

---

## 📁 Key Files to Work On

### Services (src/services/)
- **[BoothService.ts](src/services/BoothService.ts)** - Replace mock with ESP32 API
- **[GoProService.ts](src/services/GoProService.ts)** - Test BLE, add WiFi downloads
- **[AudioService.ts](src/services/AudioService.ts)** - Test Bluetooth speaker
- **[SessionOrchestrator.ts](src/services/SessionOrchestrator.ts)** - Coordinate all devices

### Stores (src/stores/)
- **[sessionStore.ts](src/stores/sessionStore.ts)** - Session state management
- **[deviceStore.ts](src/stores/deviceStore.ts)** - Device connection states

### Screens (src/screens/)
- **[HomeScreen.tsx](src/screens/HomeScreen.tsx)** - Main control interface
- **[ManualControlScreen.tsx](src/screens/ManualControlScreen.tsx)** - Individual device testing

---

## 🔗 Important Resources

### Documentation
- **[CLAUDE.md](CLAUDE.md)** - AI assistant context (updated with current plan)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture
- **[docs/README.md](docs/README.md)** - Documentation index

### External Links
- **GoPro BLE API:** https://gopro.github.io/OpenGoPro/ble
- **GoPro HTTP API:** https://gopro.github.io/OpenGoPro/http
- **ESP32 Docs:** (Get from your electrical engineer)

---

## 💾 Storage Planning

### Per Event Capacity

| Event Size | Videos | Storage Needed |
|------------|--------|----------------|
| Small (50) | 50 | ~10 GB |
| Medium (100) | 100 | ~21 GB |
| Large (200) | 200 | ~42 GB |

### Storage Strategy
- **Phone:** 128GB minimum
- **Laptop:** 512GB for editing
- **External Drive:** 1TB for backups

**Details:** [docs/PHASE1_PLAN.md - Storage](docs/PHASE1_PLAN.md#storage--capacity-planning)

---

## ✅ Weekly Workflow

**Every Sunday:**

1. **Start (15 min):** Review last week, plan today
2. **Code (3-4 hrs):** Implement weekly tasks
3. **Test (1 hr):** Verify with physical hardware
4. **Document (30 min):** Update progress
5. **Plan (15 min):** Prepare for next Sunday

---

## 🚨 Common Issues

### "ESP32 not reachable"
→ Check WiFi connection, verify IP is 192.168.1.100

### "GoPro won't pair via BLE"
→ Must use physical device (not simulator), check Bluetooth permissions

### "Can't download video"
→ Need to switch from BLE to WiFi connection

**Full Guide:** [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) (to be created)

---

## 🎯 Phase 1 Success Criteria

**You're ready for your first event when:**
- ✅ Can run 20+ sessions without crashes
- ✅ Videos download reliably from GoPro
- ✅ Can edit a video in under 5 minutes
- ✅ Have tested full setup 3+ times at home
- ✅ Know exactly what to do if something breaks

---

## 📞 Quick Commands

### Run the App
```bash
npm start              # Start Metro bundler
npm run android        # Run on Android
npm run ios            # Run on iOS (macOS only)
```

### Code Quality
```bash
npm test              # Run tests
npm run lint          # Check code quality
```

---

## 📌 This Week's Checklist

**Sunday 1 - Hardware Integration:**

**Network Setup:**
- [ ] Configure router (WiFi name, password)
- [ ] Find ESP32 MAC address
- [ ] Find GoPro MAC address
- [ ] Create static IP reservations
- [ ] Verify IPs work correctly

**ESP32 Integration:**
- [ ] Get REST API endpoint details from engineer
- [ ] Update BoothService.ts with real endpoints
- [ ] Test rotation start/stop
- [ ] Test speed control
- [ ] Add error handling

**GoPro BLE Testing:**
- [ ] Pair GoPro with app via Bluetooth
- [ ] Test start recording command
- [ ] Test stop recording command
- [ ] Verify battery status display
- [ ] Test recording state monitoring

**Final Test:**
- [ ] Run 5 consecutive automated sessions
- [ ] No connection drops
- [ ] All devices respond correctly
- [ ] Status updates show in UI

---

## 💡 Remember

- **Work Sundays only** - 4-6 hours each
- **Document everything** - You'll forget details
- **Test with real hardware** - Simulators don't work for BLE
- **Don't automate yet** - Focus on manual workflow first
- **Keep it simple** - First event is learning experience

---

## 🗂️ Project Structure

```
PhotoBooth360/
├── src/
│   ├── services/          ← Service layer (ESP32, GoPro, Audio)
│   ├── stores/            ← State management (Zustand)
│   ├── screens/           ← UI screens
│   ├── types/             ← TypeScript interfaces
│   └── components/        ← Reusable components
├── docs/                  ← All documentation (plans, guides)
│   ├── PHASE1_PLAN.md     ← Master development plan
│   ├── NETWORK_SETUP.md   ← Router configuration guide
│   └── FUTURE_AUTOMATION.md ← Phase 2/3 plans
├── templates/             ← Video editing templates (Phase 2)
├── music/                 ← Royalty-free music tracks
├── CLAUDE.md              ← AI assistant context
├── ARCHITECTURE.md        ← Technical architecture
└── QUICK_START.md         ← This file (weekly reference)
```

---

**Next Steps:**
1. Read [docs/NETWORK_SETUP.md](docs/NETWORK_SETUP.md)
2. Configure your router with static IPs
3. Start working on ESP32 integration
4. Test GoPro BLE pairing

**Need Help?** Ask Claude Code - all context is in [CLAUDE.md](CLAUDE.md)

**Good luck with Sunday 1!** 🚀
