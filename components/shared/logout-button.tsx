"use client"

import { useRouter } from "next/navigation"
import { LogOut, LoaderCircle } from "lucide-react"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export function LogoutButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast({
          variant: "destructive",
          title: "Unable to sign out",
          description: error.message
        })
        return
      }

      router.replace("/login")
      router.refresh()
    })
  }

  return (
    <Button variant="ghost" size="sm" className="rounded-full" onClick={handleLogout} disabled={isPending}>
      {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      <span className="ml-2 hidden sm:inline">Logout</span>
    </Button>
  )
}
