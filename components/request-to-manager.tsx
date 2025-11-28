"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { currentUser } from "@/lib/mock-data"
import {
  Send,
  Sparkles,
  Clock,
  FileText,
  AlertCircle,
  User,
  Calendar,
  Loader2,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface Request {
  id: string
  type: string
  subject: string
  message: string
  status: "draft" | "sent" | "pending" | "approved" | "rejected"
  timestamp: Date
}

const quickActions = [
  { icon: Clock, label: "Request Time Off", color: "dusty-blue" },
  { icon: FileText, label: "Request Resources", color: "clay" },
  { icon: AlertCircle, label: "Report Blocker", color: "default" },
  { icon: MessageSquare, label: "Ask Question", color: "sage" },
]

const mockRequests: Request[] = [
  {
    id: "1",
    type: "Time Off",
    subject: "PTO Request - Dec 20-22",
    message: "Requesting time off for holiday travel",
    status: "approved",
    timestamp: new Date(2025, 10, 20),
  },
  {
    id: "2",
    type: "Resources",
    subject: "Additional Design Tools",
    message: "Need Figma pro license for upcoming project",
    status: "pending",
    timestamp: new Date(2025, 10, 25),
  },
]

export function RequestToManager() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI assistant. I can help you communicate with your project manager. What would you like to request or discuss today?",
      timestamp: new Date(),
      suggestions: ["Request time off", "Report a blocker", "Ask for resources", "Request clarification"],
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getAIResponse = async (userMessage: string) => {
    setIsTyping(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions || [],
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("AI response error:", error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        suggestions: ["Try again", "Contact support"],
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    getAIResponse(inputValue)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    textareaRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-dusty-blue/20 text-dusty-blue border-dusty-blue/30",
    pending: "bg-clay/20 text-clay border-clay/30",
    approved: "bg-sage/20 text-sage border-sage/30",
    rejected: "bg-destructive/20 text-destructive border-destructive/30",
  }

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-card border-b border-border">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/10 flex-shrink-0">
              <Sparkles className="h-5 w-5 text-sage" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-foreground">AI Manager Assistant</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Communicate with your project manager</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="hidden sm:flex gap-2"
          >
            <FileText className="h-4 w-4" />
            {showHistory ? "Hide" : "Show"} History
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 sm:px-6 py-3 bg-sage-light/10 dark:bg-sage-light/5 border-b border-border">
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="gap-2 whitespace-nowrap flex-shrink-0 bg-card"
                onClick={() => setInputValue(action.label)}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}>
              <Avatar className="h-8 w-8 flex-shrink-0">
                {message.role === "user" ? (
                  <>
                    <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-sage/10">
                    <Sparkles className="h-4 w-4 text-sage" />
                  </AvatarFallback>
                )}
              </Avatar>

              <div className={cn("flex-1 min-w-0", message.role === "user" && "flex justify-end")}>
                <div
                  className={cn(
                    "inline-block rounded-2xl px-4 py-2.5 max-w-[85%] sm:max-w-[75%]",
                    message.role === "user"
                      ? "bg-sage text-white"
                      : "bg-card border border-border text-foreground",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs bg-card"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-sage/10">
                  <Sparkles className="h-4 w-4 text-sage" />
                </AvatarFallback>
              </Avatar>
              <div className="inline-block rounded-2xl px-4 py-3 bg-card border border-border">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4 sm:p-6">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message to the AI assistant..."
              className="min-h-[60px] max-h-[200px] resize-none"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-sage hover:bg-sage/90 h-[60px] px-6"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            The AI will help format your request professionally before sending it to your manager
          </p>
        </div>
      </div>

      {/* Right Sidebar - Request History */}
      <div
        className={cn(
          "w-full lg:w-80 bg-card border-l border-border overflow-y-auto transition-all duration-300",
          showHistory ? "block" : "hidden lg:block",
        )}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Request History</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="lg:hidden">
              Close
            </Button>
          </div>

          <div className="space-y-3">
            {mockRequests.map((request) => (
              <Card key={request.id} className="p-4 border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{request.type}</span>
                  <Badge variant="outline" className={cn("text-xs", statusColors[request.status])}>
                    {request.status}
                  </Badge>
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">{request.subject}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{request.message}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {request.timestamp.toLocaleDateString()}
                </div>
              </Card>
            ))}

            {mockRequests.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No requests yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
