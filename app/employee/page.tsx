import { AppLayout } from "@/components/app-layout"
import { EmployeeDashboard } from "@/components/employee-dashboard"
import { ProtectedRoute } from "@/components/protected-route"

export default function EmployeePage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <EmployeeDashboard />
      </AppLayout>
    </ProtectedRoute>
  )
}
