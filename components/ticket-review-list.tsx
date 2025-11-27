"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { getOpenTickets, updateTicket, getTasksByOrganization } from "@/lib/database-operations";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  taskId: string;
  type: string | null;
  subject: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  createdBy: string;
  createdAt: string | null;
  [key: string]: unknown;
}

export function TicketReviewList() {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tasks, setTasks] = useState<Map<string, Task>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [resolutions, setResolutions] = useState<Map<string, string>>(new Map());
  const [processingTicket, setProcessingTicket] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    if (!userProfile?.organizationId) return;

    try {
      setIsLoading(true);
      const [ticketData, taskData] = await Promise.all([
        getOpenTickets(userProfile.organizationId),
        getTasksByOrganization(userProfile.organizationId),
      ]);

      // Create task map for quick lookup
      const taskMap = new Map();
      taskData.forEach((task) => taskMap.set(task.id, task));

      setTickets(ticketData);
      setTasks(taskMap);
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.organizationId]);

  useEffect(() => {
    if (userProfile?.organizationId) {
      loadTickets();
    }
  }, [userProfile?.organizationId, loadTickets]);

  const handleResolve = async (ticketId: string, status: "RESOLVED" | "REJECTED") => {
    const resolution = resolutions.get(ticketId);
    
    if (!resolution?.trim()) {
      alert("Please provide a resolution message");
      return;
    }

    try {
      setProcessingTicket(ticketId);

      await updateTicket(ticketId, {
        status,
        resolution,
        resolvedAt: new Date().toISOString(),
      });

      // Refresh tickets
      await loadTickets();
      
      // Clear resolution
      setResolutions((prev) => {
        const newMap = new Map(prev);
        newMap.delete(ticketId);
        return newMap;
      });
    } catch (error) {
      console.error("Failed to update ticket:", error);
      alert("Failed to update ticket");
    } finally {
      setProcessingTicket(null);
    }
  };

  const typeLabels = {
    DEADLINE_EXTENSION: "Deadline Extension",
    RESOURCE_REQUEST: "Resource Request",
    CLARIFICATION: "Clarification",
    BLOCKER: "Blocker",
    OTHER: "Other",
  };

  const priorityColors = {
    LOW: "bg-blue-500/10 text-blue-500",
    MEDIUM: "bg-yellow-500/10 text-yellow-500",
    HIGH: "bg-red-500/10 text-red-500",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Open Tickets</h3>
        <p className="text-muted-foreground">
          All team requests have been addressed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const task = tasks.get(ticket.taskId);
        const isProcessing = processingTicket === ticket.id;

        return (
          <Card key={ticket.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                  <CardDescription className="mt-1">
                    Regarding: <strong>{task?.title || "Unknown Task"}</strong>
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {ticket.priority && (
                    <Badge className={cn("text-xs", priorityColors[ticket.priority as keyof typeof priorityColors])}>
                      {ticket.priority}
                    </Badge>
                  )}
                  {ticket.type && (
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[ticket.type as keyof typeof typeLabels]}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Request Details</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Submitted {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Unknown'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Resolution / Response
                </label>
                <Textarea
                  placeholder="Provide your response or resolution..."
                  value={resolutions.get(ticket.id) || ""}
                  onChange={(e) =>
                    setResolutions((prev) => {
                      const newMap = new Map(prev);
                      newMap.set(ticket.id, e.target.value);
                      return newMap;
                    })
                  }
                  rows={3}
                  disabled={isProcessing}
                />
              </div>
            </CardContent>

            <CardFooter className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => handleResolve(ticket.id, "REJECTED")}
                disabled={isProcessing || !resolutions.get(ticket.id)?.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleResolve(ticket.id, "RESOLVED")}
                disabled={isProcessing || !resolutions.get(ticket.id)?.trim()}
              >
                {isProcessing ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Resolve
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
