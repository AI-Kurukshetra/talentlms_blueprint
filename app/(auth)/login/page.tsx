"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useEffect, useRef, useState, useTransition } from "react"
import { ArrowRight, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

function getDashboardPathForRole(role: string | null | undefined) {
  if (role === "admin") return "/admin"
  if (role === "instructor") return "/instructor"
  return "/learner"
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const checkedSessionRef = useRef(false)
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(
    searchParams.get("message") === "confirm-email"
      ? "Please check your email to confirm your account before signing in."
      : null
  )

  useEffect(() => {
    if (checkedSessionRef.current) return
    checkedSessionRef.current = true

    let isMounted = true

    async function redirectIfAuthenticated() {
      console.log("[login] checking existing session")
      const supabase = createClient()
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      console.log("[login] getUser result", { hasUser: Boolean(user), userId: user?.id ?? null, userError: userError?.message ?? null })

      if (!isMounted || userError || !user) return

      console.log("[login] fetching role for existing session", { userId: user.id })
      const { data: roleData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      console.log("[login] existing session role query", {
        role: roleData?.role ?? null,
        roleError: roleError?.message ?? null
      })

      if (!isMounted) return

      if (roleError || !roleData?.role) {
        console.log("[login] existing session missing role, ensuring fallback profile", {
          userId: user.id,
          roleError: roleError?.message ?? null
        })
        const ensureProfileResponse = await fetch("/api/auth/profile", {
          method: "POST"
        })
        const ensuredProfile = await ensureProfileResponse.json()

        console.log("[login] existing session fallback profile result", {
          ok: ensureProfileResponse.ok,
          role: ensuredProfile.role ?? null,
          error: ensuredProfile.error ?? null
        })

        if (!ensureProfileResponse.ok) return

        router.replace(getDashboardPathForRole(ensuredProfile.role))
        return
      }

      router.replace(getDashboardPathForRole(roleData.role))
    }

    void redirectIfAuthenticated()

    return () => {
      isMounted = false
    }
  }, [router])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setInfoMessage(null)

    startTransition(async () => {
      console.log("[login] starting signInWithPassword", { email: email.trim() })
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      console.log("[login] signInWithPassword result", {
        hasUser: Boolean(data.user),
        userId: data.user?.id ?? null,
        error: error?.message ?? null
      })

      if (error) {
        const message = error.message.toLowerCase().includes("email not confirmed")
          ? "Please check your email to confirm your account before signing in."
          : error.message

        setFormError(message)
        toast({
          variant: "destructive",
          title: "Unable to sign in",
          description: message
        })
        return
      }

      console.log("[login] step 1 get logged in user")
      const {
        data: { user },
        error: getUserError
      } = await supabase.auth.getUser()

      console.log("[login] getUser after sign in", {
        hasUser: Boolean(user),
        userId: user?.id ?? null,
        error: getUserError?.message ?? null
      })

      if (getUserError) {
        const message = getUserError.message
        setFormError(message)
        toast({
          variant: "destructive",
          title: "Unable to sign in",
          description: message
        })
        return
      }

      if (!user) {
        const message = "Supabase did not return a logged in user after sign in."
        setFormError(message)
        toast({
          variant: "destructive",
          title: "Unable to sign in",
          description: message
        })
        return
      }

      console.log("[login] step 2 fetch role from public.users", { userId: user.id })
      const { data: roleData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      console.log("[login] role query result", {
        role: roleData?.role ?? null,
        error: roleError?.message ?? null
      })

      if (roleError || !roleData?.role) {
        console.log("[login] user missing from public.users, invoking fallback profile insert", {
          userId: user.id,
          roleError: roleError?.message ?? null
        })

        const ensureProfileResponse = await fetch("/api/auth/profile", {
          method: "POST"
        })
        const ensuredProfile = await ensureProfileResponse.json()

        console.log("[login] fallback profile response", {
          ok: ensureProfileResponse.ok,
          role: ensuredProfile.role ?? null,
          error: ensuredProfile.error ?? null
        })

        if (!ensureProfileResponse.ok) {
          const message = ensuredProfile.error ?? roleError?.message ?? "Unable to create or fetch your profile."
          setFormError(message)
          toast({
            variant: "destructive",
            title: "Profile setup failed",
            description: message
          })
          return
        }

        console.log("[login] step 3 redirecting with fallback role", { role: ensuredProfile.role ?? "learner" })
        router.replace(getDashboardPathForRole(ensuredProfile.role))
        router.refresh()
        return
      }

      console.log("[login] step 3 redirecting by role", { role: roleData.role })
      router.replace(getDashboardPathForRole(roleData.role))
      router.refresh()
    })
  }

  return (
    <Card className="glass-panel animate-in fade-in zoom-in-95 duration-700 rounded-[32px] border-white/10 bg-white/[0.04]">
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
            Welcome back
          </p>
          <CardTitle className="text-3xl tracking-tight">Login to CloudLMS</CardTitle>
        </div>
        <CardDescription className="text-base leading-7 text-muted-foreground">
          Continue to your dashboard with role-aware access powered by Supabase Auth.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {infoMessage ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              {infoMessage}
            </div>
          ) : null}
          {formError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Forgot password
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" className="group h-11 w-full rounded-2xl" disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Signing in
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          New to CloudLMS?{" "}
          <Link href="/register" className="font-medium text-foreground transition hover:text-primary">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
