import Link from "next/link"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="glass-panel max-w-xl rounded-[32px] p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-primary/20 bg-primary/10">
          <Compass className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          The page you were looking for does not exist or may have moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
