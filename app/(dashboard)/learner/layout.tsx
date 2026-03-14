import type { ReactNode } from "react"

import { LearnerShell } from "@/components/learner/learner-shell"
import { getLearnerViewer } from "@/lib/learner/data"

export default async function LearnerLayout({ children }: { children: ReactNode }) {
  const viewer = await getLearnerViewer()

  return (
    <LearnerShell
      user={{
        name: viewer.name,
        email: viewer.email,
        avatarUrl: viewer.avatarUrl
      }}
    >
      {children}
    </LearnerShell>
  )
}
