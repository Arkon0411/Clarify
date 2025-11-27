"use client"

import { mockMeetings } from "@/lib/mock-data"
import { MeetingCard } from "./meeting-card"
import { Button } from "@/components/ui/button"
import { Video, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function MeetingsList() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Meetings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">View meeting history and extracted tasks</p>
        </div>
        <Button className="gap-2 bg-charcoal hover:bg-charcoal/90 w-full sm:w-auto" asChild>
          <Link href="/meetings/live">
            <Video className="h-4 w-4" />
            Start Meeting
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 sm:mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search meetings..." className="pl-10 bg-card border-border" />
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {mockMeetings.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>
    </div>
  )
}

