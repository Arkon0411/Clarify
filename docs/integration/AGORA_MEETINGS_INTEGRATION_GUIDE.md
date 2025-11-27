# Agora Video Calling Integration Guide for Meetings Page

## Overview
This guide provides step-by-step instructions to integrate [Agora Video Calling](https://docs.agora.io/en/video-calling/overview/product-overview) into your Next.js meetings platform, replacing the mock video implementation with real-time video communication.

---

## Step 1: Install Agora SDK

### Install Required Packages
```bash
cd frontend
npm install agora-rtc-sdk-ng
```

### Alternative: Using React Wrapper (Recommended)
```bash
npm install agora-rtc-react
```

---

## Step 2: Environment Configuration

### Create `.env.local` in `frontend/` directory
```bash
# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
AGORA_REST_KEY=your_rest_api_key
AGORA_REST_SECRET=your_rest_api_secret

# Optional: For Conversational AI
GROQ_KEY=your_groq_key
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_minimax_groupid
AVATAR_AKOOL_KEY=your_akool_key
```

### Get Agora Credentials
1. Sign up at [Agora Console](https://console.agora.io/)
2. Create a new project
3. Get your **App ID** from Project Management
4. Generate **App Certificate** (optional, for token authentication)
5. Get **REST API Key** and **Secret** from Developer Toolkit → RESTful API

---

## Step 3: Create Agora Service Layer

### Create Service Files

#### `frontend/services/agora/agoraRTCService.ts`
```typescript
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng'

export interface AgoraRTCConfig {
  appId: string
  channel: string
  token?: string
  uid?: string | number
}

export class AgoraRTCService {
  private client: IAgoraRTCClient | null = null
  private localAudioTrack: ILocalAudioTrack | null = null
  private localVideoTrack: ILocalVideoTrack | null = null
  private remoteUsers: Map<number, {
    audioTrack?: IRemoteAudioTrack
    videoTrack?: IRemoteVideoTrack
  }> = new Map()

  async createClient() {
    this.client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    })
    return this.client
  }

  async join(config: AgoraRTCConfig) {
    if (!this.client) {
      await this.createClient()
    }

    if (!this.client) {
      throw new Error('Failed to create Agora client')
    }

    // Set up event handlers
    this.client.on('user-published', this.handleUserPublished.bind(this))
    this.client.on('user-unpublished', this.handleUserUnpublished.bind(this))
    this.client.on('user-left', this.handleUserLeft.bind(this))

    const uid = await this.client.join(
      config.appId,
      config.channel,
      config.token || null,
      config.uid || null
    )

    return uid
  }

  async createLocalTracks() {
    const [audioTrack, videoTrack] = await Promise.all([
      AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
      }),
      AgoraRTC.createCameraVideoTrack(),
    ])

    this.localAudioTrack = audioTrack
    this.localVideoTrack = videoTrack

    return { audioTrack, videoTrack }
  }

  async publishTracks() {
    if (!this.client || !this.localAudioTrack || !this.localVideoTrack) {
      throw new Error('Client or tracks not initialized')
    }

    await this.client.publish([this.localAudioTrack, this.localVideoTrack])
  }

  async subscribeToUser(user: any, mediaType: 'audio' | 'video') {
    if (!this.client) return

    await this.client.subscribe(user, mediaType)

    if (mediaType === 'video' && user.videoTrack) {
      const existing = this.remoteUsers.get(user.uid) || {}
      this.remoteUsers.set(user.uid, {
        ...existing,
        videoTrack: user.videoTrack,
      })
    }

    if (mediaType === 'audio' && user.audioTrack) {
      const existing = this.remoteUsers.get(user.uid) || {}
      this.remoteUsers.set(user.uid, {
        ...existing,
        audioTrack: user.audioTrack,
      })
    }
  }

  async leave() {
    // Stop local tracks
    if (this.localAudioTrack) {
      this.localAudioTrack.stop()
      this.localAudioTrack.close()
      this.localAudioTrack = null
    }

    if (this.localVideoTrack) {
      this.localVideoTrack.stop()
      this.localVideoTrack.close()
      this.localVideoTrack = null
    }

    // Leave channel
    if (this.client) {
      await this.client.leave()
      this.client = null
    }

    // Clear remote users
    this.remoteUsers.clear()
  }

  async toggleAudio(enabled: boolean) {
    if (this.localAudioTrack) {
      if (enabled) {
        await this.localAudioTrack.setEnabled(true)
      } else {
        await this.localAudioTrack.setEnabled(false)
      }
    }
  }

  async toggleVideo(enabled: boolean) {
    if (this.localVideoTrack) {
      if (enabled) {
        await this.localVideoTrack.setEnabled(true)
      } else {
        await this.localVideoTrack.setEnabled(false)
      }
    }
  }

  async switchCamera(deviceId: string) {
    if (this.localVideoTrack) {
      await this.localVideoTrack.setDevice(deviceId)
    }
  }

  async switchMicrophone(deviceId: string) {
    if (this.localAudioTrack) {
      await this.localAudioTrack.setDevice(deviceId)
    }
  }

  getLocalTracks() {
    return {
      audioTrack: this.localAudioTrack,
      videoTrack: this.localVideoTrack,
    }
  }

  getRemoteUsers() {
    return Array.from(this.remoteUsers.entries()).map(([uid, tracks]) => ({
      uid,
      ...tracks,
    }))
  }

  private handleUserPublished(user: any, mediaType: string) {
    // This will be handled by the hook
  }

  private handleUserUnpublished(user: any, mediaType: string) {
    if (mediaType === 'video') {
      const existing = this.remoteUsers.get(user.uid)
      if (existing) {
        existing.videoTrack = undefined
      }
    }
  }

  private handleUserLeft(user: any) {
    this.remoteUsers.delete(user.uid)
  }
}
```

---

## Step 4: Create React Hooks

### `frontend/hooks/useAgoraRTC.ts`
```typescript
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AgoraRTCService, AgoraRTCConfig } from '@/services/agora/agoraRTCService'
import type {
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng'

interface RemoteUser {
  uid: number
  audioTrack?: IRemoteAudioTrack
  videoTrack?: IRemoteVideoTrack
}

export function useAgoraRTC() {
  const [client, setClient] = useState<AgoraRTCService | null>(null)
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

  const serviceRef = useRef<AgoraRTCService | null>(null)

  useEffect(() => {
    serviceRef.current = new AgoraRTCService()
    setClient(serviceRef.current)

    return () => {
      if (serviceRef.current) {
        serviceRef.current.leave()
      }
    }
  }, [])

  const join = useCallback(async (config: AgoraRTCConfig) => {
    if (!serviceRef.current) return

    try {
      const uid = await serviceRef.current.join(config)
      setIsJoined(true)
      return uid
    } catch (error) {
      console.error('Failed to join channel:', error)
      throw error
    }
  }, [])

  const publish = useCallback(async () => {
    if (!serviceRef.current || !isJoined) return

    try {
      const tracks = await serviceRef.current.createLocalTracks()
      setLocalTracks(tracks)
      await serviceRef.current.publishTracks()
      setIsPublished(true)
    } catch (error) {
      console.error('Failed to publish tracks:', error)
      throw error
    }
  }, [isJoined])

  const leave = useCallback(async () => {
    if (!serviceRef.current) return

    try {
      await serviceRef.current.leave()
      setIsJoined(false)
      setIsPublished(false)
      setLocalTracks({ audioTrack: null, videoTrack: null })
      setRemoteUsers([])
    } catch (error) {
      console.error('Failed to leave channel:', error)
      throw error
    }
  }, [])

  const toggleAudio = useCallback(async (enabled: boolean) => {
    if (!serviceRef.current) return

    try {
      await serviceRef.current.toggleAudio(enabled)
      setIsMuted(!enabled)
    } catch (error) {
      console.error('Failed to toggle audio:', error)
    }
  }, [])

  const toggleVideo = useCallback(async (enabled: boolean) => {
    if (!serviceRef.current) return

    try {
      await serviceRef.current.toggleVideo(enabled)
      setIsVideoEnabled(enabled)
    } catch (error) {
      console.error('Failed to toggle video:', error)
    }
  }, [])

  // Subscribe to remote users when they publish
  useEffect(() => {
    if (!serviceRef.current || !isJoined) return

    const handleUserPublished = async (user: any, mediaType: string) => {
      try {
        await serviceRef.current!.subscribeToUser(user, mediaType as 'audio' | 'video')
        const remoteUsers = serviceRef.current!.getRemoteUsers()
        setRemoteUsers(remoteUsers)
      } catch (error) {
        console.error('Failed to subscribe to user:', error)
      }
    }

    // Note: Event handlers should be set up in the service
    // This is a simplified version - you may need to adjust based on your service implementation

    return () => {
      // Cleanup
    }
  }, [isJoined])

  return {
    client,
    isJoined,
    isPublished,
    localTracks,
    remoteUsers,
    isMuted,
    isVideoEnabled,
    join,
    publish,
    leave,
    toggleAudio,
    toggleVideo,
  }
}
```

---

## Step 5: Create API Routes for Token Generation

### `frontend/app/api/agora/token/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import RtcTokenBuilder, { RtcRole } from 'agora-access-token'

export async function POST(request: NextRequest) {
  try {
    const { channelName, uid } = await request.json()

    const appId = process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: 'Agora credentials not configured' },
        { status: 500 }
      )
    }

    // Token expires in 24 hours
    const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 3600 * 24
    const role = RtcRole.PUBLISHER

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid || 0,
      role,
      expirationTimeInSeconds
    )

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
```

**Note:** Install token builder:
```bash
npm install agora-access-token
```

---

## Step 6: Update MeetingLiveView Component

### Enhanced `frontend/components/meeting-live-view.tsx`
```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { useAgoraRTC } from '@/hooks/useAgoraRTC'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { teamMembers } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Hand,
  MessageSquare,
  Lock,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export function MeetingLiveView() {
  const searchParams = useSearchParams()
  const channelName = searchParams.get('channel') || '10000'
  const meetingTitle = searchParams.get('title') || 'Weekly Team Standup'

  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const {
    isJoined,
    isPublished,
    localTracks,
    remoteUsers,
    isMuted,
    isVideoEnabled,
    join,
    publish,
    leave,
    toggleAudio,
    toggleVideo,
  } = useAgoraRTC()

  const [elapsedTime, setElapsedTime] = useState(0)
  const [isConfidential, setIsConfidential] = useState(false)
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true)

  // Timer
  useEffect(() => {
    if (!isJoined) return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isJoined])

  // Join channel on mount
  useEffect(() => {
    const initializeMeeting = async () => {
      try {
        // Get token from API
        const tokenResponse = await fetch('/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelName,
            uid: 10000, // You can make this dynamic
          }),
        })

        const { token } = await tokenResponse.json()

        // Join channel
        await join({
          appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          channel: channelName,
          token,
          uid: 10000,
        })

        // Create and publish tracks
        await publish()
      } catch (error) {
        console.error('Failed to initialize meeting:', error)
      }
    }

    initializeMeeting()

    return () => {
      leave()
    }
  }, [])

  // Play local video
  useEffect(() => {
    if (localTracks.videoTrack && localVideoRef.current) {
      localTracks.videoTrack.play(localVideoRef.current, { mirror: true })
    }

    return () => {
      if (localTracks.videoTrack) {
        localTracks.videoTrack.stop()
      }
    }
  }, [localTracks.videoTrack])

  // Play remote videos
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        const container = remoteVideoRefs.current.get(user.uid)
        if (container) {
          user.videoTrack.play(container)
        }
      }
      if (user.audioTrack) {
        user.audioTrack.play()
      }
    })

    return () => {
      remoteUsers.forEach((user) => {
        if (user.videoTrack) {
          user.videoTrack.stop()
        }
        if (user.audioTrack) {
          user.audioTrack.stop()
        }
      })
    }
  }, [remoteUsers])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleLeave = async () => {
    await leave()
    // Navigate back to meetings page
    window.location.href = '/meetings'
  }

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Center Stage - Video Grid */}
      <div className="flex-1 flex flex-col bg-gray-50/50 relative">
        {/* Meeting Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isJoined && <div className="flex h-2 w-2 rounded-full bg-destructive animate-pulse" />}
            <h1 className="font-semibold text-foreground">{meetingTitle}</h1>
            {isJoined && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatTime(elapsedTime)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Confidential</span>
              <Switch checked={isConfidential} onCheckedChange={setIsConfidential} />
            </div>
          </div>
        </div>

        {/* Participants Label */}
        <div className="px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Participants:</span>
            <div className="flex -space-x-2">
              {teamMembers.map((member) => (
                <Avatar key={member.id} className="h-7 w-7 border-2 border-white">
                  <AvatarImage src={member.avatar || '/placeholder.svg'} alt={member.name} />
                  <AvatarFallback className="bg-sage text-white text-xs">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="relative rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center min-h-[200px] shadow-sm"
            >
              <div
                ref={(el) => {
                  if (el) remoteVideoRefs.current.set(user.uid, el)
                }}
                className="w-full h-full"
              />
              {!user.videoTrack && (
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-sage text-white text-2xl">
                    User {user.uid}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Placeholder for local video */}
          {!isPublished && (
            <div className="relative rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center min-h-[200px] shadow-sm">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-sage text-white text-2xl">You</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        {isPublished && localTracks.videoTrack && (
          <div
            ref={localVideoRef}
            className="absolute bottom-20 right-6 w-64 h-48 rounded-xl border-2 border-white shadow-lg overflow-hidden bg-black"
          />
        )}

        {/* Floating Meeting Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-gray-200 shadow-md">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-full h-12 w-12 hover:bg-gray-100 text-slate-600',
              isMuted && 'bg-destructive/20 text-destructive hover:bg-destructive/30'
            )}
            onClick={() => toggleAudio(!isMuted)}
            disabled={!isPublished}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-full h-12 w-12 hover:bg-gray-100 text-slate-600',
              !isVideoEnabled && 'bg-destructive/20 text-destructive hover:bg-destructive/30'
            )}
            onClick={() => toggleVideo(!isVideoEnabled)}
            disabled={!isPublished}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-600 hover:bg-gray-100">
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-600 hover:bg-gray-100">
            <Hand className="h-5 w-5" />
          </Button>

          <div className="w-px h-8 bg-gray-200 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12 bg-destructive hover:bg-destructive/90 text-white"
            onClick={handleLeave}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Right Sidebar - Intelligence Panel (Keep existing implementation) */}
      {/* ... existing transcript and tasks code ... */}
    </div>
  )
}
```

---

## Step 7: Update MeetingsList to Navigate to Live Meeting

### Update `frontend/components/meetings-list.tsx`
```typescript
// Add navigation to live meeting
import { useRouter } from 'next/navigation'

export function MeetingsList() {
  const router = useRouter()

  const handleStartMeeting = () => {
    const channelName = `meeting-${Date.now()}`
    router.push(`/meetings/live?channel=${channelName}&title=New Meeting`)
  }

  // ... existing code ...

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ... existing header ... */}
      <Button className="gap-2 bg-charcoal hover:bg-charcoal/90" onClick={handleStartMeeting}>
        <Video className="h-4 w-4" />
        Start Meeting
      </Button>
      {/* ... rest of component ... */}
    </div>
  )
}
```

---

## Step 8: Testing Checklist

- [ ] Install Agora SDK packages
- [ ] Configure environment variables
- [ ] Test token generation API
- [ ] Test joining a channel
- [ ] Test local video/audio
- [ ] Test remote user video/audio
- [ ] Test mute/unmute functionality
- [ ] Test video on/off functionality
- [ ] Test leaving channel
- [ ] Test with multiple users

---

## Troubleshooting

### Issue: "window is not defined"
**Solution:** Ensure all Agora code is in client components (`'use client'`)

### Issue: Video not displaying
**Solution:** 
- Check video container has proper dimensions
- Verify track is published and subscribed
- Check browser permissions for camera

### Issue: Token errors
**Solution:**
- Verify App ID and Certificate are correct
- Check token expiration
- Ensure token generation API is working

### Issue: No remote video
**Solution:**
- Verify remote user is publishing
- Check subscription logic
- Ensure event handlers are set up correctly

---

## Next Steps

1. **Add Conversational AI**: Integrate Agora Convo AI for AI-powered meeting assistants
2. **Add Recording**: Implement call recording functionality
3. **Add Screen Sharing**: Enable screen sharing capabilities
4. **Add Chat**: Implement real-time messaging
5. **Add Analytics**: Track meeting metrics and usage

---

## References

- [Agora Video Calling Documentation](https://docs.agora.io/en/video-calling/overview/product-overview)
- [Agora Web SDK API Reference](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web)
- [Agora React Integration Guide](https://www.agora.io/en/blog/build-a-next-js-video-call-app/)

