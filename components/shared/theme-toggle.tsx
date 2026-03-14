"use client"

import { Moon, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme !== "light"

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full transition-transform hover:scale-[1.03]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
