# Assets Directory

Place your overlay images and music files here.

## Required Files

### Overlays (`overlays/`)
- `corporate-frame.png` - Professional frame overlay for corporate events
- `party-frame.png` - Fun colorful frame for parties/celebrations

**Overlay Requirements:**
- Format: PNG with transparency
- Resolution: Match your video resolution (e.g., 1920x1080 or 1080x1920 for portrait)
- The overlay will be placed on top of the video, so use transparency for the center area

### Music (`music/`)
- `corporate-subtle.mp3` - Subtle background music for corporate (30-60 seconds, will loop)
- `party-upbeat.mp3` - Upbeat party music (30-60 seconds, will loop)

**Music Requirements:**
- Format: MP3
- Duration: 30-60 seconds recommended (will mix with video duration)
- Volume will be reduced to 20-35% and mixed with original video audio

## Tips

1. **Overlay Design:**
   - Keep center clear for the main video content
   - Add your logo/branding in corners
   - Use semi-transparent elements for a professional look

2. **Music Selection:**
   - Choose royalty-free music to avoid copyright issues
   - Instrumental tracks work best (no vocals to compete with video audio)
   - Match the energy to the event type

## Testing Without Assets

The server will still work without assets - it will just skip the overlay/music effects and only apply the text label. This is useful for testing.
