"use client";

import { AppLayout } from "@/components/app-layout"
import { TicketReviewList } from "@/components/ticket-review-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, ListTodo } from "lucide-react"

export default function ReviewPage() {
  const { userProfile } = useAuth();
  const isProjectManager = userProfile?.role === "PROJECT_MANAGER";

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            {isProjectManager ? "Review & Manage" : "My Requests"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isProjectManager
              ? "Review team tickets and manage AI-generated tasks"
              : "View your task requests and their status"}
          </p>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="tickets" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              AI Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="mt-6">
            <TicketReviewList />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>AI-generated task review coming soon</p>
              <p className="text-sm mt-2">For now, manage tasks in the Task Board</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

