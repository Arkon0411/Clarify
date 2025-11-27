import { NextRequest, NextResponse } from "next/server"
import { RtcTokenBuilder, RtcRole } from "agora-access-token"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters from query string
    const channelName = searchParams.get("channel")
    const uidParam = searchParams.get("uid")
    const roleParam = searchParams.get("role") || "publisher"
    const expirationParam = searchParams.get("expiration")

    // Validate required parameters
    if (!channelName) {
      return NextResponse.json(
        { error: "Channel name is required. Use ?channel=YOUR_CHANNEL_NAME" },
        { status: 400 },
      )
    }

    // Get credentials from environment variables
    const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId || !appCertificate) {
      return NextResponse.json(
        {
          error:
            "Agora credentials not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in your environment variables.",
        },
        { status: 500 },
      )
    }

    // Parse UID (default to 0 for auto-generation)
    const uid = uidParam ? parseInt(uidParam, 10) : 0
    if (isNaN(uid) && uidParam !== "0") {
      return NextResponse.json(
        { error: 'Invalid UID. Must be a number or "0" for auto-generation.' },
        { status: 400 },
      )
    }

    // Parse role
    const role = roleParam === "subscriber" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER

    // Parse expiration time (default: 24 hours)
    const expirationTimeInSeconds = expirationParam
      ? parseInt(expirationParam, 10)
      : 3600 * 24 // 24 hours

    if (isNaN(expirationTimeInSeconds) || expirationTimeInSeconds <= 0) {
      return NextResponse.json(
        { error: "Invalid expiration time. Must be a positive number of seconds." },
        { status: 400 },
      )
    }

    // Calculate expiration timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
    )

    // Return token with metadata
    return NextResponse.json({
      token,
      appId,
      channelName,
      uid,
      role: roleParam,
      expirationTimeInSeconds,
      expiresAt: new Date((currentTimestamp + expirationTimeInSeconds) * 1000).toISOString(),
    })
  } catch (error) {
    console.error("Token generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

