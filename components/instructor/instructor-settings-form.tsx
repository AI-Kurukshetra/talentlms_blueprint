"use client"

import { useState, useTransition } from "react"
import { BellRing, ShieldCheck, Sparkles } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type InstructorSettingsFormProps = {
  instructorName: string
  instructorEmail: string
}

export function InstructorSettingsForm({
  instructorName,
  instructorEmail
}: InstructorSettingsFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [workspaceName, setWorkspaceName] = useState("CloudLMS Studio")
  const [replyToEmail, setReplyToEmail] = useState(instructorEmail)
  const [autoPublish, setAutoPublish] = useState(false)
  const [activityDigest, setActivityDigest] = useState(true)
  const [studentAlerts, setStudentAlerts] = useState(true)

  function handleSave() {
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450))
      toast({
        title: "Preferences saved",
        description: "Instructor workspace preferences were updated for this session."
      })
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl tracking-tight">Workspace defaults</CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Tune the course builder environment and how learners experience newly created courses.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reply-to-email">Reply-to email</Label>
            <Input
              id="reply-to-email"
              type="email"
              value={replyToEmail}
              onChange={(event) => setReplyToEmail(event.target.value)}
            />
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-medium">Instructor owner</p>
            <p className="mt-2 text-xl font-semibold tracking-tight">{instructorName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{instructorEmail}</p>
          </div>
          <div className="flex justify-end">
            <Button className="rounded-full" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <BellRing className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl tracking-tight">Notifications</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Decide which signals should surface while courses are live.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/10 p-4">
              <div>
                <p className="font-medium">Activity digest</p>
                <p className="text-sm text-muted-foreground">Weekly summary of enrollments and completions.</p>
              </div>
              <Switch checked={activityDigest} onCheckedChange={setActivityDigest} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/10 p-4">
              <div>
                <p className="font-medium">Student risk alerts</p>
                <p className="text-sm text-muted-foreground">Flag learners with low momentum or stalled progress.</p>
              </div>
              <Switch checked={studentAlerts} onCheckedChange={setStudentAlerts} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/10 p-4">
              <div>
                <p className="font-medium">Auto-publish new modules</p>
                <p className="text-sm text-muted-foreground">Ship course changes instantly after save.</p>
              </div>
              <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl tracking-tight">Publishing guardrails</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Keep instructional quality consistent before learners see new content.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Require thumbnail before publishing",
              "Warn when lessons have no duration",
              "Highlight missing assessment coverage"
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-black/10 px-4 py-3"
              >
                <span className="text-sm font-medium">{item}</span>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Enabled
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
