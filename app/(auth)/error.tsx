"use client"

import { RouteError } from "@/components/shared/route-error"

export default function AuthError({
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteError
      title="Authentication hit a problem"
      description="The sign-in flow could not be completed. Retry the request or refresh the page."
      onRetry={reset}
    />
  )
}
