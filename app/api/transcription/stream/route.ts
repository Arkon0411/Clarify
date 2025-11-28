import { NextRequest } from "next/server"

/**
 * Real-time Transcription API using AWS Transcribe
 * 
 * This endpoint receives audio chunks and returns transcription results.
 * For real-time streaming, we'll use AWS Transcribe Streaming API.
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get("audio") as Blob | null
    const userId = formData.get("userId") as string | null
    const languageCode = (formData.get("languageCode") as string) || "en-US"

    if (!audioBlob) {
      return Response.json({ error: "No audio data provided" }, { status: 400 })
    }

    // No size restrictions - send any audio data to Groq

    // Get the audio data - keep as ArrayBuffer to preserve format
    const audioArrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = Buffer.from(audioArrayBuffer)

    // Use Groq API for transcription (faster and cheaper than OpenAI)
    const groqKey = process.env.GROQ_KEY || process.env.GROQ_API_KEY
    if (groqKey) {
      try {
        // Determine audio format from blob
        const audioType = audioBlob.type || "audio/webm"
        // Groq supports: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
        // IMPORTANT: Groq seems to have issues with OGG, so prefer webm
        // Also, remove codecs from MIME type as Groq expects simple types
        let extension = "webm"
        let groqMimeType = "audio/webm" // Default to webm
        
        // Normalize MIME type - remove codecs parameter if present
        const normalizedType = audioType.split(";")[0].toLowerCase()
        
        if (normalizedType.includes("webm")) {
          extension = "webm"
          groqMimeType = "audio/webm"
        } else if (normalizedType.includes("ogg")) {
          // OGG often fails with Groq, but try it with standard MIME type
          extension = "ogg"
          groqMimeType = "audio/ogg"
          console.warn(`[Transcription] Using OGG format - if this fails, consider switching to webm`)
        } else if (normalizedType.includes("mp4") || normalizedType.includes("m4a")) {
          extension = "m4a"
          groqMimeType = "audio/m4a"
        } else if (normalizedType.includes("wav")) {
          extension = "wav"
          groqMimeType = "audio/wav"
        } else if (normalizedType.includes("mp3") || normalizedType.includes("mpeg") || normalizedType.includes("mpga")) {
          extension = "mp3"
          groqMimeType = "audio/mp3"
        } else if (normalizedType.includes("flac")) {
          extension = "flac"
          groqMimeType = "audio/flac"
        }
        
        console.log(`[Transcription] Audio format: originalType=${audioType}, normalizedType=${normalizedType}, extension=${extension}, size=${audioBuffer.length} bytes, groqMimeType=${groqMimeType}`)
        
        // Create FormData - use standard MIME types (Groq doesn't like codecs variants)
        const formData = new FormData()
        
        // Use standard MIME type without codecs - Groq expects simple types
        const standardMimeType = groqMimeType || `audio/${extension}`
        
        // Create Blob with standard MIME type
        const fileBlob = new Blob([audioArrayBuffer], {
          type: standardMimeType,
        })
        
        // Append as file - Groq expects multipart/form-data with a file field
        formData.append("file", fileBlob, `audio.${extension}`)
        formData.append("model", "whisper-large-v3")
        formData.append("language", languageCode.split("-")[0])
        formData.append("response_format", "json")

        console.log(`[Transcription] Sending audio to Groq: type=${audioType}, size=${audioBuffer.length} bytes, extension=${extension}`)

        // Groq uses OpenAI-compatible API endpoint
        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Groq transcription error:", errorText)
          throw new Error(`Groq API error: ${response.status} - ${errorText}`)
        }

        const result = await response.json()
        
        if (!result.text || result.text.trim().length === 0) {
          return Response.json({
            text: "",
            userId: userId || "unknown",
            language: languageCode,
            note: "No speech detected in audio chunk",
          })
        }

        return Response.json({
          text: result.text,
          userId: userId || "unknown",
          language: languageCode,
        })
      } catch (error) {
        console.error("Groq transcription failed:", error)
        
        // Check if it's a file format error - if so, return empty text instead of error
        // This allows the transcription to continue even if one chunk fails
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes("could not process file") || errorMessage.includes("invalid media file")) {
          console.warn(`[Transcription] Skipping invalid audio chunk (${audioBuffer.length} bytes) - continuing...`)
          return Response.json({
            text: "",
            userId: userId || "unknown",
            language: languageCode,
            note: "Audio chunk invalid, skipped",
          })
        }
        
        // For other errors, return error response
        return Response.json({
          error: "Transcription service temporarily unavailable",
          message: errorMessage,
        }, { status: 503 })
      }
    }

    // Fallback to OpenAI if Groq is not configured
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      try {
        // Determine audio format from blob
        const audioType = audioBlob.type || "audio/webm"
        const extension = audioType.includes("webm") ? "webm" : audioType.includes("ogg") ? "ogg" : "mp4"
        
        const formData = new FormData()
        formData.append("file", new Blob([audioBuffer], { type: audioType }), `audio.${extension}`)
        formData.append("model", "whisper-1")
        formData.append("language", languageCode.split("-")[0])
        formData.append("response_format", "json")

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("OpenAI transcription error:", errorText)
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
        }

        const result = await response.json()
        
        if (!result.text || result.text.trim().length === 0) {
          return Response.json({
            text: "",
            userId: userId || "unknown",
            language: languageCode,
            note: "No speech detected in audio chunk",
          })
        }

        return Response.json({
          text: result.text,
          userId: userId || "unknown",
          language: languageCode,
        })
      } catch (error) {
        console.error("OpenAI transcription failed:", error)
        // Return error but don't throw - allow fallback or graceful degradation
        return Response.json({
          error: "Transcription service temporarily unavailable",
          message: error instanceof Error ? error.message : "Unknown error",
        }, { status: 503 })
      }
    }

    // Option 2: Use AWS Transcribe (requires AWS SDK setup)
    // This is a placeholder - you'll need to implement AWS Transcribe Streaming
    // For now, return a mock response to show the structure
    
    return Response.json({
      error: "Transcription service not configured. Please set GROQ_KEY (or GROQ_API_KEY) or OPENAI_API_KEY.",
      note: "To enable transcription, set GROQ_KEY in your environment variables (recommended for faster transcription), or set OPENAI_API_KEY as a fallback.",
    }, { status: 503 })

  } catch (error) {
    console.error("Transcription API error:", error)
    return Response.json(
      {
        error: "Failed to process transcription",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

