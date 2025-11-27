import { AppLayout } from "@/components/app-layout"
import { TaskReview } from "@/components/task-review"
import { ProtectedRoute } from "@/components/protected-route"

export default function ReviewPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <TaskReview />
      </AppLayout>
    </ProtectedRoute>
  )
}

