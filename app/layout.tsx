import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Toaster as RadixToaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Clarify - AI Meeting Task Manager",
  description: "AI-powered meeting task management system for teams",
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/CLARIFY-LOGO.png', sizes: 'any' },
      { url: '/CLARIFY-LOGO.png', sizes: '32x32', type: 'image/png' },
      { url: '/CLARIFY-LOGO.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/CLARIFY-LOGO.png',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <RadixToaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
