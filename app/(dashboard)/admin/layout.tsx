import type { ReactNode } from "react"

import { AdminShell } from "@/components/admin/admin-shell"
import { getAdminViewer } from "@/lib/admin/data"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await getAdminViewer()

  return (
    <AdminShell
      user={{
        name: viewer.name,
        email: viewer.email,
        avatarUrl: viewer.avatarUrl
      }}
    >
      {children}
    </AdminShell>
  )
}
