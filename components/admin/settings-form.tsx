"use client"

import { useState, useTransition } from "react"
import { ImagePlus, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import type { AdminSettingsData } from "@/lib/admin/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

type SettingsFormProps = {
  settings: AdminSettingsData
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [platformName, setPlatformName] = useState(settings.platformName)
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl)
  const [defaultUserRole, setDefaultUserRole] = useState(settings.defaultUserRole)
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications)

  async function handleLogoUpload(file: File) {
    const supabase = createClient()
    const filePath = `platform-logo-${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })
    if (error) {
      toast({ variant: "destructive", title: "Unable to upload logo", description: error.message })
      return
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    setLogoUrl(data.publicUrl)
    toast({ title: "Logo uploaded", description: "The new logo is ready to save." })
  }

  function handleSave() {
    startTransition(async () => {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformName, logoUrl, defaultUserRole, emailNotifications })
      })
      const result = await response.json()
      if (!response.ok) {
        toast({ variant: "destructive", title: "Unable to save settings", description: result.error ?? "Please try again." })
        return
      }
      toast({ title: "Settings saved", description: "Platform configuration has been updated." })
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight">Platform settings</CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">
            Configure the admin-visible identity of the LMS and the baseline user defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="platform-name">Platform name</Label>
            <Input id="platform-name" value={platformName} onChange={(event) => setPlatformName(event.target.value)} />
          </div>

          <div className="space-y-3">
            <Label htmlFor="logo-upload">Logo upload</Label>
            <div className="flex flex-col gap-3 rounded-[24px] border border-dashed border-white/15 bg-black/10 p-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Platform logo" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void handleLogoUpload(file)
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default user role</Label>
            <Select value={defaultUserRole} onValueChange={(value: typeof defaultUserRole) => setDefaultUserRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="learner">Learner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Email notifications</CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">
            Tune default notification behavior for enrollment and reminder workflows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { key: "enrollments" as const, label: "Enrollment updates", description: "Notify users when they are assigned to a new course." },
            { key: "reminders" as const, label: "Reminder messages", description: "Send nudges for overdue lessons and inactive learners." },
            { key: "weeklyDigest" as const, label: "Weekly digest", description: "Deliver a weekly progress summary to admins." }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-black/10 p-4">
              <div className="pr-4">
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={emailNotifications[item.key]}
                onCheckedChange={(checked) => setEmailNotifications((current) => ({ ...current, [item.key]: checked }))}
              />
            </div>
          ))}

          <Button className="mt-2 w-full rounded-2xl" onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save settings"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
