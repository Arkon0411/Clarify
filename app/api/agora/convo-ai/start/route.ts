import { NextRequest, NextResponse } from "next/server"
import { RtcTokenBuilder, RtcRole } from "agora-access-token"

export async function POST(request: NextRequest) {
  try {
    const { channel, agentRtcUid, remoteRtcUids, appId: clientAppId } = await request.json()

    // Get Agora credentials from environment variables
    const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID || clientAppId
    const apiKey = process.env.AGORA_REST_KEY
    const apiSecret = process.env.AGORA_REST_SECRET
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    // Get LLM and TTS credentials
    const groqKey = process.env.GROQ_KEY
    const ttsMinimaxKey = process.env.TTS_MINIMAX_KEY
    const ttsMinimaxGroupId = process.env.TTS_MINIMAX_GROUPID
    const avatarAkoolKey = process.env.AVATAR_AKOOL_KEY

    if (!appId || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            "Agora credentials not configured. Please set AGORA_APP_ID, AGORA_REST_KEY, and AGORA_REST_SECRET in your environment variables.",
        },
        { status: 500 },
      )
    }

    // Generate RTC tokens for both the agent and avatar
    // The agent (UID 10001) provides audio, the avatar (UID 10002) provides video
    let agentToken: string | null = null
    let avatarToken: string | null = null
    
    if (appCertificate) {
      try {
        const currentTimestamp = Math.floor(Date.now() / 1000)
        const privilegeExpiredTs = currentTimestamp + 3600 * 24 // 24 hours
        
        // Token for agent (audio) - UID 10001
        const agentUidNum = typeof agentRtcUid === 'string' ? parseInt(agentRtcUid, 10) : agentRtcUid
        agentToken = RtcTokenBuilder.buildTokenWithUid(
          appId,
          appCertificate,
          channel,
          agentUidNum,
          RtcRole.PUBLISHER,
          privilegeExpiredTs,
        )
        
        // Token for avatar (video) - UID 10002 (if avatar is enabled)
        if (avatarAkoolKey) {
          avatarToken = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channel,
            10002, // Avatar UID
            RtcRole.PUBLISHER,
            privilegeExpiredTs,
          )
        }
      } catch (tokenError) {
        return NextResponse.json(
          {
            error: "Failed to generate RTC tokens",
            message: tokenError instanceof Error ? tokenError.message : "Unknown token error",
          },
          { status: 500 },
        )
      }
    }

    // Build the request body for Agora API
    // Note: agent_rtc_uid and remote_rtc_uids must be strings, not numbers
    // The agent will automatically join the RTC channel specified in 'channel'
    const agoraRequestBody = {
      name: channel,
      properties: {
        channel: channel, // This is the RTC channel the agent will join
        agent_rtc_uid: String(agentRtcUid), // Agent's UID in the RTC channel (must be unique)
        remote_rtc_uids: remoteRtcUids.map((uid: string | number) => String(uid)), // Users to subscribe to
        token: agentToken || null, // Token is REQUIRED for the agent to join the RTC channel
        idle_timeout: 300, // 5 minutes
        advanced_features: {
          enable_aivad: true, // Intelligent interruption
          enable_mllm: false,
          enable_rtm: false,
        },
        asr: {
          language: "en-US",
          enable_transcription: true, // Enable transcription output
        },
        llm: {
          url: "https://api.groq.com/openai/v1/chat/completions",
          api_key: groqKey || "",
          system_messages: [
            {
              role: "system",
              content: "You are a helpful meeting assistant. You help facilitate meetings, take notes, and provide helpful insights. Be concise and professional.",
            },
          ],
          greeting_message: "Hello! I'm your AI meeting assistant. I'm here to help facilitate this meeting.",
          failure_message: "I'm experiencing some technical difficulties. Please continue without me.",
          params: {
            model: "llama-3.3-70b-versatile",
          },
        },
        tts: {
          vendor: "minimax",
          params: {
            url: "wss://api.minimax.io/ws/v1/t2a_v2",
            group_id: ttsMinimaxGroupId || "",
            key: ttsMinimaxKey || "",
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
          skip_patterns: [3, 4],
        },
        ...(avatarAkoolKey && {
          avatar: {
            vendor: "akool",
            enable: true,
            params: {
              api_key: avatarAkoolKey,
              agora_uid: "10002", // Avatar RTC UID - this will join as a separate participant with video
              agora_token: avatarToken || null, // REQUIRED: Token for avatar to join RTC channel
              avatar_id: "dvp_Sean_agora",
            },
          },
        }),
        parameters: {
          silence_config: {
            timeout_ms: 10000,
            action: "think",
            content: "continue conversation",
          },
        },
      },
    }

    // Construct the Agora Conversational AI API URL
    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/join`

    // Create Basic Auth header
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

    console.log("🚀 Starting AI agent to join RTC channel:", {
      url,
      appId,
      channel: channel, // This is the RTC channel name
      agentRtcUid: String(agentRtcUid), // Agent will join with this UID
      remoteRtcUids: remoteRtcUids.map(String), // Users already in channel
      hasToken: !!agentToken,
      requestBody: JSON.stringify(agoraRequestBody, null, 2),
    })
    console.log("📋 Key details:")
    console.log("   - Channel name:", channel)
    console.log("   - Agent RTC UID:", String(agentRtcUid))
    console.log("   - Agent will join as participant with UID:", String(agentRtcUid))
    console.log("   - Token provided:", !!agentToken)

    // Make request to Agora API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agoraRequestBody),
    })

    const data = await response.text()
    const status = response.status


    // If error, return detailed error info
    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(data)
      } catch {
        errorData = { error: data || `HTTP ${status}: ${response.statusText}` }
      }
      console.error("Agora API error:", errorData)
      return NextResponse.json(
        {
          error: errorData.error || errorData.message || `Agora API error: ${status}`,
          details: errorData,
          status,
        },
        { status },
      )
    }

    try {
      const jsonData = JSON.parse(data)
      return NextResponse.json(jsonData, { status })
    } catch (e) {
      return NextResponse.json({ message: data, raw: data }, { status })
    }
  } catch (error) {
    console.error("Convo AI start error:", error)
    return NextResponse.json(
      {
        error: "Failed to start AI agent",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

