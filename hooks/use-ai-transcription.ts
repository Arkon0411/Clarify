"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import type { ILocalAudioTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng"

export interface TranscriptSegment {
  id: string
  speakerUid: string | number
  displayName: string
  timestamp: string
  text: string
  isFinal: boolean
}

interface UseAITranscriptionOptions {
  localAudioTrack: ILocalAudioTrack | null
  remoteAudioTracks: Map<string | number, IRemoteAudioTrack>
  meetingStartTime: number
  uidToNameMap: Map<string | number, string>
  localUid: string | number
  localUserName?: string
  enabled?: boolean
}

export function useAITranscription({
  localAudioTrack,
  remoteAudioTracks,
  meetingStartTime,
  uidToNameMap,
  localUid,
  localUserName = "You",
  enabled = true,
}: UseAITranscriptionOptions) {
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptSegment[]>([])
  const segmentIdCounter = useRef(0)
  const configWarningShownRef = useRef(false)

  const generateSegmentId = useCallback(() => {
    segmentIdCounter.current += 1
    return `transcript-${Date.now()}-${segmentIdCounter.current}`
  }, [])

  const formatTimestamp = useCallback((elapsedSeconds: number) => {
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const seconds = Math.floor(elapsedSeconds % 60)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const getDisplayName = useCallback(
    (uid: string | number): string => {
      if (uid === localUid) {
        return localUserName
      }
      return uidToNameMap.get(uid) || `User ${uid}`
    },
    [uidToNameMap, localUid, localUserName],
  )

  const processTranscriptionResult = useCallback(
    (text: string, userId: string | number, isFinal: boolean = true) => {
      if (!text || text.trim().length === 0) return

      const elapsedSeconds = Math.floor((Date.now() - meetingStartTime) / 1000)
      const timestamp = formatTimestamp(elapsedSeconds)
      const displayName = getDisplayName(userId)

      const segment: TranscriptSegment = {
        id: generateSegmentId(),
        speakerUid: userId,
        displayName,
        timestamp,
        text: text.trim(),
        isFinal,
      }

      setTranscriptHistory((prev) => {
        const updated = [...prev, segment]
        console.log(`[AI Transcription] ✅ Added transcript segment (total: ${updated.length}):`, segment)
        return updated
      })
    },
    [meetingStartTime, formatTimestamp, getDisplayName, generateSegmentId],
  )

  // Send audio chunk to transcription API
  // CRITICAL: This function should NEVER throw errors that break the loop
  // All errors are handled gracefully to ensure continuous transcription
  const sendAudioForTranscription = useCallback(
    async (audioBlob: Blob, userId: string | number) => {
      try {
        const formData = new FormData()
        // Use the actual blob type, not hardcoded webm
        const fileExtension = audioBlob.type.includes("webm") ? "webm" : audioBlob.type.includes("ogg") ? "ogg" : "webm"
        formData.append("audio", audioBlob, `audio.${fileExtension}`)
        formData.append("userId", String(userId))
        formData.append("languageCode", "en-US")

        const response = await fetch("/api/transcription/stream", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          // Try to get error details
          let errorData: any
          const contentType = response.headers.get("content-type")
          
          if (contentType && contentType.includes("application/json")) {
            errorData = await response.json().catch(() => null)
          } else {
            const errorText = await response.text().catch(() => "")
            errorData = errorText ? { error: errorText } : { error: "Unknown error" }
          }

          // Check if it's a file format error - these are expected and should be silent
          const isFileFormatError = errorData?.message?.includes("could not process file") || 
                                   errorData?.message?.includes("invalid media file") ||
                                   errorData?.error?.includes("could not process file")
          
          if (isFileFormatError) {
            // This is expected for some chunks - just log debug and continue
            // IMPORTANT: Return here but the finally block in sendAudioChunk will still run
            // This ensures the loop continues even when Groq rejects chunks
            console.debug(`[AI Transcription] Audio chunk rejected by Groq (format issue) - skipping this chunk but continuing transcription loop...`)
            // Don't throw - just return, loop continues in finally block
            return
          }

          // For other errors, log but don't throw - loop must continue
          console.warn(
            `[AI Transcription] API error (${response.status}) - continuing loop:`,
            errorData || "No error details available",
          )

          // Log helpful message if service is not configured
          if (response.status === 503 && errorData?.error?.includes("not configured")) {
            console.warn(
              "[AI Transcription] ⚠️ Transcription service not configured. Please set GROQ_KEY (or GROQ_API_KEY) or OPENAI_API_KEY in your environment variables.",
            )
            
            // Show toast notification once
            if (!configWarningShownRef.current) {
              configWarningShownRef.current = true
              toast.warning("Transcription Not Configured", {
                description: "Please set GROQ_KEY (recommended) or OPENAI_API_KEY in your environment variables to enable AI transcription.",
                duration: 8000,
              })
            }
          }

          // Return without throwing - loop continues
          return
        }

        const result = await response.json()

        if (result.text && result.text.trim().length > 0) {
          processTranscriptionResult(result.text, userId, true)
        } else if (result.note) {
          // Log when no speech is detected (not an error, just informational)
          console.debug("[AI Transcription] No speech detected in audio chunk - continuing loop")
        }
      } catch (error) {
        // CRITICAL: Never throw errors - always handle gracefully
        // This ensures the loop continues even on network errors
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.warn(`[AI Transcription] Network error sending audio - continuing loop: ${errorMsg}`)
        // Don't throw - return gracefully, loop continues in finally block
      }
    },
    [processTranscriptionResult],
  )

  const captureAudioForTranscription = useCallback(
    async (audioTrack: ILocalAudioTrack | IRemoteAudioTrack, userId: string | number): Promise<(() => void) | undefined> => {
      if (!audioTrack) {
        console.warn(`[AI Transcription] ⚠️ Audio track is null for user ${userId}`)
        return
      }
      
      if (!enabled) {
        console.log(`[AI Transcription] Transcription disabled for user ${userId}`)
        return
      }

      try {
        const track = audioTrack.getMediaStreamTrack()
        if (!track || track.readyState === "ended") {
          console.warn(`[AI Transcription] ⚠️ Audio track is ended for user ${userId}`)
          return
        }
      } catch (error) {
        console.error(`[AI Transcription] ❌ Error checking audio track for user ${userId}:`, error)
        return
      }

      try {
        // Get the MediaStream from the track - keep it active
        const mediaStream = new MediaStream([audioTrack.getMediaStreamTrack()])
        console.log(`[AI Transcription] ✅ MediaStream created for user ${userId} - track state: ${audioTrack.getMediaStreamTrack().readyState}`)

        // Check if MediaRecorder is supported
        if (!MediaRecorder.isTypeSupported("audio/webm") && !MediaRecorder.isTypeSupported("audio/ogg")) {
          console.warn("[AI Transcription] MediaRecorder not supported for audio/webm or audio/ogg")
          return
        }

        // Determine supported MIME type - prefer webm as Groq handles it better than ogg
        // Try webm first as it's more compatible with Groq's API
        let mimeType = "audio/webm;codecs=opus"
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/webm"
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "audio/ogg;codecs=opus"
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = "audio/mp4"
            }
          }
        }
        
        console.log(`[AI Transcription] 🎙️ Starting START-STOP-RESTART recording for user ${userId} with MIME type: ${mimeType}`)

        // Create MediaRecorder - this will stay active throughout the meeting
        const mediaRecorder = new MediaRecorder(mediaStream, {
          mimeType,
        })

        // START-STOP-RESTART PATTERN for valid WebM headers
        // CRITICAL: Only the first blob from MediaRecorder.start(timeslice) contains headers
        // Subsequent blobs are raw data. To fix this, we use start() -> stop() -> start() pattern
        // Each stop() creates a complete WebM file with headers that Groq can process
        
        const audioChunks: Blob[] = []
        let isProcessing = false
        let isRecording = false
        let reconnectAttempts = 0
        const MAX_RECONNECT_ATTEMPTS = 5
        const RECORDING_DURATION_MS = 3000 // Record for 3 seconds, then stop and send
        let stopTimeoutId: NodeJS.Timeout | null = null

        let chunkCounter = 0
        
        // Handle data when recorder stops (this is when we get a complete WebM file with headers)
        mediaRecorder.ondataavailable = async (event) => {
          chunkCounter++
          console.log(`[AI Transcription] 📥 ondataavailable EVENT #${chunkCounter} fired for user ${userId} (state: ${mediaRecorder.state}, dataSize: ${event.data.size})`)
          
          if (event.data.size > 0) {
            // This blob contains a complete WebM file with headers (because we called stop())
            audioChunks.push(event.data)
            console.log(`[AI Transcription] 📥 Received complete WebM chunk #${audioChunks.length}: ${event.data.size} bytes`)
            
            // Send immediately if not processing
            if (!isProcessing) {
              console.log(`[AI Transcription] 🚀 Triggering sendAudioChunk() immediately (chunk #${chunkCounter})`)
              sendAudioChunk()
            } else {
              console.log(`[AI Transcription] ⏳ Chunk queued (${audioChunks.length} chunks) - will send after current processing completes`)
            }
          } else {
            console.warn(`[AI Transcription] ⚠️ Received empty audio chunk #${chunkCounter} for user ${userId}`)
          }
        }
        
        // Send the complete WebM file to transcription API
        const sendAudioChunk = async () => {
          if (isProcessing) {
            console.debug(`[AI Transcription] Already processing, skipping send for user ${userId}`)
            return
          }
          
          if (audioChunks.length === 0) {
            console.debug(`[AI Transcription] No chunks to send for user ${userId}`)
            return
          }
          
          isProcessing = true
          
          // Get the complete WebM file (with headers)
          const chunksToSend = [...audioChunks]
          audioChunks.length = 0 // Clear for next recording
          
          // Create blob with explicit type - this is a complete WebM file with headers
          const audioBlob = new Blob(chunksToSend, { type: mimeType })
          
          console.log(`[AI Transcription] 📤 Sending complete WebM file: ${audioBlob.size} bytes for user ${userId}`)
          
          try {
            // Send to transcription API
            await sendAudioForTranscription(audioBlob, userId)
            console.log(`[AI Transcription] ✅ Successfully transcribed chunk for user ${userId} - ready for next recording`)
            reconnectAttempts = 0 // Reset on success
          } catch (error) {
            // Error occurred - log it but CONTINUE THE LOOP
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.warn(`[AI Transcription] ⚠️ Error in sendAudioForTranscription for user ${userId}: ${errorMsg} - CONTINUING LOOP`)
          } finally {
            isProcessing = false
            
            // CRITICAL: Restart recording immediately after sending
            // This creates the continuous loop: start -> record -> stop -> send -> restart
            setTimeout(() => {
              if (enabled && mediaRecorder.state === "inactive") {
                try {
                  console.log(`[AI Transcription] 🔄 Restarting recording for next chunk (user ${userId})`)
                  mediaRecorder.start() // Start without timeslice - we'll stop manually
                  isRecording = true
                  reconnectAttempts = 0
                  
                  // Schedule stop after RECORDING_DURATION_MS
                  stopTimeoutId = setTimeout(() => {
                    if (mediaRecorder.state === "recording") {
                      console.log(`[AI Transcription] 🛑 Stopping recording to create complete WebM file (user ${userId})`)
                      mediaRecorder.stop() // This triggers ondataavailable with complete WebM file
                    }
                  }, RECORDING_DURATION_MS)
                } catch (error) {
                  console.error(`[AI Transcription] ❌ Failed to restart recording:`, error)
                  reconnectAttempts++
                  
                  // Retry if under max attempts
                  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    setTimeout(() => {
                      if (enabled) {
                        sendAudioChunk() // Try to restart the loop
                      }
                    }, 1000)
                  }
                }
              } else if (mediaRecorder.state === "recording") {
                // Already recording - the scheduled stop will handle it
                console.log(`[AI Transcription] ✅ Recording already active, waiting for scheduled stop`)
              }
            }, 100) // Small delay to ensure state is settled
          }
        }

        // Error handling with auto-recovery
        mediaRecorder.onerror = (event) => {
          console.error(`[AI Transcription] ❌ MediaRecorder error for user ${userId}:`, event)
          if (stopTimeoutId) {
            clearTimeout(stopTimeoutId)
            stopTimeoutId = null
          }
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && mediaRecorder.state === "inactive") {
            console.log(`[AI Transcription] 🔄 Attempting recovery from error...`)
            setTimeout(() => {
              try {
                mediaRecorder.start()
                isRecording = true
                reconnectAttempts = 0
                console.log(`[AI Transcription] ✅ Recovered from error`)
                
                // Schedule stop
                stopTimeoutId = setTimeout(() => {
                  if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop()
                  }
                }, RECORDING_DURATION_MS)
              } catch (error) {
                console.error(`[AI Transcription] ❌ Recovery failed:`, error)
                reconnectAttempts++
              }
            }, 1000)
          }
        }

        mediaRecorder.onstop = () => {
          isRecording = false
          if (stopTimeoutId) {
            clearTimeout(stopTimeoutId)
            stopTimeoutId = null
          }
          console.log(`[AI Transcription] 🛑 MediaRecorder stopped for user ${userId} - complete WebM file ready`)
          // ondataavailable will fire with the complete file, which triggers sendAudioChunk
        }

        mediaRecorder.onstart = () => {
          isRecording = true
          reconnectAttempts = 0
          console.log(`[AI Transcription] ✅ MediaRecorder started for user ${userId} - recording for ${RECORDING_DURATION_MS}ms`)
        }

        // Health check to ensure recording continues
        const healthCheck = setInterval(() => {
          if (enabled) {
            try {
              const track = audioTrack.getMediaStreamTrack()
              if (track.readyState === "ended") {
                console.error(`[AI Transcription] ❌ Health check: Audio track ended for user ${userId} - transcription stopped`)
                clearInterval(healthCheck)
                if (mediaRecorder.state !== "inactive") {
                  mediaRecorder.stop()
                }
                return
              }
            } catch (error) {
              console.error(`[AI Transcription] ❌ Health check: Error checking audio track for user ${userId}:`, error)
            }
            
            // Check if recorder is stuck
            if (mediaRecorder.state === "inactive" && isRecording) {
              console.warn(`[AI Transcription] ⚠️ Health check: Recorder inactive but should be recording - attempting restart`)
              if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                try {
                  mediaRecorder.start()
                  isRecording = true
                  reconnectAttempts = 0
                  console.log(`[AI Transcription] ✅ Health check: Recorder restarted successfully`)
                  
                  // Schedule stop
                  stopTimeoutId = setTimeout(() => {
                    if (mediaRecorder.state === "recording") {
                      mediaRecorder.stop()
                    }
                  }, RECORDING_DURATION_MS)
                } catch (error) {
                  console.error(`[AI Transcription] ❌ Health check restart failed:`, error)
                  reconnectAttempts++
                }
              }
            }
          }
        }, 10000) // Check every 10 seconds

        // Start the first recording cycle
        console.log(`[AI Transcription] 🎙️ Starting first recording cycle for user ${userId} (duration: ${RECORDING_DURATION_MS}ms)`)
        mediaRecorder.start() // Start without timeslice
        isRecording = true
        
        // Schedule the first stop
        stopTimeoutId = setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            console.log(`[AI Transcription] 🛑 Stopping first recording to create complete WebM file`)
            mediaRecorder.stop() // This will trigger ondataavailable with complete WebM file
          }
        }, RECORDING_DURATION_MS)

        return () => {
          console.log(`[AI Transcription] 🛑 Stopping recording for user ${userId}`)
          clearInterval(healthCheck)
          if (stopTimeoutId) {
            clearTimeout(stopTimeoutId)
            stopTimeoutId = null
          }
          isRecording = false
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop()
          }
          console.log(`[AI Transcription] ✅ Stopped audio capture for user ${userId}`)
        }
      } catch (error) {
        console.error("[AI Transcription] Failed to capture audio:", error)
      }
    },
    [enabled, sendAudioForTranscription],
  )

  useEffect(() => {
    if (!localAudioTrack) {
      console.log("[AI Transcription] ⚠️ Local audio track not available - transcription will not work")
      return
    }
    
    if (!enabled) {
      console.log("[AI Transcription] ⚠️ Transcription disabled (enabled=false)")
      return
    }

    console.log("[AI Transcription] 🎙️ Setting up local audio capture (independent of AI agent)...")
    let cleanupFn: (() => void) | undefined
    let isActive = true

    captureAudioForTranscription(localAudioTrack, localUid).then((fn) => {
      if (isActive) {
        cleanupFn = fn
        console.log("[AI Transcription] ✅ Local audio capture setup complete - transcription will continue regardless of AI agent status")
      } else if (fn) {
        fn()
      }
    }).catch((error) => {
      console.error("[AI Transcription] ❌ Failed to setup local audio capture:", error)
      console.error("[AI Transcription] This error is independent of AI agent - check audio track availability")
    })

    return () => {
      isActive = false
      if (cleanupFn) {
        cleanupFn()
      }
      console.log("[AI Transcription] 🛑 Cleaned up local audio capture")
    }
  }, [localAudioTrack, localUid, enabled, captureAudioForTranscription])

  useEffect(() => {
    if (!enabled || remoteAudioTracks.size === 0) return

    console.log("[AI Transcription] Setting up remote audio capture for", remoteAudioTracks.size, "users")

    const cleanupFns: Array<() => void> = []

    remoteAudioTracks.forEach((track, uid) => {
      captureAudioForTranscription(track, uid).then((cleanupFn) => {
        if (cleanupFn) {
          cleanupFns.push(cleanupFn)
        }
      })
    })

    return () => {
      cleanupFns.forEach((cleanupFn) => cleanupFn())
    }
  }, [remoteAudioTracks, enabled, captureAudioForTranscription])

  return {
    transcriptHistory,
    clearTranscript: useCallback(() => {
      setTranscriptHistory([])
    }, []),
  }
}
