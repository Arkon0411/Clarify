import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { currentUser } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-foreground mb-8">Settings</h1>

        {/* Profile Section */}
        <div className="rounded-xl bg-card border border-border p-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{currentUser.name}</p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" defaultValue={currentUser.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={currentUser.email} />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="rounded-xl bg-card border border-border p-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Task assignments</p>
                <p className="text-xs text-muted-foreground">Get notified when tasks are assigned to you</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Meeting reminders</p>
                <p className="text-xs text-muted-foreground">Receive reminders before meetings start</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Task updates</p>
                <p className="text-xs text-muted-foreground">Get notified about task status changes</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* AI Settings Section */}
        <div className="rounded-xl bg-card border border-border p-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">AI Assistant</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-detect tasks</p>
                <p className="text-xs text-muted-foreground">Automatically extract tasks from meetings</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Confidence thresholds</p>
                <p className="text-xs text-muted-foreground">Show low-confidence tasks for review</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <Button className="bg-charcoal hover:bg-charcoal/90">Save Changes</Button>
      </div>
    </AppLayout>
  )
}

