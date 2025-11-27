"use client";

import { useState } from "react";
import { createTicket } from "@/lib/database-operations";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateTicketDialogProps {
  taskId: string;
  taskTitle: string;
  assignedBy?: string;
  onTicketCreated?: () => void;
  children?: React.ReactNode;
}

export function CreateTicketDialog({
  taskId,
  taskTitle,
  assignedBy,
  onTicketCreated,
  children,
}: CreateTicketDialogProps) {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    type: "DEADLINE_EXTENSION" as const,
    subject: "",
    description: "",
    priority: "MEDIUM" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user || !userProfile?.organizationId) {
      setError("User not authenticated");
      return;
    }

    if (!formData.subject.trim() || !formData.description.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      await createTicket({
        organizationId: userProfile.organizationId,
        taskId,
        type: formData.type,
        subject: formData.subject,
        description: formData.description,
        createdBy: user.userId,
        assignedTo: assignedBy, // Assign to task creator (PM)
        status: "OPEN",
        priority: formData.priority,
      });

      // Reset form
      setFormData({
        type: "DEADLINE_EXTENSION",
        subject: "",
        description: "",
        priority: "MEDIUM",
      });

      setIsOpen(false);
      onTicketCreated?.();
    } catch (err: unknown) {
      console.error("Error creating ticket:", err);
      const error = err as { message?: string };
      setError(error.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ticketTypes = [
    { value: "DEADLINE_EXTENSION", label: "Deadline Extension" },
    { value: "RESOURCE_REQUEST", label: "Resource Request" },
    { value: "CLARIFICATION", label: "Need Clarification" },
    { value: "BLOCKER", label: "Blocker" },
    { value: "OTHER", label: "Other" },
  ];

  const priorities = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            Request Help
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Ticket</DialogTitle>
          <DialogDescription>
            Request help or report an issue for: <strong>{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, type: value as typeof formData.type }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief summary of the issue"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide details about your request..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, priority: value as typeof formData.priority }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
