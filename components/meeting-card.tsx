import type { Meeting } from "@/lib/types"
import { Calendar, Clock, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MeetingCardProps {
  meeting: Meeting
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const formattedDate = new Date(meeting.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="rounded-xl bg-card p-3 sm:p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
      <h4 className="text-sm sm:text-base font-medium text-foreground mb-2.5 sm:mb-3 text-pretty leading-snug">
        {meeting.title}
      </h4>

      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2.5 sm:mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">{meeting.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>{meeting.participants.length}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex -space-x-2">
          {meeting.participants.slice(0, 4).map((participant) => (
            <Avatar key={participant.id} className="h-6 w-6 sm:h-7 sm:w-7 border-2 border-card">
              <AvatarImage src={participant.avatar || "/placeholder.svg"} alt={participant.name} />
              <AvatarFallback className="text-xs">{participant.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
          {meeting.participants.length > 4 && (
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs text-muted-foreground">
              +{meeting.participants.length - 4}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{meeting.tasks.length} tasks</span>
      </div>
    </div>
  )
}

