import type { Route } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: Route
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  ctaLabel,
  ctaHref
}: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-primary/20 bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">{description}</p>
      {ctaLabel && ctaHref ? (
        <Button asChild className="mt-6 rounded-full">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
