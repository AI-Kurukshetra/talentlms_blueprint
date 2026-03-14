import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 surface-grid opacity-20" />
      <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <main className="py-6">{children}</main>
      </div>
    </div>
  )
}
