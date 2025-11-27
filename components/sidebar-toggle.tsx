"use client"

import { Menu } from "lucide-react"
import { useSidebar } from "@/hooks/use-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export function SidebarToggle() {
  const { toggle } = useSidebar()
  const isMobile = useIsMobile()

  return (
    <button
      onClick={() => toggle()}
      className={cn(
        "rounded-lg p-2 hover:bg-secondary transition-colors",
        "text-muted-foreground hover:text-foreground",
        isMobile ? "block" : "hidden",
      )}
      aria-label="Toggle sidebar"
    >
      <Menu className="h-6 w-6" />
    </button>
  )
}

