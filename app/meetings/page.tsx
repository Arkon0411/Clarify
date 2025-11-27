import { AppLayout } from "@/components/app-layout"
import { MeetingsList } from "@/components/meetings-list"
import { ProtectedRoute } from "@/components/protected-route"

export default function MeetingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <MeetingsList />
      </AppLayout>
    </ProtectedRoute>
  )
}

