"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskBoard } from "@/components/task-board";
import { MeetingsList } from "@/components/meetings-list";
import { StatCard } from "@/components/stat-card";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="My Tasks"
          value="8"
          subtitle="Active tasks assigned to you"
          icon={Clock}
          accentColor="dusty-blue"
        />
        <StatCard
          title="Completed"
          value="12"
          subtitle="Tasks completed this month"
          icon={CheckCircle2}
          accentColor="sage"
        />
        <StatCard
          title="Overdue"
          value="2"
          subtitle="Tasks past due date"
          icon={AlertCircle}
          accentColor="clay"
        />
      </div>

      {/* My Tasks Board */}
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskBoard />
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>My Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingsList />
        </CardContent>
      </Card>
    </div>
  );
}
