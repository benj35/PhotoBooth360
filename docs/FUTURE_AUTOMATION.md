# Future Automation Plans (Phase 2 & 3)

This document captures all the automation ideas discussed for future phases. **DO NOT implement these during Phase 1** - focus on getting the manual workflow working first.

---

## Phase 2: Automated Editing & Delivery

**Timeline:** After first successful event (estimated 6-8 weeks after Phase 1)
**Goal:** Reduce manual work, deliver videos within 5 minutes of recording

### 1. Automated Video Editing

#### Option A: FFmpeg Script Automation (Recommended for Phase 2)

**What it does:**
- Automatically applies editing template when video is downloaded
- Adds intro/outro clips
- Syncs background music
- Adds event logo/text overlays
- Exports in optimized format

**Implementation approach:**
```bash
# Windows batch script or Node.js script
# Triggered when new video file appears in download folder

ffmpeg -i input.mp4 \
  -i intro.mp4 \
  -i outro.mp4 \
  -i logo.png \
  -i music.mp3 \
  -filter_complex \
  "[0:v]scale=1080:1920[main]; \
   [main][3:v]overlay=50:50[withlogo]; \
   [withlogo]drawtext=text='Event Name':fontsize=48[final]" \
  -map "[final]" -map 4:a \
  -shortest output.mp4
```

**Requirements:**
- FFmpeg installed on Windows laptop
- Template files organized by event type
- File watcher to trigger processing
- Event template selector in app

**Estimated development time:** 2-3 Sundays

---

#### Option B: After Effects Automation (Alternative)

**What it does:**
- Create After Effects templates with placeholders
- Use Adobe ExtendScript to batch process
- Render queue automation

**Requirements:**
- After Effects license (~$25/month)
- Template creation skills
- ExtendScript knowledge

**Pros:** More professional effects, easier for non-programmers to edit templates
**Cons:** Slower rendering, requires paid software

---

### 2. Telegram Bot Auto-Delivery

**What it does:**
- Customers provide phone number in app
- Bot automatically sends edited video when ready
- Tracks delivery status
- Handles failed deliveries with retry

**Implementation approach:**

1. **Set up Telegram Bot**
   ```bash
   # Talk to @BotFather on Telegram
   /newbot
   # Get bot token
   ```

2. **Backend service (Node.js or Python)**
   ```javascript
   const TelegramBot = require('node-telegram-bot-api');
   const token = 'YOUR_BOT_TOKEN';
   const bot = new TelegramBot(token, {polling: true});

   // When video is ready
   async function sendVideo(phoneNumber, videoPath, eventName) {
     const chatId = await getChatIdFromPhone(phoneNumber);
     await bot.sendVideo(chatId, videoPath, {
       caption: `Your video from ${eventName} is ready! 🎉`
     });
   }
   ```

3. **Customer registration flow**
   - Customer enters phone in app
   - App sends message to bot: "Hi, I'm at [Event Name]"
   - Bot stores chat_id → phone number mapping
   - When video ready, bot sends to correct chat_id

**Requirements:**
- Telegram bot token (free)
- Node.js/Python service running on laptop or cloud
- Customer onboarding flow (they need to start chat with bot)

**Estimated development time:** 2-3 Sundays

---

### 3. File Management Automation

**What it does:**
- Auto-organize files by event and customer
- Auto-transfer from phone to laptop (WiFi sync or cloud)
- Auto-cleanup old files
- Backup to external drive

**Implementation approach:**

**Option A: Local WiFi Sync**
- Use Syncthing or similar to auto-sync phone → laptop
- Folder structure: `/Events/[EventName]/Raw/` and `/Edited/`

**Option B: Cloud intermediate storage**
- Upload from phone to Google Drive/Dropbox
- Laptop watches folder and downloads for processing
- Auto-delete from cloud after delivery

**Estimated development time:** 1-2 Sundays

---

### 4. Event Template Management System

**What it does:**
- In-app event creation (name, logo, colors, text)
- Templates saved and reusable
- Quick template selection before event
- Generates FFmpeg/AE config files

**UI mockup:**
```
Event Templates Screen
├── Create New Event
│   ├── Event Name
│   ├── Upload Logo
│   ├── Color Scheme
│   ├── Overlay Text
│   └── Music Track
├── Saved Templates
│   ├── "Smith Wedding 2025"
│   ├── "Corporate Gala"
│   └── "Birthday Party"
```

**Estimated development time:** 2 Sundays

---

## Phase 3: Cloud Processing & Scaling

**Timeline:** When running 3+ events per week
**Goal:** Handle multiple simultaneous events, faster processing, better reliability

### 1. Cloud Video Processing

#### Why move to cloud?
- Process videos while at events (don't need laptop)
- Handle multiple events simultaneously
- Faster rendering with powerful servers
- Access from anywhere

#### Option A: Shotstack API (Recommended)

**What it does:**
- Cloud-based video editing API
- Template-based rendering
- Webhook notifications when done
- Fast processing (1-2 minutes per video)

**Pricing:** ~$0.10-0.50 per video (starts free)

**Implementation:**
```javascript
const shotstack = require('shotstack-sdk');

const edit = {
  timeline: {
    tracks: [
      { clips: [{ asset: { type: 'video', src: videoUrl } }] },
      { clips: [{ asset: { type: 'audio', src: musicUrl } }] },
      { clips: [{ asset: { type: 'image', src: logoUrl } }] }
    ]
  },
  output: { format: 'mp4', resolution: '1080' }
};

const render = await shotstack.render(edit);
```

**Estimated setup time:** 1-2 Sundays
**Ongoing cost:** $20-100/month depending on volume

---

#### Option B: AWS Lambda + FFmpeg

**What it does:**
- Serverless FFmpeg processing
- S3 for storage
- Lambda function triggered on upload

**Pricing:** ~$0.10 per video (very cheap at scale)

**Pros:** Cheapest, most control
**Cons:** Complex setup, need AWS knowledge

**Estimated setup time:** 3-4 Sundays

---

### 2. WhatsApp Business API Integration

**What it does:**
- Send videos via WhatsApp instead of Telegram
- More familiar to customers
- Higher delivery rates

**Requirements:**
- WhatsApp Business API access (needs approval)
- Business verification
- Phone number dedicated to business

**Alternatives:**
- Use Twilio WhatsApp API (easier to set up, $0.005/message)
- Use unofficial libraries (risky, might get banned)

**Estimated setup time:** 2-3 Sundays (includes approval wait time)

---

### 3. Multi-Event Management Dashboard

**What it does:**
- Manage multiple events from one app
- Switch between active events
- Track videos per event
- Analytics (total videos, revenue, popular times)

**Features:**
- Event calendar
- Customer database
- Revenue tracking
- Video analytics (completion rate, download rate)
- Equipment checklist per event

**Estimated development time:** 4-5 Sundays

---

### 4. Premium Editing Features

**What customers might pay extra for:**
- Slow-motion effects ($5 extra)
- Multiple camera angles (if you add second GoPro)
- Custom intro with customer name
- Longer videos (30-45 seconds)
- Instant delivery (priority queue)

**Implementation:**
- Tiered session types in app
- Different pricing in session config
- Premium templates with advanced effects

**Estimated development time:** 2-3 Sundays

---

### 5. QR Code Customer Onboarding

**What it does:**
- Display QR code at booth
- Customer scans → opens web form
- Enters phone number + preferences
- Gets added to queue automatically

**Benefits:**
- Faster customer onboarding
- Reduce manual data entry
- Collect emails for marketing
- Accept payments upfront (Stripe integration)

**Implementation:**
- Simple web form (React or static HTML)
- Backend API to create session
- App polls for new customers

**Estimated development time:** 2 Sundays

---

## Cost Analysis for Automation

### Phase 2 (Local Automation)
| Item | Cost |
|------|------|
| FFmpeg | Free |
| Telegram Bot | Free |
| Node.js service | Free (runs on laptop) |
| **Total recurring** | **$0/month** |

### Phase 3 (Cloud Processing)
| Item | Cost per video | Monthly (100 videos) |
|------|----------------|----------------------|
| Shotstack API | $0.30 | $30 |
| AWS S3 Storage | $0.01 | $1 |
| WhatsApp (Twilio) | $0.005 | $0.50 |
| Domain & Hosting | - | $10 |
| **Total** | **~$0.31** | **~$41.50** |

**Break-even:** If you charge $10/video and do 100 videos/month = $1000 revenue - $41.50 costs = $958.50 profit

---

## Decision Points

**When to move to Phase 2:**
- After 3+ successful events
- Manual editing feels too slow
- Getting repeat customers
- Comfortable with the workflow

**When to move to Phase 3:**
- Doing 5+ events per month
- Running multiple events per day
- Hiring staff to help
- Need to process while at events

---

## Music Licensing (Important!)

### For Live Playback + Editing

**Royalty-free music sources:**
- **Epidemic Sound** ($15/month) - huge library, commercial license
- **Artlist** ($25/month) - high quality, unlimited downloads
- **Uppbeat** (Free tier available) - YouTube-safe music
- **Soundstripe** ($20/month) - good for events

**DO NOT use:**
- Copyrighted music from Spotify/Apple Music (legal issues)
- YouTube music (licensing unclear)

**Recommendation:** Start with Epidemic Sound ($15/month), 50+ tracks covers most events

---

## Backup & Disaster Recovery (Critical!)

### What could go wrong:
- Laptop hard drive fails → lose all videos
- Phone stolen at event → lose recordings
- Router fails → can't control devices
- GoPro battery dies → session interrupted

### Backup strategy (Phase 2+):
1. **Real-time cloud backup**
   - Videos auto-upload to Google Drive/Backblaze B2
   - Keep for 30 days minimum

2. **Equipment redundancy**
   - Backup GoPro (used models ~$200)
   - Backup router ($30)
   - Extra batteries for everything

3. **Local backup**
   - External SSD backup weekly
   - Keep edited videos forever (archive)
   - Delete raw files after 30 days

**Cost:** ~$10/month for 2TB cloud storage

---

## Phase 2 Kickoff Checklist

**Before starting automation:**
- [ ] Completed 3+ events successfully
- [ ] Manual workflow takes <5 minutes per video
- [ ] Have consistent editing template
- [ ] Understand customer delivery expectations
- [ ] Have budget for music licensing ($15/month minimum)

**First automation priority:**
1. FFmpeg script automation (saves most time)
2. Telegram bot delivery (best customer experience)
3. Template management system (ease of use)

---

**Last Updated:** 2025-10-19
**Status:** Planning only - DO NOT implement until Phase 1 complete
**Next Review:** After 3rd successful event
