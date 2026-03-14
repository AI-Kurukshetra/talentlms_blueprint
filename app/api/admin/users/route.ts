import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Role = "admin" | "instructor" | "learner"

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
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const name = String(body.name ?? "").trim()
  const email = String(body.email ?? "").trim().toLowerCase()
  const role = body.role as Role

  if (!name || !email || !["admin", "instructor", "learner"].includes(role)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const admin = createAdminClient()
  const password = `${crypto.randomUUID()}Aa1!`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Unable to create user" }, { status: 400 })
  }

  await admin.from("users").update({ name, role }).eq("id", data.user.id)
  return NextResponse.json({ id: data.user.id, name, email, role })
}

export async function PATCH(request: Request) {
  const adminUser = await assertAdmin()
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const userId = String(body.userId ?? "")
  const payload: { role?: Role; group_id?: string | null } = {}

  if (body.role && ["admin", "instructor", "learner"].includes(body.role)) {
    payload.role = body.role
  }
  if ("groupId" in body) {
    payload.group_id = body.groupId ? String(body.groupId) : null
  }

  if (!userId || Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  if (userId === adminUser.id && payload.role && payload.role !== "admin") {
    return NextResponse.json({ error: "You cannot remove your own admin role." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from("users").update(payload).eq("id", userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const adminUser = await assertAdmin()
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const userId = String(body.userId ?? "")

  if (!userId) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 })
  }
  if (userId === adminUser.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
