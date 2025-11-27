import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const { agentId } = await params

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    // Get Agora credentials from environment variables
    const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID
    const apiKey = process.env.AGORA_REST_KEY
    const apiSecret = process.env.AGORA_REST_SECRET

    if (!appId || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            "Agora credentials not configured. Please set AGORA_APP_ID, AGORA_REST_KEY, and AGORA_REST_SECRET in your environment variables.",
        },
        { status: 500 },
      )
    }

    // Construct the Agora Conversational AI API URL
    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents/${agentId}`

    // Create Basic Auth header
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

    // Make request to Agora API
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.text()
    const status = response.status

    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(data)
      } catch {
        errorData = { error: data || `HTTP ${status}: ${response.statusText}` }
      }
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
    } catch {
      return NextResponse.json({ message: data, raw: data }, { status })
    }
  } catch (error) {
    console.error("Convo AI status check error:", error)
    return NextResponse.json(
      {
        error: "Failed to check AI agent status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

