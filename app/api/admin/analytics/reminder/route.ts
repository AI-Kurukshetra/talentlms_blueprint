import { NextResponse } from "next/server"

import { createNotification } from "@/lib/engagement"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  return profile?.role === "admin" ? user : null
}

export async function POST(request: Request) {
  const adminUser = await assertAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    learnerId?: string
    courseTitle?: string
  }

  if (!body.learnerId || !body.courseTitle) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }

  const admin = createAdminClient()
  await createNotification({
    admin,
    userId: body.learnerId,
    title: "Reminder to continue learning",
    message: `You still have progress left in ${body.courseTitle}. Pick up where you left off.`
  })

  return NextResponse.json({ success: true })
}
