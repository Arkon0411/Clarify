import { AppLayout } from "@/components/app-layout"
import { ManagerDashboard } from "@/components/manager-dashboard"
import { currentUser } from "@/lib/mock-data"

export default function DashboardPage() {
  // In a real app, this would come from auth context
  const isManager = currentUser.role === "manager"

  return <AppLayout>{isManager ? <ManagerDashboard /> : <MemberDashboard />}</AppLayout>
}

function MemberDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">My Dashboard</h1>
      {/* Member dashboard implementation */}
    </div>
  )
}
