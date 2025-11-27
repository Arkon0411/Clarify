import type { Task } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

const confidenceColors = {
  high: "bg-confidence-high",
  medium: "bg-confidence-medium",
  low: "bg-confidence-low",
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const formattedDate = new Date(task.dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  return (
    <div
      className={cn(
        "rounded-xl bg-card p-3 sm:p-4 shadow-sm border border-border transition-shadow",
        isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
        <h4 className="text-xs sm:text-sm font-medium text-foreground leading-snug text-pretty flex-1 min-w-0">
          {task.title}
        </h4>
        <span
          className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0 mt-0.5 sm:mt-1", confidenceColors[task.confidence])}
          title={`${task.confidence} confidence`}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Avatar className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
            <AvatarImage src={task.owner.avatar || "/placeholder.svg"} alt={task.owner.name} />
            <AvatarFallback>
              <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">{task.owner.name.split(" ")[0]}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Calendar className="h-3 w-3" />
          <span className="whitespace-nowrap">{formattedDate}</span>
        </div>
      </div>
    </div>
  )
}

