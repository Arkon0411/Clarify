"use client"

import { mockMeetings } from "@/lib/mock-data"
import { MeetingCard } from "./meeting-card"
import { Button } from "@/components/ui/button"
import { Video, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function MeetingsList() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-1">View meeting history and extracted tasks</p>
        </div>
        <Button className="gap-2 bg-charcoal hover:bg-charcoal/90" asChild>
          <Link href="/meetings/live">
            <Video className="h-4 w-4" />
            Start Meeting
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search meetings..." className="pl-10 bg-card border-border" />
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockMeetings.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>
    </div>
  )
}

