"use client"

import type { Route } from "next"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, FileQuestion, Search, Users } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut
} from "@/components/ui/command"

type SearchResult = {
  id: string
  title: string
  subtitle: string
  href: Route
}

type SearchPayload = {
  courses: SearchResult[]
  users: SearchResult[]
  assessments: SearchResult[]
}

const emptyResults: SearchPayload = {
  courses: [],
  users: [],
  assessments: []
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchPayload>(emptyResults)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      const searchQuery = query.trim()
      if (!searchQuery) {
        setResults(emptyResults)
        return
      }

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: controller.signal
      })

      if (!response.ok) return
      const payload = (await response.json()) as SearchPayload
      setResults(payload)
    }, 180)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [open, query])

  const hasResults = useMemo(
    () => results.courses.length > 0 || results.users.length > 0 || results.assessments.length > 0,
    [results]
  )

  return (
    <>
      <button
        type="button"
        className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/20 hover:text-foreground md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span>Search everything</span>
        <kbd className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em]">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search courses, users, or assessments..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No matches found for the current query.</CommandEmpty>
          {results.courses.length > 0 ? (
            <CommandGroup heading="Courses">
              {results.courses.map((result) => (
                <CommandItem
                  key={`course-${result.id}`}
                  value={`course-${result.title}-${result.subtitle}`}
                  onSelect={() => {
                    setOpen(false)
                    router.push(result.href)
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {results.users.length > 0 ? (
            <CommandGroup heading="Users">
              {results.users.map((result) => (
                <CommandItem
                  key={`user-${result.id}`}
                  value={`user-${result.title}-${result.subtitle}`}
                  onSelect={() => {
                    setOpen(false)
                    router.push(result.href)
                  }}
                >
                  <Users className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {results.assessments.length > 0 ? (
            <CommandGroup heading="Assessments">
              {results.assessments.map((result) => (
                <CommandItem
                  key={`assessment-${result.id}`}
                  value={`assessment-${result.title}-${result.subtitle}`}
                  onSelect={() => {
                    setOpen(false)
                    router.push(result.href)
                  }}
                >
                  <FileQuestion className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {!query.trim() && !hasResults ? (
            <CommandGroup heading="Tips">
              <CommandItem disabled>
                <Search className="h-4 w-4" />
                <span>Type a title, email, or assessment name.</span>
                <CommandShortcut>ENTER</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  )
}
