"use client"

import { RouteError } from "@/components/shared/route-error"

export default function DashboardError({
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteError
      title="Dashboard data could not load"
      description="Something went wrong while loading the workspace. Retry to request fresh data."
      onRetry={reset}
    />
  )
}
