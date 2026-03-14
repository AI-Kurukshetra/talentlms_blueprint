"use client"

import { RouteError } from "@/components/shared/route-error"

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <RouteError
          title="CloudLMS ran into an unexpected error"
          description="An unrecoverable error occurred while rendering the application."
          onRetry={reset}
        />
      </body>
    </html>
  )
}
