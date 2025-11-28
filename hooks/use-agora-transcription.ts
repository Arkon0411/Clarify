"use client"

/**
 * Agora Real-Time Transcription Hook
 * 
 * This hook handles real-time transcription data from Agora meetings.
 * 
 * Setup Requirements:
 * 1. Enable Real-Time STT (Speech-to-Text) in your Agora project
 * 2. Start transcription service via REST API or Agora Console
 * 3. Transcription data will be received via stream-message events
 * 
 * Supported Formats:
 * - Agora Real-Time STT format
 * - Conversational AI transcript format
 * - Custom stream message formats
 * 
 * The hook automatically:
 * - Listens for stream-message events from the Agora client
 * - Processes interim and final transcription results
 * - Maps speaker UIDs to display names
 * - Formats timestamps relative to meeting start
 */

import { useState, useEffect, useRef, useCallback } from "react"
import type { IAgoraRTCClient, UID } from "agora-rtc-sdk-ng"

export interface TranscriptSegment {
  id: string
  speakerUid: string | number
  displayName: string
  timestamp: string // e.g., "00:00:15" relative to meeting start
  text: string
  isFinal: boolean // true for final results, false for interim
}

interface UseAgoraTranscriptionOptions {
  client: IAgoraRTCClient | null
  meetingStartTime: number // Timestamp when meeting started
  uidToNameMap: Map<UID, string> // Map UID to display name
  localUid: UID // Current user's UID
  localUserName?: string // Current user's display name
}

export function useAgoraTranscription({
  client,
  meetingStartTime,
  uidToNameMap,
  localUid,
  localUserName = "You",
}: UseAgoraTranscriptionOptions) {
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptSegment[]>([])
  const segmentIdCounter = useRef(0)
  const interimSegmentsRef = useRef<Map<UID, TranscriptSegment>>(new Map())

  // Generate unique ID for transcript segments
  const generateSegmentId = useCallback(() => {
    segmentIdCounter.current += 1
    return `transcript-${Date.now()}-${segmentIdCounter.current}`
  }, [])

  // Format timestamp relative to meeting start
  const formatTimestamp = useCallback((elapsedSeconds: number) => {
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const seconds = Math.floor(elapsedSeconds % 60)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [])

  // Get display name for a UID
  const getDisplayName = useCallback(
    (uid: UID): string => {
      if (uid === localUid) {
        return localUserName
      }
      return uidToNameMap.get(uid) || `User ${uid}`
    },
    [uidToNameMap, localUid, localUserName],
  )

  // Process transcription data
  const processTranscriptionData = useCallback(
    (data: {
      uid: UID
      text: string
      isFinal?: boolean
      words?: Array<{ word: string; start: number; end: number }>
    }) => {
      const elapsedSeconds = Math.floor((Date.now() - meetingStartTime) / 1000)
      const timestamp = formatTimestamp(elapsedSeconds)
      const displayName = getDisplayName(data.uid)
      const isFinal = data.isFinal ?? true

      if (isFinal) {
        // Final result - commit the segment
        const segment: TranscriptSegment = {
          id: generateSegmentId(),
          speakerUid: data.uid,
          displayName,
          timestamp,
          text: data.text,
          isFinal: true,
        }

        // Remove interim segment if exists
        interimSegmentsRef.current.delete(data.uid)

        setTranscriptHistory((prev) => [...prev, segment])
      } else {
        // Interim result - update or create interim segment
        const existingInterim = interimSegmentsRef.current.get(data.uid)
        if (existingInterim) {
          // Update existing interim segment
          setTranscriptHistory((prev) =>
            prev.map((seg) =>
              seg.id === existingInterim.id
                ? {
                    ...seg,
                    text: data.text,
                    timestamp: formatTimestamp(elapsedSeconds),
                  }
                : seg,
            ),
          )
          interimSegmentsRef.current.set(data.uid, {
            ...existingInterim,
            text: data.text,
            timestamp: formatTimestamp(elapsedSeconds),
          })
        } else {
          // Create new interim segment
          const segment: TranscriptSegment = {
            id: generateSegmentId(),
            speakerUid: data.uid,
            displayName,
            timestamp,
            text: data.text,
            isFinal: false,
          }
          interimSegmentsRef.current.set(data.uid, segment)
          setTranscriptHistory((prev) => [...prev, segment])
        }
      }
    },
    [meetingStartTime, formatTimestamp, getDisplayName, generateSegmentId],
  )

  // Helper function to check if text looks like actual speech transcription
  // Balanced filtering - block obvious junk but allow legitimate transcription
  const isLikelyTranscription = useCallback((text: string): boolean => {
    const trimmed = text.trim()
    
    // Must have reasonable length
    if (trimmed.length < 2) {
      console.debug("[Transcription] Filtered: Too short")
      return false
    }
    
    // STRICT: Filter out Base64-like strings (very long alphanumeric strings)
    if (/^[A-Za-z0-9+/=]{40,}$/.test(trimmed)) {
      console.log("[Transcription] ❌ Filtered: Base64-like string", trimmed.substring(0, 50))
      return false
    }
    
    // STRICT: Filter out control/data patterns like "4e7d34a5|1|1|" or "d314a3e1|1|2|"
    if (/^[a-f0-9]+\|[0-9]+\|[0-9]+\|?$/i.test(trimmed)) {
      console.log("[Transcription] ❌ Filtered: Control pattern", trimmed)
      return false
    }
    
    // STRICT: Filter out pure hex strings
    if (/^[0-9a-f]+$/i.test(trimmed) && trimmed.length > 15) {
      console.log("[Transcription] ❌ Filtered: Pure hex string", trimmed.substring(0, 30))
      return false
    }
    
    // If it's JSON, let JSON parsing handle it
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      console.log("[Transcription] ✅ Allowing JSON through for parsing")
      return true
    }
    
    // For plain text, be more lenient but still check basics
    // Must have some letters (not just numbers/symbols)
    const hasLetters = /[a-zA-Z]/.test(trimmed)
    if (!hasLetters && trimmed.length < 5) {
      console.debug("[Transcription] Filtered: No letters and too short")
      return false
    }
    
    // If it has letters and reasonable length, allow it
    // (We'll validate more strictly in extractTranscriptionText)
    if (hasLetters && trimmed.length >= 3) {
      console.log("[Transcription] ✅ Allowing text through:", trimmed.substring(0, 50))
      return true
    }
    
    console.debug("[Transcription] Filtered: Doesn't meet basic criteria")
    return false
  }, [])

  // Set up stream message event listener
  useEffect(() => {
    if (!client) {
      console.warn("[Transcription] No Agora client available")
      return
    }

    console.log("[Transcription] Setting up stream message listener...")

    const handleStreamMessage = async (
      uid: UID,
      data: Uint8Array | string | object,
      streamId: number,
    ) => {
      console.log("[Transcription] 🔔 Stream message event triggered!", { uid, streamId, dataType: typeof data, data })
      try {
        // Agora sends transcription data via stream messages
        // The data format depends on the transcription service being used
        let parsedData: any = null
        let rawText: string = ""

        // Convert data to string first
        if (typeof data === "string") {
          rawText = data
        } else if (data instanceof Uint8Array) {
          // Convert Uint8Array to string
          const decoder = new TextDecoder()
          rawText = decoder.decode(data)
        } else if (typeof data === "object" && data !== null) {
          // Handle object data - might be a message object
          // Try to extract text or stringify it
          if ("text" in data && typeof (data as any).text === "string") {
            rawText = (data as any).text
          } else if ("message" in data && typeof (data as any).message === "string") {
            rawText = (data as any).message
          } else if ("data" in data) {
            // Might have a data field
            const dataField = (data as any).data
            if (typeof dataField === "string") {
              rawText = dataField
            } else {
              rawText = JSON.stringify(data)
            }
          } else {
            // Stringify the object to see if it contains transcription
            rawText = JSON.stringify(data)
          }
        } else {
          // Skip other data types
          console.debug("[Transcription] Skipping unsupported data type:", typeof data)
          return
        }

        // Validate that we have text to parse
        if (!rawText || rawText.trim().length === 0) {
          console.debug("[Transcription] Empty data received")
          return
        }

        // EARLY FILTERING: Block obvious non-transcription data immediately
        const trimmed = rawText.trim()
        
        // Check if message contains control pattern + Base64 (like "2e93eb8c|1|1|eyJvYmplY3QiOiAibWVzc2FnZS5zdGF0ZSIsI")
        // Try to extract and decode the Base64 part
        const controlPatternMatch = trimmed.match(/^([a-f0-9]+\|[0-9]+\|[0-9]+\|)(.+)$/i)
        if (controlPatternMatch) {
          const base64Part = controlPatternMatch[2]
          console.log("[Transcription] Found control pattern + Base64, attempting to decode:", {
            control: controlPatternMatch[1],
            base64Preview: base64Part.substring(0, 50),
          })
          
          // Try to decode the Base64 part
          try {
            const decoded = atob(base64Part)
            console.log("[Transcription] Decoded Base64:", decoded.substring(0, 200))
            
            // Try to parse as JSON
            if (decoded.startsWith("{") || decoded.startsWith("[")) {
              const decodedJson = JSON.parse(decoded)
              console.log("[Transcription] Decoded JSON:", decodedJson)
              
              // Check if it contains transcription data
              // Look for various transcription-related fields
              const transcriptionFields = [
                decodedJson.text,
                decodedJson.transcript,
                decodedJson.content,
                decodedJson.message?.text,
                decodedJson.message?.content,
                decodedJson.data?.text,
                decodedJson.data?.transcript,
              ].filter(Boolean)
              
              if (transcriptionFields.length > 0) {
                const transcriptionText = transcriptionFields[0]
                if (typeof transcriptionText === "string" && transcriptionText.trim().length > 0 && isLikelyTranscription(transcriptionText)) {
                  console.log("[Transcription] ✅ Found transcription in decoded message:", transcriptionText.substring(0, 50))
                  processTranscriptionData({
                    uid,
                    text: transcriptionText.trim(),
                    isFinal: true,
                  })
                  return
                }
              }
              
              // Check if it's a state message that might have transcription in nested fields
              if (decodedJson.object === "message.state" || decodedJson.object === "assistant.transcript" || decodedJson.object === "user.transcript") {
                console.log("[Transcription] Found state/transcript object, checking for transcription...", {
                  object: decodedJson.object,
                  keys: Object.keys(decodedJson),
                })
                
                // Check nested structures
                if (decodedJson.message && typeof decodedJson.message === "object") {
                  const msgText = decodedJson.message.text || decodedJson.message.content
                  if (msgText && typeof msgText === "string" && msgText.trim().length > 0 && isLikelyTranscription(msgText)) {
                    console.log("[Transcription] ✅ Found transcription in nested message:", msgText.substring(0, 50))
                    processTranscriptionData({
                      uid,
                      text: msgText.trim(),
                      isFinal: true,
                    })
                    return
                  }
                }
                
                // Check if it's a transcript object - might have transcription in different structure
                if (decodedJson.object === "user.transcript" || decodedJson.object === "assistant.transcript") {
                  // Look for transcription in various possible locations
                  const possibleText = 
                    decodedJson.text || 
                    decodedJson.transcript || 
                    decodedJson.content ||
                    decodedJson.data?.text ||
                    decodedJson.data?.transcript
                  
                  if (possibleText && typeof possibleText === "string" && possibleText.trim().length > 0) {
                    console.log("[Transcription] ✅ Found transcription in transcript object:", possibleText.substring(0, 50))
                    processTranscriptionData({
                      uid,
                      text: possibleText.trim(),
                      isFinal: true,
                    })
                    return
                  }
                }
                
                // If it's just a state message without transcription, skip it
                console.debug("[Transcription] State message without transcription, skipping")
                return
              }
              
              // Use the decoded JSON for further processing
              parsedData = decodedJson
              rawText = decoded // Update rawText for consistency
            } else {
              // Decoded but not JSON - might be plain text transcription
              if (isLikelyTranscription(decoded)) {
                console.log("[Transcription] ✅ Decoded Base64 contains transcription:", decoded.substring(0, 50))
                processTranscriptionData({
                  uid,
                  text: decoded,
                  isFinal: true,
                })
                return
              }
            }
          } catch (decodeError) {
            console.debug("[Transcription] Failed to decode Base64:", decodeError)
            // Continue with normal processing
          }
        }
        
        // Filter out pure control patterns (without Base64)
        if (/^[a-f0-9]+\|[0-9]+\|[0-9]+\|?$/i.test(trimmed)) {
          console.debug("[Transcription] ❌ Early filter: Pure control pattern", trimmed)
          return
        }
        
        // Filter out pure Base64 strings (metadata/state messages) - but we already tried to decode above
        if (/^[A-Za-z0-9+/=]{30,}$/.test(trimmed) && !parsedData) {
          console.debug("[Transcription] ❌ Early filter: Pure Base64 string", trimmed.substring(0, 50))
          return
        }
        
        // Check if message contains newlines - might be multiple messages
        if (rawText.includes("\n")) {
          const lines = rawText.split("\n").filter(line => line.trim().length > 0)
          // If all lines are control patterns or Base64, skip entirely
          const allInvalid = lines.every(line => {
            const trimmedLine = line.trim()
            return /^[a-f0-9]+\|[0-9]+\|[0-9]+\|?$/i.test(trimmedLine) || 
                   /^[A-Za-z0-9+/=]{30,}$/.test(trimmedLine)
          })
          if (allInvalid) {
            console.debug("[Transcription] ❌ Early filter: All lines are invalid patterns")
            return
          }
        }
        
        // If we already parsed data from Base64 decoding above, skip to processing
        if (parsedData) {
          // Will be processed below
        }

        // Log stream messages that passed early filtering
        console.log("[Transcription] Stream message received (passed early filter):", {
          uid,
          streamId,
          dataLength: rawText.length,
          preview: rawText.substring(0, 100),
          isJSON: trimmed.startsWith("{") || trimmed.startsWith("["),
        })

        // Try to parse as JSON, but handle cases where it's not JSON
        try {
          // Check if it looks like JSON (starts with { or [)
          const trimmed = rawText.trim()
          if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            parsedData = JSON.parse(rawText)
          } else {
            // Check if it's Base64 encoded JSON - try to decode it
            if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 20) {
              try {
                const decoded = atob(trimmed)
                if (decoded.startsWith("{") || decoded.startsWith("[")) {
                  parsedData = JSON.parse(decoded)
                  console.debug("[Transcription] Decoded Base64 JSON")
                }
              } catch (e) {
                // Not Base64 JSON, continue
              }
            }
            
            // If we didn't decode Base64, check if it's plain text transcription
            if (!parsedData) {
              if (isLikelyTranscription(rawText)) {
                console.debug("[Transcription] Processing plain text transcription:", rawText.substring(0, 100))
                processTranscriptionData({
                  uid,
                  text: rawText,
                  isFinal: true,
                })
              } else {
                // Skip non-transcription data (binary, control messages, etc.)
                console.debug("[Transcription] Skipping non-transcription data:", rawText.substring(0, 50))
              }
              return
            }
          }
        } catch (parseError) {
          // Not valid JSON - check if it's actual readable transcription text
          if (isLikelyTranscription(rawText)) {
            console.debug("[Transcription] Processing plain text transcription (non-JSON):", rawText.substring(0, 100))
            processTranscriptionData({
              uid,
              text: rawText,
              isFinal: true,
            })
          } else {
            // Skip binary/control data
            console.debug("[Transcription] Skipping non-transcription data:", rawText.substring(0, 50))
          }
          return
        }

        // If we successfully parsed JSON, process it
        if (!parsedData || typeof parsedData !== "object") {
          console.debug("[Transcription] Parsed data is not an object:", typeof parsedData)
          return
        }

        // Helper function to extract and validate transcription text from parsed data
        const extractTranscriptionText = (data: any): string | null => {
          console.log("[Transcription] Extracting text from:", {
            keys: Object.keys(data),
            object: data.object,
            type: data.type,
          })
          
          // Skip if this looks like metadata/state messages
          if (data.object === "message.state" || 
              data.object === "assistant.transcript" ||
              data.object === "user.transcript" ||
              data.type === "metadata") {
            console.log("[Transcription] ❌ Skipping metadata/state message")
            return null
          }
          
          // Try different possible fields
          const possibleFields = [
            { field: data.text, name: "text" },
            { field: data.transcript, name: "transcript" },
            { field: data.content, name: "content" },
            { field: data.speech, name: "speech" },
            { field: data.utterance, name: "utterance" },
            { field: data.result, name: "result" },
            { field: data.transcription, name: "transcription" },
            { field: data.message, name: "message" },
          ]
          
          for (const { field, name } of possibleFields) {
            if (typeof field === "string" && field.trim().length > 0) {
              const text = field.trim()
              console.log(`[Transcription] Found ${name} field:`, text.substring(0, 50))
              
              // Basic validation - must have letters and not be Base64/control pattern
              const hasLetters = /[a-zA-Z]/.test(text)
              const isBase64 = /^[A-Za-z0-9+/=]{30,}$/.test(text)
              const isControlPattern = /^[a-f0-9]+\|[0-9]+\|[0-9]+\|?$/i.test(text)
              
              if (hasLetters && !isBase64 && !isControlPattern) {
                console.log(`[Transcription] ✅ Valid transcription from ${name}:`, text.substring(0, 50))
                return text
              } else {
                console.log(`[Transcription] ❌ Invalid ${name} field:`, {
                  hasLetters,
                  isBase64,
                  isControlPattern,
                  preview: text.substring(0, 30),
                })
              }
            }
          }
          
          console.log("[Transcription] ❌ No valid transcription fields found")
          return null
        }

        // Helper function to check if parsed data is transcription-related
        const isTranscriptionMessage = (data: any): boolean => {
          // Check for explicit transcription type/event
          if (data.type === "transcription" || 
              data.event === "transcription" ||
              data.type === "speech" ||
              data.event === "speech" ||
              data.type === "stt" ||
              data.event === "stt") {
            console.log("[Transcription] Found transcription type/event:", data.type || data.event)
            return true
          }
          
          // Skip common non-transcription message types
          if (data.type === "message.state" || 
              data.object === "message.state" ||
              data.object === "assistant.transcript" ||
              data.object === "user.transcript" ||
              data.type === "metadata" ||
              data.event === "metadata") {
            console.debug("[Transcription] Skipping metadata/state message")
            return false
          }
          
          // Check if it has transcription-related fields
          const hasTranscriptionFields = 
            data.text || 
            data.transcript || 
            data.speech ||
            data.utterance ||
            data.result ||
            data.transcription
          
          if (hasTranscriptionFields) {
            const text = extractTranscriptionText(data)
            if (text) {
              const isValid = isLikelyTranscription(text)
              if (isValid) {
                console.log("[Transcription] Valid transcription found:", {
                  textPreview: text.substring(0, 50),
                  fields: Object.keys(data),
                })
              } else {
                console.debug("[Transcription] Text doesn't pass validation:", text.substring(0, 50))
              }
              return isValid
            }
          }
          
          // Don't process simple objects or generic messages as transcription
          // Only process if explicitly marked as transcription
          return false
        }

        // Only process if this looks like a transcription message
        if (!isTranscriptionMessage(parsedData)) {
          console.debug("[Transcription] Skipping non-transcription message:", {
            uid,
            streamId,
            keys: Object.keys(parsedData),
            preview: JSON.stringify(parsedData).substring(0, 100),
          })
          return
        }

        // Extract transcription text
        const transcriptionText = extractTranscriptionText(parsedData)
        
        if (!transcriptionText || !isLikelyTranscription(transcriptionText)) {
          console.debug("[Transcription] Extracted text doesn't look like transcription:", transcriptionText?.substring(0, 50))
          return
        }

        // Process the transcription
        processTranscriptionData({
          uid: parsedData.uid || uid,
          text: transcriptionText,
          isFinal: parsedData.isFinal ?? parsedData.final ?? true,
          words: parsedData.words,
        })
      } catch (error) {
        // Log error but don't break the app
        console.error("[Transcription] Error processing stream message:", {
          error: error instanceof Error ? error.message : String(error),
          uid,
          streamId,
        })
      }
    }

    // Subscribe to stream messages
    client.on("stream-message", handleStreamMessage)

    console.log("[Transcription] ✅ Stream message listener registered on client:", {
      connectionState: client.connectionState,
      localUid: client.uid,
    })

    // Log a warning if no stream messages are received after 10 seconds
    const warningTimer = setTimeout(() => {
      console.warn("[Transcription] ⚠️ No stream messages received after 10 seconds. Transcription may not be enabled.")
      console.warn("[Transcription] To enable transcription, you may need to:")
      console.warn("  1. Enable Real-Time STT in Agora Console")
      console.warn("  2. Start transcription service via REST API")
      console.warn("  3. Configure Conversational AI with transcription enabled")
    }, 10000)

    return () => {
      clearTimeout(warningTimer)
      client.off("stream-message", handleStreamMessage)
      console.log("[Transcription] Stream message listener removed")
    }
  }, [client, processTranscriptionData, isLikelyTranscription])

  // Clear transcript history when client changes
  useEffect(() => {
    if (!client) {
      setTranscriptHistory([])
      interimSegmentsRef.current.clear()
    }
  }, [client])

  return {
    transcriptHistory,
    clearTranscript: useCallback(() => {
      setTranscriptHistory([])
      interimSegmentsRef.current.clear()
    }, []),
  }
}

