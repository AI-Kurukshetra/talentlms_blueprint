import type { ReactNode } from "react"

import { InstructorShell } from "@/components/instructor/instructor-shell"
import { getInstructorViewer } from "@/lib/instructor/data"

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const viewer = await getInstructorViewer()

  return (
    <InstructorShell
      user={{
        name: viewer.name,
        email: viewer.email,
        avatarUrl: viewer.avatarUrl
      }}
    >
      {children}
    </InstructorShell>
  )
}
