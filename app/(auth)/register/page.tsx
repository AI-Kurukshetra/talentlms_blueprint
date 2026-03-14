"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useRef, useState, useTransition } from "react"
import { ArrowRight, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getDashboardForRole, normalizeRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"

type FormErrors = Partial<Record<"name" | "email" | "password" | "confirmPassword" | "form", string>>

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const checkedSessionRef = useRef(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)

  useEffect(() => {
    if (checkedSessionRef.current) return
    checkedSessionRef.current = true

    let isMounted = true

    async function redirectIfAuthenticated() {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!isMounted || !user) return

      const ensureProfileResponse = await fetch("/api/auth/profile", {
        method: "POST"
      })
      const ensuredProfile = await ensureProfileResponse.json()

      if (!isMounted || !ensureProfileResponse.ok) return

      router.replace(getDashboardForRole(normalizeRole(ensuredProfile.role)))
    }

    void redirectIfAuthenticated()

    return () => {
      isMounted = false
    }
  }, [router])

  function validateForm() {
    const nextErrors: FormErrors = {}

    if (!name.trim()) nextErrors.name = "Name is required."
    if (!email.trim()) nextErrors.email = "Email is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Enter a valid email address."

    if (!password) nextErrors.password = "Password is required."
    else if (password.length < 8) nextErrors.password = "Use at least 8 characters."

    if (!confirmPassword) nextErrors.confirmPassword = "Please confirm your password."
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match."

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setConfirmationMessage(null)

    if (!validateForm()) return

    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setErrors({ form: error.message })
        toast({
          variant: "destructive",
          title: "Unable to create account",
          description: error.message
        })
        return
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setErrors({ form: "An account with this email already exists." })
        return
      }

      if (!data.user) {
        setErrors({ form: "Supabase did not return a user record for this signup." })
        return
      }

      if (!data.session) {
        setErrors({})
        setConfirmationMessage("Please check your email to confirm your account before signing in.")
        toast({
          title: "Confirm your email",
          description: "Please check your email to confirm your account."
        })
        return
      }

      const ensureProfileResponse = await fetch("/api/auth/profile", {
        method: "POST"
      })
      const ensuredProfile = await ensureProfileResponse.json()

      if (!ensureProfileResponse.ok) {
        const message = ensuredProfile.error ?? "Your account was created, but the profile setup failed."
        setErrors({ form: message })
        toast({
          variant: "destructive",
          title: "Profile setup failed",
          description: message
        })
        return
      }

      setErrors({})
      toast({
        title: "Account created",
        description: "Your learner workspace is ready."
      })

      router.replace("/learner")
      router.refresh()
    })
  }

  return (
    <Card className="glass-panel animate-in fade-in zoom-in-95 duration-700 rounded-[32px] border-white/10 bg-white/[0.04]">
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
            Create account
          </p>
          <CardTitle className="text-3xl tracking-tight">Start with learner access</CardTitle>
        </div>
        <CardDescription className="text-base leading-7 text-muted-foreground">
          New accounts default to the learner role, with profile creation handled by your Supabase
          signup trigger.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {confirmationMessage ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              {confirmationMessage}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Avery Johnson"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              ) : null}
            </div>
          </div>
          {errors.form ? <p className="text-sm text-destructive">{errors.form}</p> : null}
          <Button type="submit" className="group h-11 w-full rounded-2xl" disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Creating account
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground transition hover:text-primary">
            Login instead
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
