import type { User, Task, Meeting, TeamActivity } from "./types"

export const currentUser: User = {
  id: "1",
  name: "Sarah Chen",
  email: "sarah@company.com",
  avatar: "/professional-woman-avatar.png",
  role: "manager",
}

export const teamMembers: User[] = [
  currentUser,
  {
    id: "2",
    name: "Alex Rivera",
    email: "alex@company.com",
    avatar: "/professional-man-avatar.png",
    role: "member",
  },
  {
    id: "3",
    name: "Jordan Kim",
    email: "jordan@company.com",
    avatar: "/professional-avatar.png",
    role: "member",
  },
  {
    id: "4",
    name: "Taylor Smith",
    email: "taylor@company.com",
    avatar: "/professional-woman-smiling-avatar.png",
    role: "member",
  },
]

export const mockTasks: Task[] = [
  {
    id: "1",
    title: "Update Q4 sales projections",
    description: "Review and update the quarterly sales forecast based on current trends",
    status: "todo",
    owner: teamMembers[1],
    dueDate: "2025-12-01",
    confidence: "high",
    meetingId: "1",
    createdAt: "2025-11-25",
    approved: true,
  },
  {
    id: "2",
    title: "Prepare client presentation deck",
    description: "Create slides for the upcoming client meeting",
    status: "in-progress",
    owner: teamMembers[2],
    dueDate: "2025-11-29",
    confidence: "medium",
    meetingId: "1",
    createdAt: "2025-11-25",
    approved: true,
  },
  {
    id: "3",
    title: "Review marketing budget allocation",
    status: "review",
    owner: teamMembers[3],
    dueDate: "2025-11-30",
    confidence: "high",
    meetingId: "2",
    createdAt: "2025-11-24",
    approved: true,
  },
  {
    id: "4",
    title: "Schedule team retrospective",
    status: "done",
    owner: teamMembers[0],
    dueDate: "2025-11-26",
    confidence: "high",
    meetingId: "2",
    createdAt: "2025-11-24",
    approved: true,
  },
  {
    id: "5",
    title: "Draft product roadmap for 2026",
    description: "Outline key milestones and features for next year",
    status: "todo",
    owner: teamMembers[1],
    dueDate: "2025-12-05",
    confidence: "low",
    meetingId: "3",
    createdAt: "2025-11-26",
    approved: false,
  },
  {
    id: "6",
    title: "Coordinate with engineering on API updates",
    status: "in-progress",
    owner: teamMembers[2],
    dueDate: "2025-12-02",
    confidence: "medium",
    meetingId: "3",
    createdAt: "2025-11-26",
    approved: true,
  },
]

export const mockMeetings: Meeting[] = [
  {
    id: "1",
    title: "Weekly Team Standup",
    date: "2025-11-25",
    duration: 30,
    participants: teamMembers,
    tasks: mockTasks.filter((t) => t.meetingId === "1"),
  },
  {
    id: "2",
    title: "Q4 Planning Session",
    date: "2025-11-24",
    duration: 60,
    participants: [teamMembers[0], teamMembers[2], teamMembers[3]],
    tasks: mockTasks.filter((t) => t.meetingId === "2"),
  },
  {
    id: "3",
    title: "Product Strategy Review",
    date: "2025-11-26",
    duration: 45,
    participants: teamMembers,
    tasks: mockTasks.filter((t) => t.meetingId === "3"),
  },
]

export const mockTeamActivity: TeamActivity[] = [
  {
    id: "1",
    user: teamMembers[1],
    action: 'completed "Schedule team retrospective"',
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    user: teamMembers[2],
    action: 'moved "Prepare client presentation" to In Progress',
    timestamp: "3 hours ago",
  },
  {
    id: "3",
    user: teamMembers[3],
    action: 'submitted "Review marketing budget" for review',
    timestamp: "5 hours ago",
  },
]

