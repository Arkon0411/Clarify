/**
 * Next.js API Route for Agora Token Generation
 * 
 * Place this file at: app/api/token/route.ts
 * 
 * Install required package:
 * npm install agora-access-token
 */

import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters from query string
    const channelName = searchParams.get('channel');
    const uidParam = searchParams.get('uid');
    const roleParam = searchParams.get('role') || 'publisher';
    const expirationParam = searchParams.get('expiration');

    // Validate required parameters
    if (!channelName) {
      return NextResponse.json(
        { error: 'Channel name is required. Use ?channel=YOUR_CHANNEL_NAME' },
        { status: 400 }
      );
    }

    // Get credentials from environment variables
    const appId = process.env.AGORA_APPID;
    const appCertificate = process.env.AGORA_APPCERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json(
        { 
          error: 'Agora credentials not configured. Please set AGORA_APPID and AGORA_APPCERTIFICATE in your environment variables.' 
        },
        { status: 500 }
      );
    }

    // Parse UID (default to 0 for auto-generation)
    const uid = uidParam ? parseInt(uidParam, 10) : 0;
    if (isNaN(uid) && uidParam !== '0') {
      return NextResponse.json(
        { error: 'Invalid UID. Must be a number or "0" for auto-generation.' },
        { status: 400 }
      );
    }

    // Parse role
    const role = roleParam === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    // Parse expiration time (default: 24 hours)
    const expirationTimeInSeconds = expirationParam 
      ? parseInt(expirationParam, 10) 
      : 3600 * 24; // 24 hours

    if (isNaN(expirationTimeInSeconds) || expirationTimeInSeconds <= 0) {
      return NextResponse.json(
        { error: 'Invalid expiration time. Must be a positive number of seconds.' },
        { status: 400 }
      );
    }

    // Calculate expiration timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );

    // Return token with metadata
    return NextResponse.json({
      token,
      appId,
      channelName,
      uid,
      role: roleParam,
      expirationTimeInSeconds,
      expiresAt: new Date((currentTimestamp + expirationTimeInSeconds) * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate token',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Usage Examples:
 * 
 * 1. Basic usage (defaults: uid=0, role=publisher, expiration=24h):
 *    GET /api/token?channel=10000
 * 
 * 2. With specific UID:
 *    GET /api/token?channel=10000&uid=12345
 * 
 * 3. As subscriber:
 *    GET /api/token?channel=10000&uid=12345&role=subscriber
 * 
 * 4. With custom expiration (1 hour = 3600 seconds):
 *    GET /api/token?channel=10000&uid=12345&expiration=3600
 * 
 * 5. Complete example:
 *    GET /api/token?channel=my-channel&uid=10000&role=publisher&expiration=7200
 * 
 * Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "appId": "your_app_id",
 *   "channelName": "10000",
 *   "uid": 10000,
 *   "role": "publisher",
 *   "expirationTimeInSeconds": 86400,
 *   "expiresAt": "2024-01-02T12:00:00.000Z"
 * }
 */

