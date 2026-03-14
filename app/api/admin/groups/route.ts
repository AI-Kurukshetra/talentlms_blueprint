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
  const name = String(body.name ?? "").trim()
  if (!name) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from("groups").insert({ name }).select("id, name").single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const groupId = String(body.groupId ?? "")
  const userIds = Array.isArray(body.userIds) ? body.userIds.map(String) : []

  if (!groupId) {
    return NextResponse.json({ error: "Group id is required" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: existingMembers } = await admin.from("users").select("id").eq("group_id", groupId)
  const existingIds = (existingMembers ?? []).map((item) => item.id)
  if (existingIds.length > 0) {
    await admin.from("users").update({ group_id: null }).in("id", existingIds)
  }
  if (userIds.length > 0) {
    const { error } = await admin.from("users").update({ group_id: groupId }).in("id", userIds)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}
