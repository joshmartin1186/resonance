# Resonance - Debugging Guide (Non-Technical User)

## Common Issues & Solutions

### 1. Generation Stuck on "Processing"

**Check:**
1. Go to project page
2. Click "View Logs" button
3. Look for last activity timestamp

**If logs stopped updating:** Click "Retry Generation"
**If logs show errors:** Read error message and follow suggestions

### 2. Video Quality Issues

**Solutions:**
- Check project resolution setting (default to 1080p)
- Ensure uploaded footage is high quality
- Regenerate with higher resolution

### 3. Audio/Video Out of Sync

**Solution:** Click "Regenerate" button

### 4. "Usage Limit Reached"

**Solution:** Check dashboard for usage stats, upgrade if needed

### 5. Uploaded Files Not Appearing

**Check file limits:**
- Audio: 50 MB max
- Video: 500 MB max
- Images: 20 MB max

**Supported formats:**
- Audio: MP3, WAV, FLAC, M4A
- Video: MP4, MOV
- Images: JPG, PNG

### 6. Generation Failed

**Common errors:**

**"Audio analysis failed"**
- Audio file may be corrupted
- Try re-exporting from your DAW

**"Footage processing failed"**
- Re-encode footage with H.264 codec, MP4 container

**"Render timeout"**
- Try lower resolution
- Reduce footage amount
- Shorter audio duration

## How to Get Help

**Email:** support@resonance.app (response within 24 hours)

**Include:**
- Account email
- Project or generation ID
- What you expected vs. what happened
- Screenshots of error messages