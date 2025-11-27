"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAgoraRTC } from "@/hooks/use-agora-rtc"
import { useAgoraConvoAI } from "@/hooks/use-agora-convo-ai"
import type { IRemoteAudioTrack, IRemoteVideoTrack, UID } from "agora-rtc-sdk-ng"

interface RemoteUser {
  uid: UID
  audioTrack?: IRemoteAudioTrack
  videoTrack?: IRemoteVideoTrack
}
import { IntelligencePanel } from "@/components/intelligence-panel"
import { teamMembers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Hand,
  MessageSquare,
  Lock,
  Clock,
  Menu,
} from "lucide-react"

interface TranscriptEntry {
  id: string
  speaker: string
  speakerColor: string
  text: string
  timestamp: string
}

interface DetectedTask {
  id: string
  title: string
  confidence: "high" | "medium" | "low"
  confirmed: boolean
}

const speakerColors = ["bg-sage", "bg-dusty-blue", "bg-clay", "bg-charcoal"]

const mockTranscript: TranscriptEntry[] = [
  {
    id: "1",
    speaker: "Sarah Chen",
    speakerColor: speakerColors[0],
    text: "Let's start by reviewing our Q4 objectives. We need to finalize the product roadmap by next week.",
    timestamp: "00:00:15",
  },
  {
    id: "2",
    speaker: "Alex Rivera",
    speakerColor: speakerColors[1],
    text: "I can take the lead on drafting the initial roadmap document. Should have it ready by Wednesday.",
    timestamp: "00:00:32",
  },
  {
    id: "3",
    speaker: "Jordan Kim",
    speakerColor: speakerColors[2],
    text: "That works. I'll coordinate with engineering to get their input on technical feasibility.",
    timestamp: "00:00:48",
  },
  {
    id: "4",
    speaker: "Sarah Chen",
    speakerColor: speakerColors[0],
    text: "Perfect. Taylor, can you prepare the market analysis section?",
    timestamp: "00:01:05",
  },
]

const mockDetectedTasks: DetectedTask[] = [
  {
    id: "1",
    title: "Draft initial product roadmap document",
    confidence: "high",
    confirmed: true,
  },
  {
    id: "2",
    title: "Coordinate with engineering on technical feasibility",
    confidence: "medium",
    confirmed: false,
  },
  {
    id: "3",
    title: "Prepare market analysis section",
    confidence: "high",
    confirmed: false,
  },
]

const confidenceColors = {
  high: "bg-confidence-high",
  medium: "bg-confidence-medium",
  low: "bg-confidence-low",
}

export function MeetingLiveView() {
  const searchParams = useSearchParams()
  // Extract values directly to avoid object reference changes causing re-renders
  const channelParam = searchParams.get("channel")
  const titleParam = searchParams.get("title")
  
  // Memoize channel name and title - use stable values
  const channelName = useMemo(() => {
    return channelParam || `meeting-${Date.now()}`
  }, [channelParam])
  const meetingTitle = useMemo(() => {
    return titleParam || "Weekly Team Standup"
  }, [titleParam])

  const [elapsedTime, setElapsedTime] = useState(0)
  const [isConfidential, setIsConfidential] = useState(false)
  const [detectedTasks, setDetectedTasks] = useState(mockDetectedTasks)
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true)
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const isMobile = useIsMobile()

  // Video container refs
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRefs = useRef<Map<number | string, HTMLDivElement>>(new Map())

  // Agora configuration - memoize to prevent hook re-initialization
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ""
  // Generate UID in valid range [0, 10000] for Agora
  const agoraUid = useRef(Math.floor(Math.random() * 10000)) // Random UID between 0-10000
  const agoraOptions = useMemo(() => ({
    appId,
    channel: channelName,
    uid: agoraUid.current,
  }), [appId, channelName])

  const {
    isJoined,
    isPublished,
    localTracks,
    remoteUsers,
    isMuted,
    isVideoEnabled,
    audioLevel,
    join,
    publish,
    leave,
    toggleAudio,
    toggleVideo,
  } = useAgoraRTC(agoraOptions)

  // Agora Conversational AI - AI persona that joins automatically
  const { agentId, start: startConvoAI, stop: stopConvoAI } = useAgoraConvoAI()
  const agentIdRef = useRef<string | null>(null)
  
  // Keep agentId in ref for cleanup
  useEffect(() => {
    agentIdRef.current = agentId
  }, [agentId])

  // Timer - only run when joined
  useEffect(() => {
    if (!isJoined) return

    const timer = setInterval(() => {
      setElapsedTime((prev: number) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isJoined])

  // Track if initialization has started
  const initStartedRef = useRef(false)

  // Initialize Agora on mount
  useEffect(() => {
    // Prevent multiple initializations
    if (initStartedRef.current) return
    initStartedRef.current = true

    let isMounted = true

    const initializeMeeting = async () => {
      if (!appId) {
        console.error("Agora App ID not configured. Please set NEXT_PUBLIC_AGORA_APP_ID in your environment variables.")
        if (isMounted) setIsInitializing(false)
        return
      }

      try {
        if (isMounted) setIsInitializing(true)

        // Fetch token from API
        const uid = agoraOptions.uid
        const tokenResponse = await fetch(
          `/api/agora/token?channel=${channelName}&uid=${uid}&role=publisher`,
        )

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          throw new Error(errorData.error || "Failed to fetch token")
        }

        const { token } = await tokenResponse.json()

        // Check if still mounted before proceeding
        if (!isMounted) return

        // Join channel with token
        await join(token)

        // Check again before publishing
        if (!isMounted) {
          await leave()
          return
        }

        // Create and publish tracks
        await publish()

        // Start AI agent automatically after joining
        if (isMounted) {
          // Wait for user to be fully connected and tracks published
          // The agent needs the user to be in the channel first
          const waitForConnection = async (maxWait: number = 10000) => {
            const startTime = Date.now()
            while (Date.now() - startTime < maxWait) {
              if (isJoined && isPublished) {
                // Double check by waiting a bit more for stability
                await new Promise(resolve => setTimeout(resolve, 1000))
                return true
              }
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            return isJoined && isPublished
          }

          try {
            // Wait up to 10 seconds for connection
            const isConnected = await waitForConnection(10000)
            
            if (!isConnected) {
              console.warn("User not fully connected, skipping AI agent start")
              return
            }

            // Start the agent with retry logic
            const startAgentWithRetry = async (retries: number = 3) => {
              for (let i = 0; i < retries; i++) {
                try {
                  const agentId = await startConvoAI({
                    channel: channelName,
                    agentRtcUid: 10001,
                    remoteRtcUids: [agoraUid.current],
                    appId: appId,
                  })
                  
                  agentIdRef.current = agentId
                  return agentId
                } catch (error) {
                  if (i === retries - 1) {
                    throw error
                  }
                  // Wait before retry (exponential backoff)
                  await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
                }
              }
            }

            await startAgentWithRetry(3)
          } catch (aiError) {
            // Don't block the meeting if AI fails to start
            console.error("Failed to start AI agent after retries:", aiError)
          }
        }
      } catch (error) {
        console.error("Failed to initialize meeting:", error)
        if (isMounted) {
          alert(`Failed to join meeting: ${error instanceof Error ? error.message : "Unknown error"}`)
          setIsInitializing(false)
        }
      } finally {
        if (isMounted) setIsInitializing(false)
      }
    }

    initializeMeeting()

    return () => {
      isMounted = false
      // Stop AI agent before leaving
      if (agentIdRef.current) {
        stopConvoAI().catch(console.error)
      }
      leave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Play local video track
  useEffect(() => {
    if (!localTracks.videoTrack || !localVideoRef.current) {
      console.log('Video track or element not ready:', { 
        hasTrack: !!localTracks.videoTrack, 
        hasElement: !!localVideoRef.current,
        isPublished
      })
      return
    }

    const playVideo = async () => {
      // Wait a bit to ensure element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!localVideoRef.current || !localTracks.videoTrack) {
        console.warn('Video element or track no longer available')
        return
      }

      try {
        console.log('Playing local video track to element', {
          elementExists: !!localVideoRef.current,
          elementDimensions: {
            width: localVideoRef.current.offsetWidth,
            height: localVideoRef.current.offsetHeight
          },
          trackEnabled: localTracks.videoTrack.isPlaying
        })
        await localTracks.videoTrack.play(localVideoRef.current, { mirror: true })
        console.log('Local video track playing successfully')
      } catch (error) {
        console.error('Failed to play local video:', error)
      }
    }

    playVideo()

    // Don't stop the track in cleanup - only stop when leaving channel
    return () => {
      // Cleanup handled by leave() function
    }
  }, [localTracks.videoTrack, isPublished])

  // Play remote video tracks
  useEffect(() => {
    remoteUsers.forEach((user: RemoteUser) => {
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
      remoteUsers.forEach((user: RemoteUser) => {
        if (user.videoTrack) {
          user.videoTrack.stop()
        }
        if (user.audioTrack) {
          user.audioTrack.stop()
        }
      })
    }
  }, [remoteUsers])

  const handleLeave = async () => {
    await leave()
    // Navigate back to meetings page
    window.location.href = "/meetings"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleTaskConfirmation = useCallback((taskId: string) => {
    setDetectedTasks((prev: DetectedTask[]) =>
      prev.map((task: DetectedTask) => (task.id === taskId ? { ...task, confirmed: !task.confirmed } : task)),
    )
  }, [])

  // Memoize Switch callback to prevent re-renders
  const handleConfidentialChange = useCallback((checked: boolean) => {
    // Use functional update to avoid dependency on isConfidential
    setIsConfidential((prev: boolean) => {
      // Only update if value actually changed
      if (prev === checked) return prev
      return checked
    })
  }, [])

  const pendingTasks = detectedTasks.filter((t: DetectedTask) => !t.confirmed)
  const confirmedTasks = detectedTasks.filter((t: DetectedTask) => t.confirmed)

  // Memoize callbacks to prevent re-renders
  const handleTranscriptToggle = useCallback(() => {
    setIsTranscriptOpen((prev: boolean) => !prev)
  }, [])

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Center Stage - Video Grid */}
      <div className="flex-1 flex flex-col bg-secondary/30 dark:bg-secondary/10 relative min-w-0">
        {/* Meeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 px-3 sm:px-6 py-2 sm:py-3 bg-card border-b border-border">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {isJoined && <div className="flex h-2 w-2 rounded-full bg-destructive animate-pulse flex-shrink-0" />}
            <h1 className="font-semibold text-foreground text-sm sm:text-base truncate">{meetingTitle}</h1>
            {isJoined && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">{formatTime(elapsedTime)}</span>
              </div>
            )}
            {isInitializing && (
              <span className="text-xs text-muted-foreground">Connecting...</span>
            )}
            {!appId && (
              <span className="text-xs text-destructive">Agora App ID not configured</span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground hidden xl:inline">Confidential</span>
                <Switch 
                  checked={isConfidential} 
                  onCheckedChange={handleConfidentialChange} 
                />
              </div>
            )}
            {isMobile && (
              <>
                <Sheet open={isIntelligenceOpen} onOpenChange={setIsIntelligenceOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
                    <SheetTitle className="sr-only">Meeting Intelligence</SheetTitle>
                    <IntelligencePanel
                      isTranscriptOpen={isTranscriptOpen}
                      onTranscriptToggle={handleTranscriptToggle}
                      pendingTasks={pendingTasks}
                      confirmedTasks={confirmedTasks}
                      onTaskToggle={toggleTaskConfirmation}
                      transcript={mockTranscript}
                    />
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>

        {/* Participants Label */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-card border-b border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground">Participants:</span>
            <div className="flex -space-x-2">
              {teamMembers.map((member) => (
                <Avatar key={member.id} className="h-6 w-6 sm:h-7 sm:w-7 border-2 border-card">
                  <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                  <AvatarFallback className="bg-sage text-white text-xs">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Confidential Toggle */}
        {isMobile && (
          <div className="px-3 sm:px-6 py-2 bg-card border-b border-border">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-foreground">Confidential</span>
              <Switch 
                checked={isConfidential} 
                onCheckedChange={handleConfidentialChange} 
              />
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="flex-1 p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 auto-rows-fr overflow-y-auto">
          {/* Debug: Show remote users count */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-20 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
              Remote Users: {remoteUsers.length}
              {remoteUsers.map((u: RemoteUser) => ` UID:${u.uid}`)}
              {agentId && ` | Agent: ${agentId}`}
            </div>
          )}
          
          {/* Remote Users */}
          {remoteUsers.map((user: RemoteUser) => (
            <div
              key={user.uid}
              className="relative rounded-lg sm:rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center min-h-[150px] sm:min-h-[200px] shadow-sm"
            >
              <div
                ref={(el: HTMLDivElement | null) => {
                  if (el) remoteVideoRefs.current.set(user.uid, el)
                }}
                className="w-full h-full"
              />
              {!user.videoTrack && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarFallback className="bg-sage text-white text-xl sm:text-2xl">
                      User {String(user.uid).slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              {/* Name Overlay */}
              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md bg-card/90 backdrop-blur-sm border border-border">
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  {String(user.uid) === "10001" || String(user.uid) === "10002" 
                    ? "AI Assistant" 
                    : `User ${String(user.uid)}`}
                </span>
              </div>
              {/* Mic Status Indicator */}
              {!user.audioTrack && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full bg-destructive/90">
                  <MicOff className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Local Video (if published) */}
          {isPublished && localTracks.videoTrack && (
            <div className="relative rounded-lg sm:rounded-xl bg-card border border-border overflow-hidden min-h-[150px] sm:min-h-[200px] shadow-sm bg-black w-full">
              {/* Video container - Agora will inject video element here */}
              <div 
                ref={localVideoRef} 
                className="w-full h-full"
                style={{ 
                  minHeight: '150px',
                  width: '100%',
                  display: 'block'
                }}
              />
              {/* Show overlay when video is disabled */}
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/95">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarFallback className="bg-sage text-white text-xl sm:text-2xl">You</AvatarFallback>
                  </Avatar>
                </div>
              )}
              {/* Name Overlay */}
              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md bg-card/90 backdrop-blur-sm border border-border z-10">
                <span className="text-xs sm:text-sm font-medium text-foreground">You</span>
              </div>
              {/* Mic Status Indicator */}
              {isMuted && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full bg-destructive/90 z-10">
                  <MicOff className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              )}
              {/* Audio Level Indicator - Visual feedback when mic is active */}
              {!isMuted && isPublished && audioLevel > 5 && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {/* Audio level bars */}
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-0.5 sm:w-1 rounded-full transition-all duration-100",
                          audioLevel > (i + 1) * 25
                            ? "bg-green-500 h-2 sm:h-3"
                            : audioLevel > i * 25
                            ? "bg-yellow-500 h-1.5 sm:h-2"
                            : "bg-gray-400 h-1 sm:h-1.5"
                        )}
                        style={{
                          height: audioLevel > (i + 1) * 25 
                            ? `${Math.min(12, 8 + (audioLevel - (i + 1) * 25) / 5)}px`
                            : audioLevel > i * 25
                            ? `${Math.min(8, 4 + (audioLevel - i * 25) / 5)}px`
                            : "4px"
                        }}
                      />
                    ))}
                  </div>
                  <Mic className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                </div>
              )}
              {/* Video Off Indicator */}
              {!isVideoEnabled && (
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 p-1.5 sm:p-2 rounded-full bg-destructive/90 z-10">
                  <VideoOff className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              )}
            </div>
          )}

          {/* Placeholder when not published */}
          {!isPublished && (
            <div className="relative rounded-lg sm:rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center min-h-[150px] sm:min-h-[200px] shadow-sm">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarFallback className="bg-sage text-white text-xl sm:text-2xl">You</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md bg-card/90 backdrop-blur-sm border border-border">
                <span className="text-xs sm:text-sm font-medium text-foreground">You</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Meeting Controls */}
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-full bg-card border border-border shadow-md z-10">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full h-10 w-10 sm:h-12 sm:w-12 hover:bg-secondary text-foreground relative",
              isMuted && "bg-destructive/20 text-destructive hover:bg-destructive/30",
              !isMuted && audioLevel > 5 && "ring-2 ring-green-500/50",
            )}
            onClick={async () => {
              console.log('Toggling audio, current state isMuted:', isMuted)
              // When isMuted=false (mic is ON), we want to mute it → setEnabled(false) → toggleAudio(false)
              // When isMuted=true (mic is OFF), we want to unmute it → setEnabled(true) → toggleAudio(true)
              // So we pass isMuted (the current muted state) to toggle to the opposite
              const newEnabledState = isMuted // If muted, enable. If not muted, disable.
              console.log('Calling toggleAudio with enabled:', newEnabledState)
              await toggleAudio(newEnabledState)
            }}
            disabled={!isPublished}
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                {/* Audio level indicator - animated bar at bottom of button */}
                {audioLevel > 5 && (
                  <div 
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 sm:h-1 bg-green-500 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min(80, (audioLevel / 100) * 80)}%` }} 
                  />
                )}
              </div>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full h-10 w-10 sm:h-12 sm:w-12 hover:bg-secondary text-foreground",
              !isVideoEnabled && "bg-destructive/20 text-destructive hover:bg-destructive/30",
            )}
            onClick={async () => {
              console.log('Toggling video, current state:', isVideoEnabled)
              await toggleVideo(!isVideoEnabled)
            }}
            disabled={!isPublished}
          >
            {isVideoEnabled ? <Video className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 sm:h-12 sm:w-12 text-foreground hover:bg-secondary">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 sm:h-12 sm:w-12 text-foreground hover:bg-secondary">
            <Hand className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="w-px h-6 sm:h-8 bg-border mx-0.5 sm:mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-destructive hover:bg-destructive/90 text-white"
            onClick={handleLeave}
          >
            <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {/* Right Sidebar - Intelligence Panel (Desktop Only) */}
      {!isMobile && (
        <div className="hidden lg:flex w-[350px] bg-card border-l border-border flex-col">
          <IntelligencePanel
            isTranscriptOpen={isTranscriptOpen}
            onTranscriptToggle={handleTranscriptToggle}
            pendingTasks={pendingTasks}
            confirmedTasks={confirmedTasks}
            onTaskToggle={toggleTaskConfirmation}
            transcript={mockTranscript}
          />
        </div>
      )}
    </div>
  )
}

