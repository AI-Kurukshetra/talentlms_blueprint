import type { Metadata } from "next"
import { ReactNode } from "react"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://cloudlms.example.com"),
  title: {
    default: "CloudLMS",
    template: "%s | CloudLMS"
  },
  description: "Train smarter with AI, structured analytics, payments, certifications, and polished learning operations.",
  openGraph: {
    title: "CloudLMS",
    description: "AI-powered cloud learning management for modern teams.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "CloudLMS platform preview"
      }
    ]
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="cloudlms-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
