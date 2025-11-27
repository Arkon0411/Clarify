# Next.js Integration Guide for Agora Workshop Template

## Table of Contents
1. [Overview](#overview)
2. [Project Architecture](#project-architecture)
3. [Prerequisites](#prerequisites)
4. [Integration Steps](#integration-steps)
5. [Code Examples](#code-examples)
6. [API Routes Setup](#api-routes-setup)
7. [Environment Variables](#environment-variables)
8. [Component Structure](#component-structure)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide explains how to integrate the Agora Workshop Template into a Next.js application. The template provides:

- **Agora RTC Web SDK 4.x** for real-time video/audio communication
- **Agora Conversational AI** integration with:
  - LLM (Groq, OpenAI, AWS Bedrock)
  - TTS (Minimax)
  - Avatar (Akool)
- Express server endpoints for secure API key management
- Modern UI for video calling with AI agent

---

## Project Architecture

### Current Template Structure
```
Agora-Workshop-Template/
├── scripts/
│   ├── server.js          # Express server with API endpoints
│   └── pure.js            # SSO cleanup utility
├── src/
│   ├── assets/            # Static assets (logos, CSS, JS)
│   ├── common/            # Shared utilities and constants
│   ├── example/
│   │   └── basic/
│   │       └── basicVideoCall/  # Main video call example
│   ├── i18n/              # Internationalization
│   ├── index.html         # Setup page
│   └── index.js           # Main entry point
├── package.json
└── README.md
```

### Key Components

1. **Server Endpoints** (`scripts/server.js`):
   - `GET /config` - Returns safe client-side configuration
   - `POST /api/convo-ai/start` - Starts Agora Conversational AI agent
   - `POST /api/convo-ai/agents/:agentId/leave` - Stops the AI agent

2. **Client-Side Logic** (`src/example/basic/basicVideoCall/index.js`):
   - Agora RTC client creation and channel management
   - Local/remote track handling
   - Conversational AI agent integration

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- Next.js 13+ (App Router recommended)
- Agora account with:
  - App ID
  - RESTful API Key and Secret
  - Conversational AI Engine enabled
- Optional service accounts:
  - Groq API key (for LLM)
  - Minimax API key and Group ID (for TTS)
  - Akool API key (for Avatar)

---

## Integration Steps

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest agora-nextjs-app
cd agora-nextjs-app
```

### Step 2: Install Dependencies

```bash
npm install express
# or
yarn add express
```

**Note**: The Agora RTC SDK is loaded via CDN in the template. For Next.js, you can:
- Continue using CDN (via `next/script`)
- Install via npm: `npm install agora-rtc-sdk-ng`

### Step 3: Set Up Environment Variables

Create a `.env.local` file in your Next.js project root:

```env
# Agora Configuration
AGORA_APPID=your_agora_appid
AGORA_TOKEN=your_agora_token
AGORA_REST_KEY=your_agora_restful_key
AGORA_REST_SECRET=your_agora_restful_secret

# LLM Configuration (Optional)
GROQ_KEY=your_groq_key
OPENAI_KEY=your_openai_key
LLM_AWS_BEDROCK_KEY=your_aws_bedrock_key
LLM_AWS_BEDROCK_ACCESS_KEY=your_aws_access_key
LLM_AWS_BEDROCK_SECRET_KEY=your_aws_secret_key

# TTS Configuration (Optional)
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_minimax_groupid

# Avatar Configuration (Optional)
AVATAR_AKOOL_KEY=your_akool_key
```

### Step 4: Create API Routes

See [API Routes Setup](#api-routes-setup) section below.

---

## API Routes Setup

### Config Endpoint

Create `app/api/agora/config/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    AGORA_APPID: process.env.AGORA_APPID || null,
    AGORA_TOKEN: process.env.AGORA_TOKEN || null,
    LLM_AWS_BEDROCK_KEY: process.env.LLM_AWS_BEDROCK_KEY || null,
    LLM_AWS_BEDROCK_ACCESS_KEY: process.env.LLM_AWS_BEDROCK_ACCESS_KEY || null,
    LLM_AWS_BEDROCK_SECRET_KEY: process.env.LLM_AWS_BEDROCK_SECRET_KEY || null,
    OPENAI_KEY: process.env.OPENAI_KEY || null,
    GROQ_KEY: process.env.GROQ_KEY || null,
    TTS_MINIMAX_KEY: process.env.TTS_MINIMAX_KEY || null,
    TTS_MINIMAX_GROUPID: process.env.TTS_MINIMAX_GROUPID || null,
    AVATAR_AKOOL_KEY: process.env.AVATAR_AKOOL_KEY || null,
  });
}
```

### Convo AI Start Endpoint

Create `app/api/agora/convo-ai/start/route.ts`:

```typescript
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
      body: JSON.stringify(body || {}),
    });

    const data = await response.text();
    const status = response.status;

    try {
      return NextResponse.json(JSON.parse(data), { status });
    } catch (e) {
      return new NextResponse(data, { status });
    }
  } catch (err) {
    console.error('Proxy /api/convo-ai/start error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
```

### Convo AI Leave Endpoint

Create `app/api/agora/convo-ai/agents/[agentId]/leave/route.ts`:

```typescript
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
      return new NextResponse(data, { status });
    }
  } catch (err) {
    console.error('Proxy /api/convo-ai/leave error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
```

---

## Environment Variables

### Required Variables

```env
AGORA_APPID=your_app_id
AGORA_REST_KEY=your_rest_key
AGORA_REST_SECRET=your_rest_secret
```

### Optional Variables

```env
AGORA_TOKEN=your_token
GROQ_KEY=your_groq_key
OPENAI_KEY=your_openai_key
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_group_id
AVATAR_AKOOL_KEY=your_akool_key
```

**Security Note**: Never expose `AGORA_REST_KEY` and `AGORA_REST_SECRET` to the client. Always use them in API routes only.

---

## Best Practices

### 1. SDK Loading

**Option A: CDN (Current Template Approach)**
```tsx
<Script
  src="https://download.agora.io/sdk/release/AgoraRTC_N.js"
  strategy="beforeInteractive"
/>
```

**Option B: NPM Package**
```bash
npm install agora-rtc-sdk-ng
```
```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';
```

### 2. Error Handling

Always wrap Agora operations in try-catch blocks:

```typescript
try {
  await client.join(appId, channel, token, uid);
} catch (error) {
  console.error('Join channel failed:', error);
  // Handle error appropriately
}
```

### 3. Cleanup

Always clean up tracks and leave channels on component unmount:

```typescript
useEffect(() => {
  return () => {
    localTracks.videoTrack?.stop();
    localTracks.videoTrack?.close();
    localTracks.audioTrack?.stop();
    localTracks.audioTrack?.close();
    client?.leave();
  };
}, []);
```

---

## Troubleshooting

### Issue: SDK Not Loading

**Solution**: Ensure the Script component is loaded before using AgoraRTC.

### Issue: CORS Errors

**Solution**: Ensure API routes are properly configured and environment variables are set.

### Issue: Token Errors

**Solution**: 
- Verify token generation parameters match your configuration
- Check token expiration
- Ensure app certificate is properly configured

---

## Additional Resources

- [Agora RTC Web SDK Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web)
- [Agora Conversational AI Documentation](https://docs.agora.io/en/conversational-ai/get-started/quickstart)
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
