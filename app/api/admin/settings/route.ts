import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function isAdmin() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  return profile?.role === "admin"
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const platformName = String(body.platformName ?? "").trim()
  const logoUrl = String(body.logoUrl ?? "")
  const defaultUserRole = body.defaultUserRole
  const emailNotifications = body.emailNotifications

  if (!platformName || !["admin", "instructor", "learner"].includes(defaultUserRole)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  const payload = {
    name: platformName,
    logo_url: logoUrl || null,
    theme: {
      defaultUserRole,
      emailNotifications: {
        enrollments: Boolean(emailNotifications?.enrollments),
        reminders: Boolean(emailNotifications?.reminders),
        weeklyDigest: Boolean(emailNotifications?.weeklyDigest)
      }
    }
  }

  const result = existing?.id
    ? await admin.from("organizations").update(payload).eq("id", existing.id)
    : await admin.from("organizations").insert(payload)

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
