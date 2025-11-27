"use client"

import type React from "react"
import { useEffect } from "react"
import { Sidebar } from "./sidebar"
import { useSidebar } from "@/hooks/use-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { PanelLeft } from "lucide-react"
import { Button } from "./ui/button"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, close, toggle } = useSidebar()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) {
      close()
    }
  }, [isMobile, close])

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out ${isOpen ? "md:w-64" : "md:w-0"} overflow-hidden hidden md:block`}
      >
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => close()} />}

      {/* Mobile Sidebar */}
      {isMobile && isOpen && (
        <div className="fixed left-0 top-0 z-50 h-screen w-64 overflow-hidden">
          <Sidebar isMobile />
        </div>
      )}

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header with Toggle */}
        <header className="flex h-16 items-center border-b border-border bg-card px-4 md:px-6">
          <Button variant="ghost" size="icon" onClick={() => toggle()} aria-label="Toggle sidebar">
            <PanelLeft className="h-5 w-5" />
          </Button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-background">{children}</div>
      </main>
    </div>
  )
}

