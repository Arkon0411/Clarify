import { Suspense } from "react"
import { AppLayout } from "@/components/app-layout"
import { MeetingLiveView } from "@/components/meeting-live-view"

export default function LiveMeetingPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div>Loading meeting...</div>}>
        <MeetingLiveView />
      </Suspense>
    </AppLayout>
  )
}

