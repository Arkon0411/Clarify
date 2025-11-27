"use client"

import { useState } from "react"
import { MeetingCard } from "./meeting-card"
import { Button } from "@/components/ui/button"
import { Video, Search, ChevronDown, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Meeting } from "@/lib/types"
import { currentUser } from "@/lib/mock-data"

export function MeetingsList() {
  const [scheduledMeetings, setScheduledMeetings] = useState<Meeting[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newMeetingTitle, setNewMeetingTitle] = useState("New Meeting")

  const handleStartInstantMeeting = () => {
    // Generate unique channel name
    const channelName = `meeting-${Date.now()}`
    const meetingTitle = "New Meeting"
    // Navigate to live meeting with channel and title
    window.location.href = `/meetings/live?channel=${channelName}&title=${encodeURIComponent(meetingTitle)}`
  }

  const handleCreateMeetingForLater = () => {
    setIsCreateDialogOpen(true)
  }

  const handleConfirmCreateMeeting = () => {
    // Generate unique channel name and meeting ID
    const channelName = `meeting-${Date.now()}`
    const meetingId = `scheduled-${Date.now()}`
    
    // Create new scheduled meeting
    const newMeeting: Meeting = {
      id: meetingId,
      title: newMeetingTitle.trim() || "New Meeting",
      date: new Date().toISOString(),
      duration: 0, // Will be set when meeting starts
      participants: [currentUser],
      tasks: [],
      isScheduled: true,
      channel: channelName,
    }

    // Add to scheduled meetings list
    setScheduledMeetings((prev) => [newMeeting, ...prev])
    setIsCreateDialogOpen(false)
    setNewMeetingTitle("New Meeting")
  }

  const handleDeleteMeeting = (meetingId: string) => {
    // Remove from scheduled meetings
    setScheduledMeetings((prev) => prev.filter((m) => m.id !== meetingId))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Meetings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">View meeting history and extracted tasks</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            className="gap-2 bg-charcoal hover:bg-charcoal/90 flex-1 sm:flex-none" 
            onClick={handleStartInstantMeeting}
          >
            <Video className="h-4 w-4" />
            Start Instant Meeting
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="px-2 sm:px-3 border-border bg-card hover:bg-secondary"
                aria-label="More meeting options"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCreateMeetingForLater} className="gap-2">
                <Calendar className="h-4 w-4" />
                Create Meeting for Later
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 sm:mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search meetings..." className="pl-10 bg-card border-border" />
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {scheduledMeetings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No meetings scheduled. Create one to get started!</p>
          </div>
        ) : (
          scheduledMeetings.map((meeting) => (
            <MeetingCard 
              key={meeting.id} 
              meeting={meeting}
              onDelete={() => handleDeleteMeeting(meeting.id)}
            />
          ))
        )}
      </div>

      {/* Create Meeting Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Meeting for Later</DialogTitle>
            <DialogDescription>
              Enter a title for your meeting. You'll be able to share the link and join later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meeting-title">Meeting Title</Label>
              <Input
                id="meeting-title"
                value={newMeetingTitle}
                onChange={(e) => setNewMeetingTitle(e.target.value)}
                placeholder="New Meeting"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmCreateMeeting()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCreateMeeting}>
              Create Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

