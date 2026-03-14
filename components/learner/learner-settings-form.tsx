"use client"

import { useState, useTransition } from "react"
import { Bell, ShieldCheck, UserRound } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type LearnerSettingsFormProps = {
  name: string
  email: string
  badges: string[]
}

export function LearnerSettingsForm({ name, email, badges }: LearnerSettingsFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(name)
  const [notifyCourses, setNotifyCourses] = useState(true)
  const [notifyCertificates, setNotifyCertificates] = useState(true)
  const [notifyAssessments, setNotifyAssessments] = useState(false)

  function handleSave() {
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450))
      toast({
        title: "Preferences saved",
        description: "Learner notification preferences were updated for this session."
      })
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <UserRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl tracking-tight">Profile preferences</CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Keep your learner profile details and delivery preferences aligned with how you study.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="learner-name">Display name</Label>
            <Input
              id="learner-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="learner-email">Email</Label>
            <Input id="learner-email" value={email} readOnly />
          </div>
          <div className="flex justify-end">
            <Button className="rounded-full" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl tracking-tight">Notifications</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Choose which updates should surface as you move through your learning plan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: "Course reminders",
                description: "Resume nudges for active in-progress courses.",
                value: notifyCourses,
                onChange: setNotifyCourses
              },
              {
                label: "Certificate updates",
                description: "Alerts when new certificates are issued.",
                value: notifyCertificates,
                onChange: setNotifyCertificates
              },
              {
                label: "Assessment prompts",
                description: "Signals when recommended assessments are ready.",
                value: notifyAssessments,
                onChange: setNotifyAssessments
              }
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/10 p-4"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch checked={item.value} onCheckedChange={item.onChange} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl tracking-tight">Earned badges</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Current recognition markers attached to your learner profile.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {badges.length > 0 ? (
              badges.map((badge) => (
                <Badge key={badge} variant="secondary" className="rounded-full px-3 py-1">
                  {badge}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No badges earned yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
