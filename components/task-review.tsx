"use client"

import { useState } from "react"
import { mockTasks, teamMembers, currentUser } from "@/lib/mock-data"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Check, X, Pencil, Calendar, UserIcon, AlertCircle, CheckCircle2 } from "lucide-react"

const confidenceColors = {
  high: "bg-confidence-high",
  medium: "bg-confidence-medium",
  low: "bg-confidence-low",
}

const confidenceLabels = {
  high: "High",
  medium: "Medium",
  low: "Low",
}

export function TaskReview() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [editingTask, setEditingTask] = useState<string | null>(null)

  const isManager = currentUser.role === "manager"

  // Filter tasks based on role
  const displayTasks = isManager ? tasks : tasks.filter((t) => t.owner.id === currentUser.id)

  const pendingTasks = displayTasks.filter((t) => !t.approved)
  const approvedTasks = displayTasks.filter((t) => t.approved)

  const handleApprove = (taskId: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, approved: true } : task)))
  }

  const handleReject = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const handleUpdateOwner = (taskId: string, ownerId: string) => {
    const newOwner = teamMembers.find((m) => m.id === ownerId)
    if (newOwner) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, owner: newOwner } : task)))
    }
  }

  const handleUpdateDate = (taskId: string, date: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, dueDate: date } : task)))
  }

  const handleUpdateTitle = (taskId: string, title: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, title } : task)))
    setEditingTask(null)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          {isManager ? "Task Review & Validation" : "My Tasks"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isManager
            ? "Review AI-extracted tasks and assign to team members"
            : "Confirm or request changes to your assigned tasks"}
        </p>
      </div>

      {/* Pending Approval Section */}
      {pendingTasks.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-clay" />
            <h2 className="text-lg font-semibold text-foreground">
              Pending {isManager ? "Approval" : "Confirmation"} ({pendingTasks.length})
            </h2>
          </div>

          <div className="space-y-4">
            {pendingTasks.map((task) => (
              <TaskReviewCard
                key={task.id}
                task={task}
                isManager={isManager}
                isEditing={editingTask === task.id}
                onEdit={() => setEditingTask(task.id)}
                onCancelEdit={() => setEditingTask(null)}
                onApprove={() => handleApprove(task.id)}
                onReject={() => handleReject(task.id)}
                onUpdateOwner={(ownerId) => handleUpdateOwner(task.id, ownerId)}
                onUpdateDate={(date) => handleUpdateDate(task.id, date)}
                onUpdateTitle={(title) => handleUpdateTitle(task.id, title)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved Section */}
      {approvedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-sage" />
            <h2 className="text-lg font-semibold text-foreground">
              {isManager ? "Approved" : "Confirmed"} ({approvedTasks.length})
            </h2>
          </div>

          <div className="space-y-3">
            {approvedTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", confidenceColors[task.confidence])} />
                <span className="flex-1 text-sm text-foreground">{task.title}</span>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={task.owner.avatar || "/placeholder.svg"} alt={task.owner.name} />
                      <AvatarFallback className="text-xs">{task.owner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{task.owner.name.split(" ")[0]}</span>
                  </div>
                  <span>
                    Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingTasks.length === 0 && approvedTasks.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle2 className="h-12 w-12 text-sage mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">All caught up!</h3>
          <p className="text-muted-foreground">No tasks to review at the moment.</p>
        </div>
      )}
    </div>
  )
}

interface TaskReviewCardProps {
  task: Task
  isManager: boolean
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onApprove: () => void
  onReject: () => void
  onUpdateOwner: (ownerId: string) => void
  onUpdateDate: (date: string) => void
  onUpdateTitle: (title: string) => void
}

function TaskReviewCard({
  task,
  isManager,
  isEditing,
  onEdit,
  onCancelEdit,
  onApprove,
  onReject,
  onUpdateOwner,
  onUpdateDate,
  onUpdateTitle,
}: TaskReviewCardProps) {
  const [editedTitle, setEditedTitle] = useState(task.title)

  return (
    <div className="rounded-xl bg-card border border-border p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Confidence Indicator */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <span className={cn("h-3 w-3 rounded-full", confidenceColors[task.confidence])} />
          <span className="text-[10px] text-muted-foreground capitalize">{confidenceLabels[task.confidence]}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {isEditing ? (
            <div className="flex items-center gap-2 mb-3">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button size="sm" onClick={() => onUpdateTitle(editedTitle)}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-2 mb-3">
              <h4 className="font-medium text-foreground">{task.title}</h4>
              {isManager && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={onEdit}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {task.description && <p className="text-sm text-muted-foreground mb-4">{task.description}</p>}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Owner */}
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              {isManager ? (
                <Select value={task.owner.id} onValueChange={onUpdateOwner}>
                  <SelectTrigger className="h-8 w-36 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {member.name.split(" ")[0]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={task.owner.avatar || "/placeholder.svg"} alt={task.owner.name} />
                    <AvatarFallback className="text-xs">{task.owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {task.owner.name}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {isManager ? (
                <Input
                  type="date"
                  value={task.dueDate}
                  onChange={(e) => onUpdateDate(e.target.value)}
                  className="h-8 w-36 text-sm"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 bg-transparent"
            onClick={onReject}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button size="icon" className="h-9 w-9 bg-sage hover:bg-sage/90" onClick={onApprove}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

