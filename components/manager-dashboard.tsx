"use client"

import { StatCard } from "./stat-card"
import { MeetingCard } from "./meeting-card"
import { TaskCard } from "./task-card"
import { Button } from "@/components/ui/button"
import { mockTasks, mockMeetings, mockTeamActivity, currentUser } from "@/lib/mock-data"
import { CheckCircle2, Clock, AlertCircle, ListTodo, Video, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export function ManagerDashboard() {
  const todoCount = mockTasks.filter((t) => t.status === "todo").length
  const inProgressCount = mockTasks.filter((t) => t.status === "in-progress").length
  const pendingApproval = mockTasks.filter((t) => !t.approved).length
  const lowConfidenceTasks = mockTasks.filter((t) => t.confidence === "low").length

  const todaysTasks = mockTasks.filter((t) => t.status !== "done").slice(0, 3)
  const recentMeetings = mockMeetings.slice(0, 3)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground text-balance">
            Good morning, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 text-pretty">
            Here's what's happening with your team today
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
          <Button variant="outline" className="gap-2 bg-transparent w-full sm:w-auto" asChild>
            <Link href="/review">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Review Tasks</span>
            </Link>
          </Button>
          <Button className="gap-2 bg-charcoal hover:bg-charcoal/90 w-full sm:w-auto" asChild>
            <Link href="/meetings/live">
              <Video className="h-4 w-4" />
              <span className="text-sm">Start Meeting</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard title="To Do" value={todoCount} subtitle="tasks pending" icon={ListTodo} accentColor="dusty-blue" />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          subtitle="being worked on"
          icon={Clock}
          accentColor="clay"
        />
        <StatCard
          title="Pending Approval"
          value={pendingApproval}
          subtitle="need review"
          icon={CheckCircle2}
          accentColor="sage"
        />
        <StatCard
          title="Low Confidence"
          value={lowConfidenceTasks}
          subtitle="need attention"
          icon={AlertCircle}
          accentColor="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Today's Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Today's Tasks</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs sm:text-sm" asChild>
              <Link href="/tasks">
                View all
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {todaysTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Team Activity */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Team Activity</h2>
          <div className="rounded-xl bg-card border border-border p-3 sm:p-4 shadow-sm">
            <div className="space-y-3 sm:space-y-4">
              {mockTeamActivity.map((activity) => (
                <div key={activity.id} className="flex gap-2 sm:gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                    <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-foreground">
                      <span className="font-medium">{activity.user.name.split(" ")[0]}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Meetings */}
      <div className="mt-6 sm:mt-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Recent Meetings</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs sm:text-sm" asChild>
            <Link href="/meetings">
              View all
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {recentMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </div>
    </div>
  )
}

