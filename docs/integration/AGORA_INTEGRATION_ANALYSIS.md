# Agora Workshop Template - Comprehensive Project Analysis

## Document Purpose
This document provides a comprehensive analysis of the Agora Workshop Template for integration into a Next.js application. It serves as technical documentation and context for AI-assisted development.

---

## 1. Project Overview

### 1.1 What is Agora Workshop Template?
A streamlined workshop template built on **Agora RTC Web SDK 4.x** that demonstrates:
- **Basic Video Call** functionality
- **Agora Conversational AI (Convo AI)** integration
- Simplified developer console for demos and workshops
- Real-time video/audio communication with AI agents

### 1.2 Core Technologies
- **Agora RTC SDK**: Real-time communication (video/audio)
- **Agora Conversational AI**: AI-powered voice agents with avatars
- **Express.js**: Simple static server with API proxy endpoints
- **Vanilla JavaScript/jQuery**: Frontend implementation
- **Bootstrap**: UI framework

### 1.3 Key Features
1. **RTC Video/Audio Communication**
   - Create Agora RTC client
   - Join channels
   - Publish local tracks (camera/microphone)
   - Subscribe to remote tracks
   - Device management (camera/mic switching)

2. **Conversational AI Integration**
   - Start/stop AI agents in channels
   - LLM integration (Groq, AWS Bedrock, OpenAI)
   - Text-to-Speech (TTS) via Minimax
   - Avatar rendering via Akool
   - Automatic Speech Recognition (ASR)
   - Intelligent interruption handling (AIVAD)

3. **Developer Console**
   - Step-by-step workflow UI
   - Configuration management
   - Real-time status feedback

---

## 2. Architecture & Project Structure

### 2.1 Directory Structure
```
Agora-Workshop-Template/
├── src/
│   ├── assets/              # Static assets (logos, CSS, JS vendors)
│   │   ├── agora-logo-en.png
│   │   ├── bootstrap.min.css
│   │   ├── jquery-3.4.1.min.js
│   │   └── favicon.ico
│   ├── common/              # Shared utilities
│   │   ├── common.css        # Global styles
│   │   ├── constant.js      # Configuration constants
│   │   ├── utils.js         # Helper functions
│   │   └── left-menu.js     # Navigation menu
│   ├── example/
│   │   └── basic/
│   │       └── basicVideoCall/
│   │           ├── index.html    # Main UI
│   │           └── index.js      # Core RTC + AI logic
│   ├── i18n/                # Internationalization
│   │   ├── en/index.json
│   │   ├── zh-CN/index.json
│   │   └── language.js
│   ├── index.html           # Setup/landing page
│   └── index.js             # Setup page logic
├── scripts/
│   ├── server.js            # Express server with API proxy
│   └── pure.js              # Alternative server
├── package.json
└── README.md
```

### 2.2 Architecture Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  AgoraRTC SDK (CDN)                              │   │
│  │  - Create Client                                 │   │
│  │  - Join Channel                                  │   │
│  │  - Publish/Subscribe Tracks                      │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Convo AI Integration                            │   │
│  │  - Start Agent (POST /api/convo-ai/start)        │   │
│  │  - Stop Agent (POST /api/convo-ai/agents/:id/leave)│ │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Express Server (Node.js)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Proxy Endpoints                             │   │
│  │  - GET /config (safe config exposure)            │   │
│  │  - POST /api/convo-ai/start                      │   │
│  │  - POST /api/convo-ai/agents/:id/leave           │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
┌─────────────────────────────────────────────────────────┐
│              Agora Cloud Services                       │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │  RTC Service     │  │  Conversational AI API   │     │
│  │  - Channels      │  │  - Agent Management      │     │
│  │  - Tokens        │  │  - LLM Integration       │     │
│  │  - Media Streams │  │  - TTS/Avatar Services   │     │
│  └──────────────────┘  └──────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Third-Party Services                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Groq    │   │ Minimax │  │  Akool   │               │
│  │  (LLM)   │   │  (TTS)  │  │ (Avatar) │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Core Components Analysis

### 3.1 Agora RTC Client Lifecycle

#### 3.1.1 Client Creation
```javascript
// Create Agora RTC client
client = AgoraRTC.createClient({
  mode: "rtc",      // Real-time communication mode
  codec: "vp8",     // Video codec
});
```

#### 3.1.2 Join Channel
```javascript
options.uid = await client.join(
  options.appid,      // Agora App ID
  options.channel,    // Channel name
  options.token || null,  // Optional token
  options.uid || null     // Optional user ID
);
```

#### 3.1.3 Create and Publish Local Tracks
```javascript
// Create local audio and video tracks
const tracks = await Promise.all([
  AgoraRTC.createMicrophoneAudioTrack({
    encoderConfig: "music_standard",
  }),
  AgoraRTC.createCameraVideoTrack(),
]);

localTracks.audioTrack = tracks[0];
localTracks.videoTrack = tracks[1];

// Play local video track
localTracks.videoTrack.play("local-player", {
  mirror: true,  // Mirror mode for self-view
});

// Publish tracks to channel
await client.publish(Object.values(localTracks));
```

#### 3.1.4 Subscribe to Remote Tracks
```javascript
// Event handlers
client.on("user-published", handleUserPublished);
client.on("user-unpublished", handleUserUnpublished);
client.on("user-left", handleUserLeft);

// Subscribe to remote user
await client.subscribe(user, mediaType);

// Play remote video
if (mediaType === "video") {
  user.videoTrack.play(`player-${uid}`);
}

// Play remote audio
if (mediaType === "audio") {
  user.audioTrack.play();
}
```

#### 3.1.5 Leave Channel
```javascript
// Stop all local tracks
for (trackName in localTracks) {
  var track = localTracks[trackName];
  if (track) {
    track.stop();
    track.close();
    localTracks[trackName] = undefined;
  }
}

// Leave channel
await client.leave();
```

### 3.2 Conversational AI Integration

#### 3.2.1 Start Convo AI Agent
```javascript
const requestData = {
  name: options.channel,  // Channel name
  properties: {
    channel: options.channel,
    agent_rtc_uid: "10001",  // AI agent user ID
    remote_rtc_uids: ["10000"],  // Users to subscribe to
    idle_timeout: 30,  // Idle timeout in seconds
    
    advanced_features: {
      enable_aivad: true,   // Intelligent interruption
      enable_mllm: false,   // Multimodal LLM
      enable_rtm: false,    // Signaling service
    },
    
    asr: {
      language: "en-US",  // ASR language
    },
    
    llm: {
      url: "https://api.groq.com/openai/v1/chat/completions",
      api_key: groq_Key,
      system_messages: [{
        role: "system",
        content: "You are a helpful chat bot...",
      }],
      greeting_message: "Hello, how are you?",
      failure_message: "Sorry, technical issues...",
      params: {
        model: "llama-3.3-70b-versatile"
      }
    },
    
    tts: {
      vendor: "minimax",
      params: {
        url: "wss://api.minimax.io/ws/v1/t2a_v2",
        group_id: tts_Minimax_GroupID,
        key: tts_Minimax_Key,
        model: "speech-2.6-turbo",
        voice_setting: {
          voice_id: "English_Lively_Male_11",
          speed: 1,
          vol: 1,
          pitch: 0,
          emotion: "happy",
        },
        audio_setting: {
          sample_rate: 16000,
        },
      },
      skip_patterns: [3, 4],  // Skip parentheses/brackets
    },
    
    avatar: {
      vendor: "akool",
      enable: true,
      params: {
        api_key: avatar_Akool_Key,
        agora_uid: "10002",  // Avatar RTC UID
        avatar_id: "dvp_Sean_agora",
      },
    },
    
    parameters: {
      silence_config: {
        timeout_ms: 10000,
        action: "think",
        content: "continue conversation"
      }
    }
  },
};

// Start via server proxy
const response = await fetch("/api/convo-ai/start", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(requestData),
});

const responseData = await response.json();
agoraConvoTaskID = responseData.agent_id;
```

#### 3.2.2 Stop Convo AI Agent
```javascript
const agentId = agoraConvoTaskID;

const res = await fetch(`/api/convo-ai/agents/${agentId}/leave`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
});

agoraConvoTaskID = "";
```

### 3.3 Server-Side API Proxy

#### 3.3.1 Configuration Endpoint
```javascript
// GET /config - Expose safe config to client
app.get("/config", (req, res) => {
  res.json({
    AGORA_APPID: process.env.AGORA_APPID || null,
    AGORA_TOKEN: process.env.AGORA_TOKEN || null,
    GROQ_KEY: process.env.GROQ_KEY || null,
    TTS_MINIMAX_KEY: process.env.TTS_MINIMAX_KEY || null,
    TTS_MINIMAX_GROUPID: process.env.TTS_MINIMAX_GROUPID || null,
    AVATAR_AKOOL_KEY: process.env.AVATAR_AKOOL_KEY || null
  });
});
```

#### 3.3.2 Start Convo AI Proxy
```javascript
// POST /api/convo-ai/start
app.post("/api/convo-ai/start", async (req, res) => {
  const appid = process.env.AGORA_APPID;
  const apiKey = process.env.AGORA_REST_KEY;
  const apiSecret = process.env.AGORA_REST_SECRET;
  
  const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/join`;
  const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body || {}),
  });
  
  const data = await response.text();
  const status = response.status;
  
  try {
    return res.status(status).json(JSON.parse(data));
  } catch (e) {
    return res.status(status).send(data);
  }
});
```

#### 3.3.3 Stop Convo AI Proxy
```javascript
// POST /api/convo-ai/agents/:agentId/leave
app.post("/api/convo-ai/agents/:agentId/leave", async (req, res) => {
  const agentId = req.params.agentId;
  const appid = process.env.AGORA_APPID;
  const apiKey = process.env.AGORA_REST_KEY;
  const apiSecret = process.env.AGORA_REST_SECRET;
  
  const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/agents/${agentId}/leave`;
  const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await response.text();
  const status = response.status;
  
  try {
    return res.status(status).json(JSON.parse(data));
  } catch (e) {
    return res.status(status).send(data);
  }
});
```

---

## 4. Environment Configuration

### 4.1 Required Environment Variables
```bash
# Agora Core
AGORA_APPID=your_agora_appid
AGORA_APPCERTIFICATE=your_agora_appcertificate  # Optional
AGORA_REST_KEY=your_agora_restfulkey
AGORA_REST_SECRET=your_agora_restfulsecret
AGORA_TOKEN=your_token  # Optional, can be generated

# LLM Provider (choose one)
GROQ_KEY=your_groq_key
# OR
OPENAI_KEY=your_openai_key
# OR
LLM_AWS_BEDROCK_KEY=your_bedrock_key
LLM_AWS_BEDROCK_ACCESS_KEY=your_access_key
LLM_AWS_BEDROCK_SECRET_KEY=your_secret_key

# TTS Provider
TTS_MINIMAX_KEY=your_tts_key
TTS_MINIMAX_GROUPID=your_tts_groupid

# Avatar Provider
AVATAR_AKOOL_KEY=your_akool_key
```

### 4.2 Agora Console Setup
1. Register at https://console.agora.io/
2. Create project with "Testing Mode: APP ID"
3. Enable Conversational AI Engine
4. Get APP ID
5. Generate temporary token for channel "10000"
6. Download RESTful API Key and Secret from Developer Toolkit

### 4.3 Third-Party Service Setup
- **Groq**: https://console.groq.com/ - Generate API key
- **Minimax**: https://www.minimax.io/ - Get API key and Group ID
- **Akool**: https://akool.com/ - Get API key and Avatar ID

---

## 5. Key Integration Patterns

### 5.1 Client-Side State Management
```javascript
// Global state variables
var client;                    // Agora RTC client
var localTracks = {            // Local media tracks
  videoTrack: null,
  audioTrack: null,
};
var remoteUsers = {};          // Remote users map
var agoraConvoTaskID = "";     // Active AI agent ID
var options = {};              // Configuration options
```

### 5.2 Event-Driven Architecture
```javascript
// RTC Event Handlers
client.on("user-published", handleUserPublished);
client.on("user-unpublished", handleUserUnpublished);
client.on("user-left", handleUserLeft);

// Device Change Handlers
AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
  // Handle mic plug/unplug
};

AgoraRTC.onCameraChanged = async (changedDevice) => {
  // Handle camera plug/unplug
};
```

### 5.3 Error Handling Patterns
```javascript
// Try-catch for async operations
try {
  await join();
  message.success("Join channel success!");
} catch (error) {
  if (error.code === "CAN_NOT_GET_GATEWAY_SERVER") {
    return message.error("Token parameter error...");
  }
  message.error(error.message);
  console.error(error);
}
```

### 5.4 Device Management
```javascript
// Get available devices
mics = await AgoraRTC.getMicrophones();
cams = await AgoraRTC.getCameras();

// Switch devices
await localTracks.audioTrack.setDevice(micDeviceId);
await localTracks.videoTrack.setDevice(camDeviceId);
```

---

## 6. Next.js Integration Strategy

### 6.1 Architecture Recommendations

#### 6.1.1 File Structure
```
frontend/
├── app/
│   ├── meetings/
│   │   ├── live/
│   │   │   └── page.tsx          # Live meeting page
│   │   └── page.tsx              # Meetings list
│   └── api/
│       ├── agora/
│       │   ├── config/
│       │   │   └── route.ts      # GET /api/agora/config
│       │   └── convo-ai/
│       │       ├── start/
│       │       │   └── route.ts  # POST /api/agora/convo-ai/start
│       │       └── agents/
│       │           └── [agentId]/
│       │               └── leave/
│       │                   └── route.ts
├── components/
│   ├── agora/
│   │   ├── AgoraRTCClient.tsx    # RTC client wrapper
│   │   ├── AgoraConvoAI.tsx      # Convo AI integration
│   │   ├── VideoPlayer.tsx        # Video player component
│   │   └── DeviceSelector.tsx    # Device selection
│   └── meetings/
│       └── MeetingLiveView.tsx    # Enhanced meeting view
├── hooks/
│   ├── useAgoraRTC.ts            # RTC hook
│   ├── useAgoraConvoAI.ts        # Convo AI hook
│   └── useMediaDevices.ts        # Device management hook
├── services/
│   ├── agora/
│   │   ├── agoraRTCService.ts    # RTC service
│   │   ├── agoraConvoAIService.ts # Convo AI service
│   │   └── agoraConfig.ts        # Configuration
│   └── api/
│       └── agoraAPI.ts           # API client
└── lib/
    └── agora/
        └── types.ts              # TypeScript types
```

### 6.2 React Hooks Implementation

#### 6.2.1 useAgoraRTC Hook
```typescript
// hooks/useAgoraRTC.ts
import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

interface UseAgoraRTCOptions {
  appId: string;
  channel: string;
  token?: string;
  uid?: string | number;
}

export function useAgoraRTC(options: UseAgoraRTCOptions) {
  const [client, setClient] = useState<any>(null);
  const [localTracks, setLocalTracks] = useState({
    videoTrack: null,
    audioTrack: null,
  });
  const [remoteUsers, setRemoteUsers] = useState<Record<string, any>>({});
  const [isJoined, setIsJoined] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Create client
  const createClient = () => {
    const rtcClient = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });
    setClient(rtcClient);
    return rtcClient;
  };

  // Join channel
  const join = async () => {
    if (!client) return;
    
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);

    const uid = await client.join(
      options.appId,
      options.channel,
      options.token || null,
      options.uid || null
    );
    
    setIsJoined(true);
    return uid;
  };

  // Create and publish tracks
  const publish = async () => {
    if (!client || !isJoined) return;

    const tracks = await Promise.all([
      AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "music_standard",
      }),
      AgoraRTC.createCameraVideoTrack(),
    ]);

    const [audioTrack, videoTrack] = tracks;
    setLocalTracks({ audioTrack, videoTrack });

    await client.publish([audioTrack, videoTrack]);
    setIsPublished(true);
  };

  // Leave channel
  const leave = async () => {
    if (!client) return;

    Object.values(localTracks).forEach((track) => {
      if (track) {
        track.stop();
        track.close();
      }
    });

    await client.leave();
    setIsJoined(false);
    setIsPublished(false);
    setLocalTracks({ videoTrack: null, audioTrack: null });
    setRemoteUsers({});
  };

  // Event handlers
  const handleUserPublished = (user: any, mediaType: string) => {
    setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
  };

  const handleUserUnpublished = (user: any, mediaType: string) => {
    if (mediaType === "video") {
      setRemoteUsers((prev) => {
        const updated = { ...prev };
        delete updated[user.uid];
        return updated;
      });
    }
  };

  const handleUserLeft = (user: any) => {
    setRemoteUsers((prev) => {
      const updated = { ...prev };
      delete updated[user.uid];
      return updated;
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (client) {
        leave();
      }
    };
  }, []);

  return {
    client,
    localTracks,
    remoteUsers,
    isJoined,
    isPublished,
    createClient,
    join,
    publish,
    leave,
  };
}
```

#### 6.2.2 useAgoraConvoAI Hook
```typescript
// hooks/useAgoraConvoAI.ts
import { useState } from 'react';

interface ConvoAIConfig {
  channel: string;
  agentRtcUid: string;
  remoteRtcUids: string[];
  llmConfig: {
    url: string;
    apiKey: string;
    model: string;
    systemMessages: Array<{ role: string; content: string }>;
  };
  ttsConfig: {
    vendor: string;
    params: any;
  };
  avatarConfig: {
    vendor: string;
    enable: boolean;
    params: any;
  };
}

export function useAgoraConvoAI() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const start = async (config: ConvoAIConfig) => {
    setIsStarting(true);
    try {
      const response = await fetch('/api/agora/convo-ai/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.channel,
          properties: {
            channel: config.channel,
            agent_rtc_uid: config.agentRtcUid,
            remote_rtc_uids: config.remoteRtcUids,
            llm: config.llmConfig,
            tts: config.ttsConfig,
            avatar: config.avatarConfig,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start Convo AI');
      }

      const data = await response.json();
      setAgentId(data.agent_id);
      return data.agent_id;
    } finally {
      setIsStarting(false);
    }
  };

  const stop = async () => {
    if (!agentId) return;

    setIsStopping(true);
    try {
      const response = await fetch(`/api/agora/convo-ai/agents/${agentId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to stop Convo AI');
      }

      setAgentId(null);
    } finally {
      setIsStopping(false);
    }
  };

  return {
    agentId,
    isStarting,
    isStopping,
    start,
    stop,
  };
}
```

### 6.3 Next.js API Routes

#### 6.3.1 Config Route
```typescript
// app/api/agora/config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    AGORA_APPID: process.env.AGORA_APPID || null,
    AGORA_TOKEN: process.env.AGORA_TOKEN || null,
    GROQ_KEY: process.env.GROQ_KEY || null,
    TTS_MINIMAX_KEY: process.env.TTS_MINIMAX_KEY || null,
    TTS_MINIMAX_GROUPID: process.env.TTS_MINIMAX_GROUPID || null,
    AVATAR_AKOOL_KEY: process.env.AVATAR_AKOOL_KEY || null,
  });
}
```

#### 6.3.2 Convo AI Start Route
```typescript
// app/api/agora/convo-ai/start/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;

    if (!appid || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing Agora credentials' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/join`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();
    const status = response.status;

    try {
      return NextResponse.json(JSON.parse(data), { status });
    } catch (e) {
      return NextResponse.json(data, { status });
    }
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
```

#### 6.3.3 Convo AI Leave Route
```typescript
// app/api/agora/convo-ai/agents/[agentId]/leave/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;

    if (!appid || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing Agora credentials' },
        { status: 500 }
      );
    }

    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/agents/${agentId}/leave`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
    const status = response.status;

    try {
      return NextResponse.json(JSON.parse(data), { status });
    } catch (e) {
      return NextResponse.json(data, { status });
    }
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
```

### 6.4 Component Integration Example

```typescript
// components/meetings/MeetingLiveView.tsx (Enhanced)
'use client';

import { useEffect, useRef } from 'react';
import { useAgoraRTC } from '@/hooks/useAgoraRTC';
import { useAgoraConvoAI } from '@/hooks/useAgoraConvoAI';
import { VideoPlayer } from '@/components/agora/VideoPlayer';

export function MeetingLiveView() {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const {
    client,
    localTracks,
    remoteUsers,
    isJoined,
    isPublished,
    createClient,
    join,
    publish,
    leave,
  } = useAgoraRTC({
    appId: process.env.NEXT_PUBLIC_AGORA_APPID!,
    channel: '10000',
    uid: 10000,
  });

  const { agentId, start: startConvoAI, stop: stopConvoAI } = useAgoraConvoAI();

  useEffect(() => {
    // Create client on mount
    createClient();
  }, []);

  useEffect(() => {
    // Play local video when track is created
    if (localTracks.videoTrack && localVideoRef.current) {
      localTracks.videoTrack.play(localVideoRef.current, { mirror: true });
    }
  }, [localTracks.videoTrack]);

  const handleJoin = async () => {
    await join();
    await publish();
  };

  const handleStartConvoAI = async () => {
    await startConvoAI({
      channel: '10000',
      agentRtcUid: '10001',
      remoteRtcUids: ['10000'],
      llmConfig: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.NEXT_PUBLIC_GROQ_KEY!,
        model: 'llama-3.3-70b-versatile',
        systemMessages: [{
          role: 'system',
          content: 'You are a helpful assistant.',
        }],
      },
      ttsConfig: {
        vendor: 'minimax',
        params: {
          // ... TTS config
        },
      },
      avatarConfig: {
        vendor: 'akool',
        enable: true,
        params: {
          // ... Avatar config
        },
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Videos */}
        {Object.values(remoteUsers).map((user) => (
          <VideoPlayer key={user.uid} user={user} />
        ))}
        
        {/* Local Video */}
        <div ref={localVideoRef} className="absolute bottom-4 right-4 w-64 h-48" />
      </div>

      {/* Controls */}
      <div className="p-4 border-t">
        <button onClick={handleJoin} disabled={isJoined}>
          Join Channel
        </button>
        <button onClick={handleStartConvoAI} disabled={!!agentId}>
          Start Convo AI
        </button>
        <button onClick={leave} disabled={!isJoined}>
          Leave
        </button>
      </div>
    </div>
  );
}
```

---

## 7. Dependencies & Installation

### 7.1 Required NPM Packages
```json
{
  "dependencies": {
    "agora-rtc-sdk-ng": "^4.x.x",  // Agora RTC Web SDK
    "next": "^14.x",
    "react": "^19.x",
    "react-dom": "^19.x"
  },
  "devDependencies": {
    "@types/node": "^22",
    "typescript": "^5"
  }
}
```

### 7.2 Installation Steps
```bash
# Install Agora RTC SDK
npm install agora-rtc-sdk-ng

# Or using yarn
yarn add agora-rtc-sdk-ng
```

### 7.3 CDN Alternative
```html
<!-- In HTML head -->
<script src="https://download.agora.io/sdk/release/AgoraRTC_N.js"></script>
```

---

## 8. Key Considerations for Next.js Migration

### 8.1 Client-Side Only Code
- Agora RTC SDK must run in browser (client-side only)
- Use `'use client'` directive in React components
- SDK cannot be imported in server components

### 8.2 Environment Variables
- Use `NEXT_PUBLIC_` prefix for client-accessible variables
- Keep secrets (REST_KEY, REST_SECRET) server-side only
- Expose safe config via API routes

### 8.3 State Management
- Consider Zustand or Context API for global RTC state
- Manage client, tracks, and remote users in React state
- Use refs for DOM elements (video containers)

### 8.4 Error Handling
- Implement comprehensive error boundaries
- Handle network failures gracefully
- Provide user feedback for all operations

### 8.5 Performance
- Lazy load Agora SDK (dynamic imports)
- Clean up tracks and clients on unmount
- Optimize re-renders with React.memo

### 8.6 TypeScript Support
- Install `@types/agora-rtc-sdk-ng` if available
- Create custom types for Convo AI responses
- Type all hooks and services

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Test hooks in isolation
- Mock Agora SDK methods
- Test API route handlers

### 9.2 Integration Tests
- Test RTC client lifecycle
- Test Convo AI start/stop flow
- Test device switching

### 9.3 E2E Tests
- Test full meeting flow
- Test multiple users
- Test AI agent interaction

---

## 10. Security Best Practices

### 10.1 Token Management
- Generate tokens server-side
- Implement token refresh mechanism
- Never expose REST API keys to client

### 10.2 API Security
- Validate all inputs
- Rate limit API endpoints
- Use HTTPS in production

### 10.3 Environment Variables
- Use `.env.local` for secrets
- Never commit secrets to git
- Rotate keys regularly

---

## 11. Troubleshooting Guide

### 11.1 Common Issues

#### Issue: Video doesn't display
- **Solution**: Check video container sizing and `object-fit: cover`
- **Solution**: Verify track is published and subscribed correctly

#### Issue: No remote video
- **Solution**: Confirm remote user is publishing
- **Solution**: Use "Subscribe & Play" after remote UID is available

#### Issue: Token errors
- **Solution**: Verify token parameters match configuration
- **Solution**: Check token expiration

#### Issue: Camera/microphone not working
- **Solution**: Allow browser permissions
- **Solution**: Check device selection and availability

### 11.2 Debug Tips
- Enable Agora log upload: `AgoraRTC.enableLogUpload()`
- Check browser console for errors
- Verify network requests in DevTools
- Test with Agora Console token generator

---

## 12. References & Documentation

### 12.1 Official Documentation
- **Agora RTC Web SDK**: https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web
- **Agora Conversational AI**: https://docs.agora.io/en/conversational-ai/get-started/quickstart
- **Agora Avatar (Akool)**: https://docs.agora.io/en/conversational-ai/models/avatar/akool

### 12.2 API References
- **Agora RTC API**: https://docs.agora.io/en/video-calling/overview/product-overview
- **Convo AI API**: https://api.agora.io/api/conversational-ai-agent/v2/docs

### 12.3 Third-Party Services
- **Groq**: https://console.groq.com/
- **Minimax TTS**: https://www.minimax.io/
- **Akool Avatar**: https://akool.com/

---

## 13. Migration Checklist

- [ ] Install Agora RTC SDK package
- [ ] Set up environment variables
- [ ] Create Next.js API routes for Convo AI
- [ ] Implement useAgoraRTC hook
- [ ] Implement useAgoraConvoAI hook
- [ ] Create VideoPlayer component
- [ ] Create DeviceSelector component
- [ ] Integrate into MeetingLiveView component
- [ ] Add error handling and loading states
- [ ] Test with multiple users
- [ ] Test AI agent functionality
- [ ] Optimize performance
- [ ] Add TypeScript types
- [ ] Write unit tests
- [ ] Deploy and test in production

---

## 14. Conclusion

This analysis provides a comprehensive foundation for integrating Agora RTC and Conversational AI into a Next.js application. The key is to:

1. **Separate concerns**: Keep RTC logic in hooks, API calls in services
2. **Leverage React patterns**: Use hooks, context, and component composition
3. **Maintain security**: Keep secrets server-side, expose safe config via API
4. **Handle errors gracefully**: Provide user feedback and recovery options
5. **Optimize performance**: Lazy load, clean up resources, minimize re-renders

The migration from vanilla JavaScript to React/Next.js will improve maintainability, type safety, and developer experience while preserving all functionality of the original template.

