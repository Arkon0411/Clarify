# Quick Start Guide - Agora Workshop Template to Next.js

## TL;DR - 5 Minute Setup

### 1. Create Next.js App
```bash
npx create-next-app@latest agora-nextjs-app
cd agora-nextjs-app
```

### 2. Install Dependencies
```bash
npm install express
```

### 3. Copy API Routes

Create these files:

**`app/api/agora/config/route.ts`**
```typescript
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

**`app/api/agora/convo-ai/start/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const appid = process.env.AGORA_APPID;
  const apiKey = process.env.AGORA_REST_KEY;
  const apiSecret = process.env.AGORA_REST_SECRET;

  if (!appid || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Missing Agora credentials' },
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

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

**`app/api/agora/convo-ai/agents/[agentId]/leave/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const appid = process.env.AGORA_APPID;
  const apiKey = process.env.AGORA_REST_KEY;
  const apiSecret = process.env.AGORA_REST_SECRET;

  const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/agents/${agentId}/leave`;
  const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

### 4. Set Environment Variables

Create `.env.local`:
```env
AGORA_APPID=your_app_id
AGORA_REST_KEY=your_rest_key
AGORA_REST_SECRET=your_rest_secret
AGORA_TOKEN=your_token
GROQ_KEY=your_groq_key
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_group_id
AVATAR_AKOOL_KEY=your_akool_key
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Key Differences from Template

| Template | Next.js |
|----------|---------|
| Express server (`scripts/server.js`) | Next.js API Routes (`app/api/`) |
| Static HTML files | React components (`app/*/page.tsx`) |
| CDN script tags | Next.js `Script` component |
| Global `window.AgoraRTC` | TypeScript declarations |
| jQuery/Bootstrap | React hooks + Tailwind/CSS |

---

## Essential Files to Port

1. ✅ **API Routes** → `app/api/agora/` (already done above)
2. ⚠️ **Client Logic** → Create video call component
3. ⚠️ **Utilities** → `lib/agora.ts`
4. ⚠️ **Constants** → `lib/constants.ts`
5. ⚠️ **Styles** → `app/globals.css`

---

## Next Steps

1. Read the full [NEXTJS_INTEGRATION_GUIDE.md](./NEXTJS_INTEGRATION_GUIDE.md)
2. Integrate Agora video calling into the `/meetings/live` page
3. Add proper TypeScript types
4. Implement error handling
5. Add cleanup logic

---

## Common Issues

**SDK not loading?** → Wait for `onLoad` callback before using `window.AgoraRTC`

**CORS errors?** → Check API routes are in `app/api/agora/` directory

**Token errors?** → Verify environment variables are set correctly

**Video not showing?** → Check browser permissions and ref attachments
