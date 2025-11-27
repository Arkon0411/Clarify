export type UserRole = "manager" | "member"

export type TaskStatus = "todo" | "in-progress" | "review" | "done"

export type ConfidenceLevel = "high" | "medium" | "low"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  owner: User
  dueDate: string
  confidence: ConfidenceLevel
  meetingId?: string
  createdAt: string
  approved: boolean
}

export interface Meeting {
  id: string
  title: string
  date: string
  duration: number
  participants: User[]
  tasks: Task[]
  transcript?: string
  isLive?: boolean
}

export interface TeamActivity {
  id: string
  user: User
  action: string
  timestamp: string
}

