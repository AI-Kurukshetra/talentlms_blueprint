"use client"

import Link from "next/link"
import { FormEvent, useState, useTransition } from "react"
import { LoaderCircle, MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`
      })

      if (error) {
        toast({
          variant: "destructive",
          title: "Unable to send reset link",
          description: error.message
        })
        return
      }

      toast({
        title: "Reset link sent",
        description: "Check your inbox for password reset instructions."
      })
    })
  }

  return (
    <Card className="glass-panel animate-in fade-in zoom-in-95 duration-700 rounded-[32px] border-white/10 bg-white/[0.04]">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <MailCheck className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-3xl tracking-tight">Reset your password</CardTitle>
        <CardDescription className="text-base leading-7 text-muted-foreground">
          Enter the email linked to your CloudLMS account and we&apos;ll send a secure reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
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
          <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Sending link
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-foreground transition hover:text-primary">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
