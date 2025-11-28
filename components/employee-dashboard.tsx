"use client"

import { StatCard } from "./stat-card"
import { TaskCard } from "./task-card"
import { Button } from "@/components/ui/button"
import { mockTasks, currentUser } from "@/lib/mock-data"
import { CheckCircle2, Clock, MessageSquare, AlertCircle, Sparkles, Send } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"

export function EmployeeDashboard() {
  // Filter tasks for current user
  const myTasks = mockTasks.filter((t) => t.owner.id === currentUser.id)
  const todoCount = myTasks.filter((t) => t.status === "todo").length
  const inProgressCount = myTasks.filter((t) => t.status === "in-progress").length
  const completedCount = myTasks.filter((t) => t.status === "done").length
  const needsAttention = myTasks.filter((t) => !t.approved).length

  const upcomingTasks = myTasks.filter((t) => t.status !== "done").slice(0, 4)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground text-balance">
            Good morning, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 text-pretty">
            Here&apos;s your work overview for today
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
          <Button variant="outline" className="gap-2 bg-transparent w-full sm:w-auto" asChild>
            <Link href="/tasks">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">My Tasks</span>
            </Link>
          </Button>
          <Button className="gap-2 bg-sage hover:bg-sage/90 w-full sm:w-auto" asChild>
            <Link href="/employee/request">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Request to Manager</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard title="To Do" value={todoCount} subtitle="tasks pending" icon={Clock} accentColor="dusty-blue" />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          subtitle="working on"
          icon={Clock}
          accentColor="clay"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          subtitle="finished tasks"
          icon={CheckCircle2}
          accentColor="sage"
        />
        <StatCard
          title="Needs Review"
          value={needsAttention}
          subtitle="pending approval"
          icon={AlertCircle}
          accentColor="default"
        />
      </div>

      {/* AI Request Feature Highlight */}
      <Card className="mb-6 sm:mb-8 p-6 border-2 border-sage/20 bg-sage-light/10 dark:bg-sage-light/5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage/10">
            <Sparkles className="h-6 w-6 text-sage" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-2">Need something from your manager?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use our AI assistant to communicate with your project manager. Request time off, resources, clarifications, or
              report blockers - the AI will format your message professionally and ensure it gets the right attention.
            </p>
            <Button className="gap-2 bg-sage hover:bg-sage/90" asChild>
              <Link href="/employee/request">
                <Send className="h-4 w-4" />
                Start AI Request
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">My Upcoming Tasks</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs sm:text-sm" asChild>
              <Link href="/tasks">View all</Link>
            </Button>
          </div>
          {upcomingTasks.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {upcomingTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-sage mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/employee/request">
              <Card className="p-4 hover:bg-accent transition-colors cursor-pointer border-border">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/10">
                    <MessageSquare className="h-5 w-5 text-sage" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground mb-1">Send Request</h4>
                    <p className="text-xs text-muted-foreground">Talk to AI to reach your manager</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/review">
              <Card className="p-4 hover:bg-accent transition-colors cursor-pointer border-border">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dusty-blue/10">
                    <CheckCircle2 className="h-5 w-5 text-dusty-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground mb-1">Review Tasks</h4>
                    <p className="text-xs text-muted-foreground">Confirm assigned tasks</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/meetings">
              <Card className="p-4 hover:bg-accent transition-colors cursor-pointer border-border">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clay/10">
                    <Clock className="h-5 w-5 text-clay" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground mb-1">View Meetings</h4>
                    <p className="text-xs text-muted-foreground">See meeting history</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
