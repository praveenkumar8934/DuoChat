# Real-Time Voice and Video Calling System (LiveKit + WebRTC)

DuoChat features an end-to-end encrypted, low-latency WebRTC voice and video calling architecture designed specifically for private couples communication.

---

## 1. Architectural Overview

The calling system integrates three coordinated layers:

1. **Signaling & Incoming Call Orchestration (Supabase Realtime)**:
   - When a user starts a call, a signaling invite is transmitted over the recipient's dedicated private broadcast channel (`user-notifications:${recipientUserId}`).
   - Handles real-time states: `incoming_ringing`, `outgoing_ringing`, `call-accepted`, `call-declined`, `call-cancelled`, `call-busy`, and `call-ended`.
   - Zero-latency Web Audio API synthesizer generates romantic soft harmonic chimes for ringing and call status without external audio dependencies.

2. **Secure Server-Side Token Generation (`/api/calls/token`)**:
   - LiveKit API secrets are kept strictly server-side and never exposed to the client.
   - Verifies the user's Supabase session and enforces conversation membership before issuing tokens.
   - Derives participant identities authoritatively from the server session (not client-supplied input).
   - Issues short-lived, room-scoped JWT access tokens (`duochat_${conversationId}`) with 15-minute TTL.

3. **High-Fidelity Media Streaming (LiveKit Client & Server SDKs)**:
   - Powered by `livekit-client`, `livekit-server-sdk`, and `@livekit/components-react`.
   - Adaptive streaming with dynacast for automatic network bandwidth adaptation.
   - Live local picture-in-picture preview, remote video track rendering, mic mute/unmute, camera toggle, mobile camera switching, and fullscreen mode.

4. **Database & Call History (`public.calls`)**:
   - Persists call metadata (initiator, conversation ID, call type, start/end timestamps, final status, duration).
   - Protected by Row Level Security (RLS) ensuring only conversation participants can view or query call logs.

---

## 2. Configuration & Environment Variables

Add the following variables to `.env.local`:

```bash
# ====================================================================
# LIVEKIT WEBRTC CALLING CONFIGURATION
# ====================================================================

# 1. Obtain from https://cloud.livekit.io (Free tier available)
# WebSocket URL for client WebRTC connectivity:
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# 2. Server credentials for minting secure participant tokens:
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
```

> [!IMPORTANT]
> Never prefix `LIVEKIT_API_KEY` or `LIVEKIT_API_SECRET` with `NEXT_PUBLIC_`. They must remain strictly server-side secrets.

---

## 3. Database Migration

The calls schema and RLS policies are located at:
[`supabase/migrations/20261015000003_calls_and_call_history.sql`](file:///c:/Users/pk595/Desktop/Online%20Chat/supabase/migrations/20261015000003_calls_and_call_history.sql)

To apply the migration in Supabase:
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the SQL script from `20261015000003_calls_and_call_history.sql`.
3. The `calls` table and its 3 RLS policies will be created automatically.

---

## 4. Browser & Media Requirements

- **HTTPS Requirement**: Browsers enforce that WebRTC media access (`navigator.mediaDevices.getUserMedia`) is only available on `localhost` or over secure `https://` domains.
- **Microphone & Camera Permissions**: The browser will prompt the user to allow camera and microphone access on the first call attempt. If denied, DuoChat displays a friendly alert banner explaining how to grant permissions in browser settings.
- **Mobile Camera Flipping**: Devices with multiple cameras (such as front/back cameras on iOS and Android) can flip active video inputs using the camera switch button.
- **Audio Output Selection**: Switching speaker/earpiece devices is supported on Chromium-based browsers via `setSinkId` (note that Safari/WebKit on iOS manages audio routing via system-level control center).
- **Firewall & NAT Traversal**: LiveKit Cloud automatically provisions global STUN and TURN relays over UDP/TCP/TLS, allowing calls to connect across restrictive home routers, NATs, and mobile carrier networks.
