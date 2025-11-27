import type { Meeting } from "@/lib/types"
import { Calendar, Clock, Users, Copy, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface MeetingCardProps {
  meeting: Meeting
  onDelete?: () => void
}

export function MeetingCard({ meeting, onDelete }: MeetingCardProps) {
  const { toast } = useToast()
  const formattedDate = new Date(meeting.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const handleCopyLink = async () => {
    if (!meeting.channel) return

    const meetingUrl = `${window.location.origin}/meetings/live?channel=${meeting.channel}&title=${encodeURIComponent(meeting.title)}`
    
    try {
      await navigator.clipboard.writeText(meetingUrl)
      toast({
        title: "Link copied!",
        description: "Meeting link has been copied to clipboard.",
      })
    } catch (error) {
      console.error("Failed to copy link:", error)
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleJoinMeeting = () => {
    if (meeting.isScheduled && meeting.channel) {
      window.location.href = `/meetings/live?channel=${meeting.channel}&title=${encodeURIComponent(meeting.title)}`
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete()
    }
  }

  return (
    <div 
      className={`rounded-xl bg-card p-3 sm:p-4 shadow-sm border border-border hover:shadow-md transition-shadow ${
        meeting.isScheduled ? "cursor-pointer" : ""
      }`}
      onClick={meeting.isScheduled ? handleJoinMeeting : undefined}
    >
      <h4 className="text-sm sm:text-base font-medium text-foreground mb-2.5 sm:mb-3 text-pretty leading-snug">
        {meeting.title}
      </h4>

      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2.5 sm:mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">{formattedDate}</span>
        </div>
        {meeting.duration > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{meeting.duration} min</span>
          </div>
        )}
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
        {!meeting.isScheduled && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{meeting.tasks.length} tasks</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {meeting.isScheduled && meeting.channel && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 text-xs h-8"
            onClick={handleCopyLink}
          >
            <Copy className="h-3 w-3" />
            Copy Link
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 ${
              meeting.isScheduled && meeting.channel ? "" : "flex-1"
            }`}
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}

