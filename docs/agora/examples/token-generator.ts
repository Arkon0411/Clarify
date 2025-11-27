/**
 * Agora Token Generator Example
 * 
 * This file demonstrates how to generate Agora tokens programmatically.
 * Choose one of the methods below based on your needs.
 */

// ============================================================================
// Method 1: Using agora-access-token package (Recommended)
// ============================================================================

import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

interface TokenParams {
  appId: string;
  appCertificate: string;
  channelName: string;
  uid: number | string;
  role?: 'publisher' | 'subscriber';
  expirationTimeInSeconds?: number;
}

export function generateTokenWithPackage(params: TokenParams): string {
  const {
    appId,
    appCertificate,
    channelName,
    uid,
    role = 'publisher',
    expirationTimeInSeconds = 3600 * 24, // 24 hours
  } = params;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const rtcRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

  // For numeric UID
  if (typeof uid === 'number') {
    return RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpiredTs
    );
  }

  // For string UID
  return RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    channelName,
    uid,
    rtcRole,
    privilegeExpiredTs
  );
}

// ============================================================================
// Method 2: Using Agora REST API
// ============================================================================

export async function generateTokenViaAPI(params: {
  apiKey: string;
  apiSecret: string;
  appId: string;
  appCertificate: string;
  channelName: string;
  uid: number;
  expirationTimeInSeconds?: number;
}): Promise<string> {
  const {
    apiKey,
    apiSecret,
    appId,
    appCertificate,
    channelName,
    uid,
    expirationTimeInSeconds = 7200, // 2 hours
  } = params;

  const url = 'https://api.agora.io/v2/token/generate';
  const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appId,
      appCertificate,
      channelName,
      expire: expirationTimeInSeconds,
      src: 'web',
      types: [1, 2], // 1 = audio, 2 = video
      uid,
    }),
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(data.msg || 'Token generation failed');
  }

  return data.data.token;
}

// ============================================================================
// Method 3: Manual Token Generation (Advanced)
// ============================================================================

import crypto from 'crypto';

export function generateTokenManually(params: TokenParams): string {
  const {
    appId,
    appCertificate,
    channelName,
    uid,
    role = 'publisher',
    expirationTimeInSeconds = 3600 * 24,
  } = params;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Build token message
  const message = {
    app_id: appId,
    channel_name: channelName,
    uid: String(uid),
    privilege_expired_ts: privilegeExpiredTs,
    role: role === 'publisher' ? 1 : 0, // 1 = publisher, 0 = subscriber
  };

  const messageBuffer = Buffer.from(JSON.stringify(message));

  // Sign with app certificate using HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', appCertificate)
    .update(messageBuffer)
    .digest('hex');

  // Build final token
  const tokenData = {
    signature,
    message: messageBuffer.toString('base64'),
  };

  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

// ============================================================================
// Usage Examples
// ============================================================================

// Example 1: Generate token with package (Recommended)
export function example1() {
  const token = generateTokenWithPackage({
    appId: process.env.AGORA_APPID!,
    appCertificate: process.env.AGORA_APPCERTIFICATE!,
    channelName: '10000',
    uid: 10000,
    role: 'publisher',
    expirationTimeInSeconds: 3600, // 1 hour
  });

  console.log('Generated token:', token);
  return token;
}

// Example 2: Generate token via REST API
export async function example2() {
  try {
    const token = await generateTokenViaAPI({
      apiKey: process.env.AGORA_REST_KEY!,
      apiSecret: process.env.AGORA_REST_SECRET!,
      appId: process.env.AGORA_APPID!,
      appCertificate: process.env.AGORA_APPCERTIFICATE!,
      channelName: '10000',
      uid: 10000,
      expirationTimeInSeconds: 7200, // 2 hours
    });

    console.log('Generated token:', token);
    return token;
  } catch (error) {
    console.error('Token generation failed:', error);
    throw error;
  }
}

// Example 3: Generate token manually
export function example3() {
  const token = generateTokenManually({
    appId: process.env.AGORA_APPID!,
    appCertificate: process.env.AGORA_APPCERTIFICATE!,
    channelName: '10000',
    uid: 10000,
    role: 'publisher',
  });

  console.log('Generated token:', token);
  return token;
}

// ============================================================================
// Next.js API Route Example
// ============================================================================

/**
 * Use this in your Next.js API route: app/api/token/route.ts
 * 
 * import { generateTokenWithPackage } from '@/examples/token-generator';
 * 
 * export async function GET(request: NextRequest) {
 *   const { searchParams } = new URL(request.url);
 *   const channelName = searchParams.get('channel');
 *   const uid = searchParams.get('uid') || '0';
 * 
 *   const token = generateTokenWithPackage({
 *     appId: process.env.AGORA_APPID!,
 *     appCertificate: process.env.AGORA_APPCERTIFICATE!,
 *     channelName: channelName!,
 *     uid: parseInt(uid),
 *   });
 * 
 *   return NextResponse.json({ token });
 * }
 */

