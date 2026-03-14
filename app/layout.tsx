import type { Metadata } from "next"
import { ReactNode } from "react"

import "./globals.css"

export const metadata: Metadata = {
  title: "Cloud LMS",
  description: "A Supabase-powered learning management system built with Next.js 14."
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
