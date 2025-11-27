"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  UID,
} from "agora-rtc-sdk-ng"

// Dynamic import helper to avoid server-side evaluation
async function getAgoraRTC() {
  if (typeof window === "undefined") {
    throw new Error("AgoraRTC can only be used in the browser")
  }
  const module = await import("agora-rtc-sdk-ng")
  return module.default
}

interface RemoteUser {
  uid: UID
  audioTrack?: IRemoteAudioTrack
  videoTrack?: IRemoteVideoTrack
}

interface UseAgoraRTCOptions {
  appId: string
  channel: string
  token?: string
  uid?: UID
}

export function useAgoraRTC(options: UseAgoraRTCOptions) {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [localTracks, setLocalTracks] = useState<{
    audioTrack: ILocalAudioTrack | null
    videoTrack: ILocalVideoTrack | null
  }>({
    audioTrack: null,
    videoTrack: null,
  })
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0) // 0-100

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const remoteUsersRef = useRef<Map<UID, RemoteUser>>(new Map())
  const isJoinedRef = useRef(false)

  // Create client
  const createClient = useCallback(async () => {
    if (clientRef.current) {
      return clientRef.current
    }

    // Load AgoraRTC dynamically
    const AgoraRTC = await getAgoraRTC()

    const rtcClient = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    })

    // Set up event handlers
    rtcClient.on("user-published", async (user, mediaType) => {
      try {
        await rtcClient.subscribe(user, mediaType)

        const remoteUser: RemoteUser = {
          uid: user.uid,
          audioTrack: user.audioTrack,
          videoTrack: user.videoTrack,
        }

        remoteUsersRef.current.set(user.uid, remoteUser)

        // Play audio track
        if (user.audioTrack) {
          user.audioTrack.play()
        }

        // Update state
        setRemoteUsers(Array.from(remoteUsersRef.current.values()))
      } catch (error) {
        console.error("Failed to subscribe to user:", error)
      }
    })

    rtcClient.on("user-unpublished", (user, mediaType) => {
      const existing = remoteUsersRef.current.get(user.uid)
      if (existing) {
        if (mediaType === "video") {
          existing.videoTrack = undefined
        }
        if (mediaType === "audio") {
          existing.audioTrack = undefined
        }
        remoteUsersRef.current.set(user.uid, existing)
        setRemoteUsers(Array.from(remoteUsersRef.current.values()))
      }
    })

    rtcClient.on("user-left", (user) => {
      remoteUsersRef.current.delete(user.uid)
      setRemoteUsers(Array.from(remoteUsersRef.current.values()))
    })

    clientRef.current = rtcClient
    setClient(rtcClient)
    return rtcClient
  }, [])

  // Join channel
  const join = useCallback(
    async (token?: string) => {
      if (!clientRef.current) {
        await createClient()
      }

      if (!clientRef.current) {
        throw new Error("Failed to create Agora client")
      }

      try {
        // Use provided token or fall back to options.token
        const joinToken = token || options.token || null
        const uid = await clientRef.current.join(
          options.appId,
          options.channel,
          joinToken,
          options.uid || null,
        )

        isJoinedRef.current = true
        setIsJoined(true)
        return uid
      } catch (error) {
        console.error("Failed to join channel:", error)
        throw error
      }
    },
    [options.appId, options.channel, options.token, options.uid, createClient],
  )

  // Create and publish local tracks
  const publish = useCallback(async () => {
    // Check if client exists and is actually joined (using ref for immediate check)
    if (!clientRef.current) {
      throw new Error("Client not initialized")
    }

    if (!isJoinedRef.current) {
      throw new Error("Client not joined to channel")
    }

    // Check connection state before publishing - wait if connecting
    let connectionState = clientRef.current.connectionState
    if (connectionState === "CONNECTING") {
      // Wait for connection to be established (max 5 seconds)
      let retries = 0
      while (connectionState === "CONNECTING" && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        connectionState = clientRef.current.connectionState
        retries++
      }
    }

    if (connectionState === "DISCONNECTING" || connectionState === "DISCONNECTED") {
      throw new Error(`Cannot publish when connection state is ${connectionState}`)
    }

    if (connectionState !== "CONNECTED") {
      throw new Error(`Cannot publish when connection state is ${connectionState}. Expected CONNECTED.`)
    }

    // Load AgoraRTC dynamically
    const AgoraRTC = await getAgoraRTC()

    try {
      const [audioTrack, videoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "music_standard",
        }),
        AgoraRTC.createCameraVideoTrack(),
      ])

      // Double-check connection state before publishing
      if (!clientRef.current || !isJoinedRef.current) {
        // Clean up tracks if connection is lost
        audioTrack.close()
        videoTrack.close()
        throw new Error("Connection lost before publishing")
      }

      const finalConnectionState = clientRef.current.connectionState
      if (finalConnectionState === "DISCONNECTING" || finalConnectionState === "DISCONNECTED") {
        // Clean up tracks if connection is lost
        audioTrack.close()
        videoTrack.close()
        throw new Error("Connection lost before publishing")
      }

      setLocalTracks({ audioTrack, videoTrack })

      await clientRef.current.publish([audioTrack, videoTrack])
      setIsPublished(true)
    } catch (error) {
      console.error("Failed to publish tracks:", error)
      // Clean up tracks on error using ref
      const tracks = localTracksRef.current
      if (tracks.audioTrack) {
        tracks.audioTrack.close()
      }
      if (tracks.videoTrack) {
        tracks.videoTrack.close()
      }
      throw error
    }
  }, [isJoined]) // Removed localTracks dependency - use ref instead

  // Store tracks in ref to avoid dependency issues
  const localTracksRef = useRef(localTracks)
  useEffect(() => {
    localTracksRef.current = localTracks
  }, [localTracks])

  // Monitor audio level for visual feedback
  useEffect(() => {
    if (!localTracks.audioTrack || isMuted) {
      setAudioLevel(0)
      return
    }

    const interval = setInterval(() => {
      try {
        // Get volume level (0-1, multiply by 100 for percentage)
        const volume = localTracks.audioTrack.getVolumeLevel()
        setAudioLevel(Math.min(100, Math.max(0, volume * 100)))
      } catch (error) {
        // Track might be closed or not ready
        setAudioLevel(0)
      }
    }, 100) // Update every 100ms for smooth animation

    return () => clearInterval(interval)
  }, [localTracks.audioTrack, isMuted])

  // Leave channel
  const leave = useCallback(async () => {
    // Stop local tracks using ref to get latest value
    const tracks = localTracksRef.current
    if (tracks.audioTrack) {
      tracks.audioTrack.stop()
      tracks.audioTrack.close()
    }

    if (tracks.videoTrack) {
      tracks.videoTrack.stop()
      tracks.videoTrack.close()
    }

    setLocalTracks({ audioTrack: null, videoTrack: null })

    // Leave channel
    if (clientRef.current) {
      await clientRef.current.leave()
      clientRef.current = null
      setClient(null)
    }

    // Clear remote users
    remoteUsersRef.current.clear()
    setRemoteUsers([])

    isJoinedRef.current = false
    setIsJoined(false)
    setIsPublished(false)
  }, []) // No dependencies - uses ref for tracks

  // Toggle audio
  const toggleAudio = useCallback(
    async (enabled: boolean) => {
      // Use ref for immediate access, fallback to state
      const tracks = localTracksRef.current
      const audioTrack = tracks?.audioTrack || localTracks.audioTrack
      
      if (!audioTrack) {
        console.warn('Audio track not available for toggling', { 
          refTrack: !!tracks?.audioTrack,
          stateTrack: !!localTracks.audioTrack,
          isPublished
        })
        return
      }

      try {
        // Check current enabled state
        const currentEnabled = audioTrack.isPlaying !== false
        console.log('Toggling audio track:', { 
          requestedEnabled: enabled, 
          currentEnabled,
          currentMuted: isMuted,
          trackExists: !!audioTrack
        })
        
        // Use setEnabled to enable/disable the track
        await audioTrack.setEnabled(enabled)
        
        // Verify it was set correctly
        // Note: isPlaying might not immediately reflect the change, so we trust the setEnabled call
        console.log('Audio track setEnabled called, new state should be:', enabled)
        
        // Update state - if enabled is true, mic is NOT muted
        setIsMuted(!enabled)
        
        console.log(`Audio ${enabled ? 'enabled' : 'disabled'} successfully. isMuted set to: ${!enabled}`)
      } catch (error) {
        console.error('Failed to toggle audio:', error)
        // Still update state even if there's an error, for UI consistency
        setIsMuted(!enabled)
        throw error // Re-throw so caller knows it failed
      }
    },
    [localTracks, isMuted, isPublished], // Include dependencies
  )

  // Toggle video
  const toggleVideo = useCallback(
    async (enabled: boolean) => {
      // Try ref first, then state as fallback
      const tracks = localTracksRef.current || localTracks
      if (tracks.videoTrack) {
        try {
          console.log('Toggling video track:', { enabled, trackExists: !!tracks.videoTrack })
          await tracks.videoTrack.setEnabled(enabled)
          setIsVideoEnabled(enabled)
          console.log(`Video ${enabled ? 'enabled' : 'disabled'} successfully`)
        } catch (error) {
          console.error('Failed to toggle video:', error)
        }
      } else {
        console.warn('Video track not available', { 
          refTrack: !!localTracksRef.current?.videoTrack,
          stateTrack: !!localTracks.videoTrack 
        })
      }
    },
    [localTracks], // Include localTracks as dependency to ensure we have latest
  )

  // Cleanup on unmount - use stable leave function
  useEffect(() => {
    return () => {
      leave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on unmount

  return {
    client,
    isJoined,
    isPublished,
    localTracks,
    remoteUsers,
    isMuted,
    isVideoEnabled,
    audioLevel,
    createClient,
    join,
    publish,
    leave,
    toggleAudio,
    toggleVideo,
  }
}

