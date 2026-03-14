import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function assertAccess(courseId: string) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, name, email, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  if (profile.role === "learner") {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle()

    if (!enrollment) return null
  } else if (profile.role === "instructor") {
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("instructor_id", user.id)
      .maybeSingle()

    if (!course) return null
  }

  return profile
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const courseId = url.searchParams.get("courseId")

  if (!courseId) {
    return NextResponse.json({ error: "Course is required." }, { status: 400 })
  }

  const profile = await assertAccess(courseId)
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const [discussionResult, usersResult] = await Promise.all([
    admin
      .from("discussions")
      .select("id, course_id, user_id, message, parent_id, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true }),
    admin.from("users").select("id, name, avatar_url")
  ])

  const usersMap = new Map((usersResult.data ?? []).map((user) => [user.id, user]))
  const discussions = (discussionResult.data ?? []).map((item) => ({
    id: item.id,
    courseId: item.course_id,
    userId: item.user_id,
    userName: usersMap.get(item.user_id)?.name ?? "User",
    avatarUrl: usersMap.get(item.user_id)?.avatar_url ?? null,
    message: item.message,
    parentId: item.parent_id,
    createdAt: item.created_at
  }))

  return NextResponse.json({
    viewer: {
      id: profile.id,
      role: profile.role
    },
    discussions
  })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    courseId?: string
    message?: string
    parentId?: string | null
  }

  if (!body.courseId || !body.message?.trim()) {
    return NextResponse.json({ error: "Course and message are required." }, { status: 400 })
  }

  const profile = await assertAccess(body.courseId)
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from("discussions").insert({
    course_id: body.courseId,
    user_id: profile.id,
    message: body.message.trim(),
    parent_id: body.parentId ?? null
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
