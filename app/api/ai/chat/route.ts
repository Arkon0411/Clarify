import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Hard-coded API key
    const apiKey = "";

    const prompt = `You are a helpful AI assistant for employees communicating with their managers. 
Your role is to:
1. Help employees articulate their requests professionally
2. Provide suggestions for time-off requests, resource needs, blockers, and questions
3. Draft professional messages when requested
4. Be concise and helpful

Current user message: ${message}`;

    // Call Gemini API directly using REST with v1 endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return NextResponse.json(
        { error: "Failed to get AI response", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here to help. Could you provide more details?";

    let suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("time off") ||
      lowerMessage.includes("vacation") ||
      lowerMessage.includes("pto")
    ) {
      suggestions = [
        "Yes, draft the request",
        "I'll provide more details",
        "Cancel request",
      ];
    } else if (
      lowerMessage.includes("blocker") ||
      lowerMessage.includes("stuck") ||
      lowerMessage.includes("issue")
    ) {
      suggestions = ["It's urgent", "I can wait", "Provide details now"];
    } else if (
      lowerMessage.includes("resource") ||
      lowerMessage.includes("tool")
    ) {
      suggestions = [
        "Draft the request",
        "Add more context",
        "See similar requests",
      ];
    } else {
      suggestions = [
        "Request time off",
        "Report blocker",
        "Request resources",
        "Ask question",
      ];
    }

    return NextResponse.json({
      response: aiResponse,
      suggestions,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
