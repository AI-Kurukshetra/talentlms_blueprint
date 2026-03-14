import type { Metadata } from "next"
import { ReactNode } from "react"

import { Toaster } from "@/components/ui/toaster"

import "./globals.css"

export const metadata: Metadata = {
  title: "CloudLMS",
  description: "Modern cloud learning management for teams, instructors, and learners."
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
