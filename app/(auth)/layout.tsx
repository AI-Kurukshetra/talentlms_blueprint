import { ReactNode } from "react"

import { AuthShell } from "@/components/shared/auth-shell"

export default async function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>
}
