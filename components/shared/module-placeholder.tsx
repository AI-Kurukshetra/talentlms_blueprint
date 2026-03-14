import type { Route } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ModulePlaceholderProps = {
  backHref: Route
  eyebrow: string
  title: string
  description: string
}

export function ModulePlaceholder({
  backHref,
  eyebrow,
  title,
  description
}: ModulePlaceholderProps) {
  return (
    <Card className="glass-panel animate-in fade-in slide-in-from-bottom-8 rounded-[30px] border-white/10 bg-white/[0.04]">
      <CardHeader className="space-y-4">
        <Button asChild variant="ghost" className="h-9 w-fit rounded-full px-3">
          <Link href={backHref}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <CardTitle className="mt-3 text-3xl tracking-tight">{title}</CardTitle>
          <CardDescription className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-[26px] border border-dashed border-white/10 bg-black/10 p-6 text-sm leading-7 text-muted-foreground">
          This module shell is ready for the next implementation pass.
        </div>
      </CardContent>
    </Card>
  )
}
