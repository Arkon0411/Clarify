"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
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
  const [elapsedTime, setElapsedTime] = useState(105)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isConfidential, setIsConfidential] = useState(false)
  const [detectedTasks, setDetectedTasks] = useState(mockDetectedTasks)
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleTaskConfirmation = (taskId: string) => {
    setDetectedTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, confirmed: !task.confirmed } : task)),
    )
  }

  const pendingTasks = detectedTasks.filter((t) => !t.confirmed)
  const confirmedTasks = detectedTasks.filter((t) => t.confirmed)

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Center Stage - Video Grid */}
      <div className="flex-1 flex flex-col bg-secondary/30 dark:bg-secondary/10 relative">
        {/* Meeting Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <h1 className="font-semibold text-foreground">Weekly Team Standup</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTime(elapsedTime)}
            </div>
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
        <div className="px-6 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Participants:</span>
            <div className="flex -space-x-2">
              {teamMembers.map((member, idx) => (
                <Avatar key={member.id} className="h-7 w-7 border-2 border-card">
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

        {/* 2x2 Video Grid */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
          {teamMembers.map((member, idx) => (
            <div
              key={member.id}
              className="relative rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center min-h-[200px] shadow-sm"
            >
              {/* Avatar/Initials */}
              <Avatar className="h-20 w-20">
                <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                <AvatarFallback className="bg-sage text-white text-2xl">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              {/* Name Overlay */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-card/90 backdrop-blur-sm border border-border">
                <span className="text-sm font-medium text-foreground">{member.name}</span>
              </div>

              {/* Mic Status Indicator */}
              {idx === 0 && isMuted && (
                <div className="absolute top-3 right-3 p-2 rounded-full bg-destructive/90">
                  <MicOff className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Floating Meeting Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border shadow-md">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full h-12 w-12 hover:bg-secondary text-foreground",
              isMuted && "bg-destructive/20 text-destructive hover:bg-destructive/30",
            )}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full h-12 w-12 hover:bg-secondary text-foreground",
              !isVideoOn && "bg-destructive/20 text-destructive hover:bg-destructive/30",
            )}
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-foreground hover:bg-secondary">
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-foreground hover:bg-secondary">
            <Hand className="h-5 w-5" />
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12 bg-destructive hover:bg-destructive/90 text-white"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Right Sidebar - Intelligence Panel */}
      <div className="w-[350px] bg-card border-l border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="px-4 py-3 border-b border-border bg-sage-light/30 dark:bg-sage-light/20">
          <h2 className="font-semibold text-foreground">Meeting Intelligence</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time insights</p>
        </div>

        {/* Real-time Transcript */}
        <div className="flex flex-col border-b border-border overflow-hidden">
          <button
            onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
            className="flex items-center justify-between px-4 py-2.5 bg-sage-light/20 dark:bg-sage-light/10 border-b border-border hover:bg-sage-light/30 dark:hover:bg-sage-light/20 transition-colors"
          >
            <h3 className="text-sm font-medium text-foreground">Real-time Transcript</h3>
            {isTranscriptOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <div
            className={cn(
              "overflow-y-auto transition-all duration-300 ease-in-out",
              isTranscriptOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0",
            )}
          >
            <div className="p-4 space-y-3">
              {mockTranscript.map((entry) => (
                <div key={entry.id} className="flex gap-2">
                  <div className={cn("h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0", entry.speakerColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-foreground">{entry.speaker}</span>
                      <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detected Tasks */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 bg-clay-light/20 dark:bg-clay-light/10 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Detected Tasks</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Pending Confirmation */}
            {pendingTasks.length > 0 && (
              <div className="p-3 border-b border-border">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Pending Confirmation ({pendingTasks.length})
                </h4>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTaskConfirmation(task.id)}
                      className="w-full text-left p-2.5 rounded-lg bg-secondary/50 dark:bg-secondary/70 hover:bg-secondary dark:hover:bg-secondary/80 transition-colors border border-border/50 dark:border-border/70"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0",
                            confidenceColors[task.confidence],
                          )}
                        />
                        <span className="text-sm text-foreground leading-snug">{task.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Tasks */}
            {confirmedTasks.length > 0 && (
              <div className="p-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Confirmed ({confirmedTasks.length})
                </h4>
                <div className="space-y-2">
                  {confirmedTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTaskConfirmation(task.id)}
                      className="w-full text-left p-2.5 rounded-lg bg-sage-light/40 dark:bg-sage-light/20 hover:bg-sage-light/60 dark:hover:bg-sage-light/30 transition-colors border border-sage/20 dark:border-sage/30"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-sage mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground leading-snug">{task.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

