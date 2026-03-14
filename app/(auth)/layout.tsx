import { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_18px_60px_rgba(16,34,61,0.08)] backdrop-blur">
        {children}
      </div>
    </main>
  )
}
