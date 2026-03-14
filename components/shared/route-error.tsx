"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

type RouteErrorProps = {
  title: string
  description: string
  onRetry: () => void
}

export function RouteError({ title, description, onRetry }: RouteErrorProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-panel max-w-xl rounded-[32px] p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
        <Button className="mt-6 rounded-full" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}
