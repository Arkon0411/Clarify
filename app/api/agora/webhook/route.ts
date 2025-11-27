import { NextRequest, NextResponse } from "next/server";
import { createTranscript } from "@/lib/database-operations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Agora sends different event types
    const { eventType, payload } = body;

    console.log("Agora webhook received:", { eventType, payload });

    switch (eventType) {
      case "transcription":
        return await handleTranscription(payload);
      
      case "channel_user_joined":
        console.log("User joined channel:", payload);
        return NextResponse.json({ success: true });
      
      case "channel_user_left":
        console.log("User left channel:", payload);
        return NextResponse.json({ success: true });
      
      default:
        console.log("Unknown event type:", eventType);
        return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleTranscription(payload: Record<string, unknown>) {
  try {
    const channelName = payload.channelName as string;
    const uid = payload.uid as number | string;
    const userName = payload.userName as string | undefined;
    const text = payload.text as string;
    const confidence = payload.confidence as number | undefined;
    const timestamp = payload.timestamp as string | undefined;

    // Extract meetingId from channelName or lookup from database
    // For now, we'll use channelName as a reference
    // In production, you'd query Meeting table by channelName
    const meetingId = (payload.meetingId as string) || channelName;

    // Store transcript in database
    await createTranscript({
      meetingId,
      userId: String(uid),
      userName: userName || `User ${uid}`,
      text,
      timestamp: timestamp || new Date().toISOString(),
      confidence: confidence || 1.0,
      processed: false, // Will be processed by AI
    });

    // Trigger AI analysis asynchronously (non-blocking)
    triggerAIAnalysis(meetingId, text).catch((err) =>
      console.error("AI analysis error:", err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Transcription handling error:", error);
    throw error;
  }
}

// Trigger AI analysis without blocking the webhook response
async function triggerAIAnalysis(meetingId: string, text: string) {
  try {
    // Call AI analysis endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai/analyze-transcript`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, text }),
      }
    );

    if (!response.ok) {
      console.error("AI analysis request failed:", await response.text());
    }
  } catch (error) {
    console.error("Failed to trigger AI analysis:", error);
  }
}

// Verify Agora webhook signature (optional but recommended for production)
// function verifyAgoraSignature(request: NextRequest): boolean {
//   // Implement signature verification based on Agora documentation
//   // For now, return true for development
//   return true;
// }
