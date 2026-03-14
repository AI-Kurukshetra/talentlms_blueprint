import { NextResponse } from "next/server"

import { applyRewards } from "@/lib/engagement"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "learner") {
    return NextResponse.json({ ok: true })
  }

  const today = new Date().toISOString().slice(0, 10)
  const admin = createAdminClient()
  const { data: rawUser } = await admin
    .from("users")
    .select("badges")
    .eq("id", profile.id)
    .single()

  const badges = Array.isArray(rawUser?.badges) ? rawUser.badges.map((item) => `${item}`) : []
  const hasLoggedToday = badges.some((badge) => badge === `__meta:last-login:${today}`)

  if (hasLoggedToday) {
    return NextResponse.json({ ok: true, earnedBadges: [] })
  }

  const result = await applyRewards({
    admin,
    userId: profile.id,
    pointsDelta: 5,
    loginDate: today
  })

  return NextResponse.json({
    ok: true,
    earnedBadges: result.earnedBadges
  })
}
