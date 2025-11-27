"use client"

import type React from "react"

import { useState } from "react"
import { mockTasks } from "@/lib/mock-data"
import type { Task, TaskStatus } from "@/lib/types"
import { TaskCard } from "./task-card"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
]

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(status)
  }

  const handleDrop = (status: TaskStatus) => {
    if (draggedTask && draggedTask.status !== status) {
      setTasks((prev) => prev.map((task) => (task.id === draggedTask.id ? { ...task, status } : task)))
    }
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Task Board</h1>
          <p className="text-muted-foreground mt-1">Drag and drop to update task status</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="gap-2 bg-charcoal hover:bg-charcoal/90">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-5 h-full min-w-max">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id)
            const isOver = dragOverColumn === column.id

            return (
              <div
                key={column.id}
                className="w-80 flex flex-col"
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{column.title}</h3>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div
                  className={cn(
                    "flex-1 rounded-xl bg-secondary/50 dark:bg-secondary/70 p-3 space-y-3 transition-colors min-h-[200px]",
                    isOver && "bg-sage-light/50 dark:bg-sage-light/30 ring-2 ring-sage/30 dark:ring-sage/50",
                  )}
                >
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onDragEnd={handleDragEnd}
                      className={cn("cursor-grab active:cursor-grabbing", draggedTask?.id === task.id && "opacity-50")}
                    >
                      <TaskCard task={task} isDragging={draggedTask?.id === task.id} />
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">No tasks</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

