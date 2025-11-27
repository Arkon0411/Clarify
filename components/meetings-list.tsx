"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMeetingsByOrganization, createMeeting } from "@/lib/database-operations"
import { MeetingCard } from "./meeting-card"
import { Button } from "@/components/ui/button"
import { Video, Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { Meeting } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function MeetingsList() {
  const { user, userProfile } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const loadMeetings = useCallback(async () => {
    if (!userProfile?.organizationId) return
    
    try {
      setIsLoading(true)
      const data = await getMeetingsByOrganization(userProfile.organizationId)
      setMeetings(data)
    } catch (error) {
      console.error("Failed to load meetings:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userProfile?.organizationId])

  useEffect(() => {
    if (userProfile?.organizationId) {
      loadMeetings()
    }
  }, [userProfile?.organizationId, loadMeetings])

  const handleStartMeeting = async () => {
    if (!user || !userProfile?.organizationId) {
      alert("Please complete your profile setup")
      return
    }

    if (!meetingTitle.trim()) {
      alert("Please enter a meeting title")
      return
    }

    try {
      setIsCreating(true)
      
      // Generate unique channel name
      const channelName = `meeting-${Date.now()}`

      // Create meeting in database
      const meeting = await createMeeting({
        organizationId: userProfile.organizationId,
        title: meetingTitle,
        channelName: channelName,
        status: "LIVE",
        startedAt: new Date().toISOString(),
        createdBy: user.userId,
        participants: [user.userId],
      })

      if (!meeting) {
        throw new Error("Failed to create meeting")
      }

      // Navigate to live meeting
      window.location.href = `/meetings/live?channel=${channelName}&title=${encodeURIComponent(meetingTitle)}&meetingId=${meeting.id}`
    } catch (error) {
      console.error("Failed to create meeting:", error)
      alert("Failed to start meeting. Please try again.")
    } finally {
      setIsCreating(false)
      setIsDialogOpen(false)
      setMeetingTitle("")
    }
  }

  const handleQuickStart = () => {
    // Quick start with default title
    setMeetingTitle("Quick Meeting")
    setTimeout(() => {
      handleStartMeeting()
    }, 100)
  }

  const filteredMeetings = meetings.filter((meeting) =>
    meeting.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Meetings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            View meeting history and extracted tasks
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-charcoal hover:bg-charcoal/90 w-full sm:w-auto">
              <Video className="h-4 w-4" />
              Start Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Meeting</DialogTitle>
              <DialogDescription>
                Enter a title for your meeting or quick start with a default name
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Sprint Planning, Daily Standup"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && meetingTitle.trim()) {
                      handleStartMeeting()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleQuickStart}
                disabled={isCreating}
              >
                Quick Start
              </Button>
              <Button
                onClick={handleStartMeeting}
                disabled={!meetingTitle.trim() || isCreating}
              >
                {isCreating ? <Spinner className="h-4 w-4" /> : "Start Meeting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-4 sm:mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meetings..."
          className="pl-10 bg-card border-border"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Meetings Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? "No meetings found" : "No meetings yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Try adjusting your search"
              : "Start your first meeting to begin collaborating"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start Meeting
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  )
}

