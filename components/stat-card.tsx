import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  accentColor?: "sage" | "dusty-blue" | "clay" | "default"
}

const accentStyles = {
  sage: "bg-sage-light text-sage",
  "dusty-blue": "bg-dusty-blue-light text-dusty-blue",
  clay: "bg-clay-light text-clay",
  default: "bg-secondary text-muted-foreground",
}

export function StatCard({ title, value, subtitle, icon: Icon, accentColor = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-3.5 sm:p-5 shadow-sm border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-semibold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={cn("rounded-lg p-2 sm:p-2.5 flex-shrink-0", accentStyles[accentColor])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  )
}

