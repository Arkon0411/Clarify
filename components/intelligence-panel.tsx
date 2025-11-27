"use client"

import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface IntelligencePanelProps {
  isTranscriptOpen: boolean
  onTranscriptToggle: () => void
  pendingTasks: DetectedTask[]
  confirmedTasks: DetectedTask[]
  onTaskToggle: (taskId: string) => void
  transcript: TranscriptEntry[]
}

const confidenceColors = {
  high: "bg-confidence-high",
  medium: "bg-confidence-medium",
  low: "bg-confidence-low",
}

export function IntelligencePanel({
  isTranscriptOpen,
  onTranscriptToggle,
  pendingTasks,
  confirmedTasks,
  onTaskToggle,
  transcript,
}: IntelligencePanelProps) {
  return (
    <>
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-border bg-sage-light/30 dark:bg-sage-light/20">
        <h2 className="font-semibold text-foreground">Meeting Intelligence</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time insights</p>
      </div>

      {/* Real-time Transcript */}
      <div className="flex flex-col border-b border-border overflow-hidden">
        <button
          onClick={onTranscriptToggle}
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
            {transcript.map((entry) => (
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
                    onClick={() => onTaskToggle(task.id)}
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
                    onClick={() => onTaskToggle(task.id)}
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
    </>
  )
}

