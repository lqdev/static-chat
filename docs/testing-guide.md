# Testing Guide for Static Chat

## Manual Testing Procedure

### Prerequisites
1. Azure SignalR Service configured in **Serverless** mode
2. Two separate browser windows or devices
3. Camera and microphone permissions granted

### Test Case: Two Participants Video Chat

**Objective**: Verify that two participants can see and hear each other in a video chat room.

**Steps**:

1. **Open First Browser (Participant A)**
   - Navigate to the chat application
   - Click "Start a Video Chat" or directly go to `/chat`
   - Grant camera and microphone permissions
   - Expected: Local video should be visible
   - Expected: "Share this link" message should appear
   - Copy the room URL

2. **Open Second Browser (Participant B)**
   - Paste the room URL from step 1
   - Grant camera and microphone permissions
   - Expected: Local video should be visible

3. **Verify Connection (Both Participants)**
   - **Participant A**: Should see Participant B's video and hear audio
   - **Participant B**: Should see Participant A's video and hear audio
   - Expected: "Connected!" status message appears
   - Expected: Share link section disappears

4. **Test Controls (Both Participants)**
   - Click "Mute" button
     - Expected: Other participant cannot hear audio
     - Expected: Button changes to "Unmute"
   - Click "Stop Video" button
     - Expected: Other participant sees black video
     - Expected: Button changes to "Start Video"
   - Click "Hang Up" button
     - Expected: Call ends and redirects to home page

### Key Fixes Implemented

#### Fix 1: Signal Broadcasting
**Problem**: Signals were broadcast to entire group including sender
**Solution**: Added `userId` field to exclude sender from receiving their own signals

**Files Changed**:
- `api/sendSignal/index.js` - Added `connectionId` validation and `userId` exclusion
- `chat/chat.js` - Pass `connectionId` when sending signals

#### Fix 2: User Join Notification
**Problem**: Second participant joining wasn't notified to first participant
**Solution**: Added `userJoined` notification when joining room

**Files Changed**:
- `api/joinRoom/index.js` - Added `signalRMessages` binding to notify group
- `api/joinRoom/function.json` - Added SignalR output binding

### Troubleshooting

**Issue**: Participants can't see each other
- Check browser console for errors
- Verify SignalR Service is in **Serverless** mode
- Verify both participants joined the same room (check URL hash)
- Check camera/microphone permissions

**Issue**: "Server returned handshake error"
- SignalR Service must be in **Serverless** mode (not Default)
- Go to Azure Portal → SignalR Service → Settings → Service Mode
- Change to "Serverless" and save

**Issue**: One-way video/audio
- Check firewall/NAT settings
- May need TURN server for restrictive networks
- Verify WebRTC ICE candidates are being exchanged (check console logs)

## Automated Testing (Future)

To implement automated testing:

1. Install testing framework (Jest, Mocha, etc.)
2. Add Azure Functions testing utilities
3. Create unit tests for:
   - `sendSignal` - Verify connectionId exclusion
   - `joinRoom` - Verify userJoined notification
   - Client-side WebRTC signaling flow

Example test structure:
```javascript
// tests/sendSignal.test.js
describe('sendSignal', () => {
  it('should exclude sender from signal broadcast', async () => {
    // Mock context and req
    // Call sendSignal function
    // Assert userId is set to connectionId
  });
});
```
