import { NextResponse } from "next/server"

import { serializeLearningPathDescription } from "@/lib/learning-paths"
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

type Payload = {
  id?: string
  title?: string
  description?: string
  groupId?: string | null
  courseIds?: string[]
}

export async function POST(request: Request) {
  const adminUser = await assertAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as Payload
  const title = String(body.title ?? "").trim()
  const description = String(body.description ?? "").trim()
  const groupId = body.groupId ? String(body.groupId) : null
  const courseIds = Array.isArray(body.courseIds) ? body.courseIds.map(String) : []

  if (!title) {
    return NextResponse.json({ error: "Learning path title is required." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: path, error: pathError } = await admin
    .from("learning_paths")
    .insert({
      title,
      description: serializeLearningPathDescription({
        text: description,
        groupId
      })
    })
    .select("id")
    .single()

  if (pathError || !path) {
    return NextResponse.json({ error: pathError?.message ?? "Unable to create learning path." }, { status: 400 })
  }

  if (courseIds.length > 0) {
    const { error: coursesError } = await admin.from("learning_path_courses").insert(
      courseIds.map((courseId, index) => ({
        learning_path_id: path.id,
        course_id: courseId,
        sort_order: index
      }))
    )

    if (coursesError) {
      return NextResponse.json({ error: coursesError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id: path.id })
}

export async function PATCH(request: Request) {
  const adminUser = await assertAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as Payload
  const pathId = String(body.id ?? "")
  const title = String(body.title ?? "").trim()
  const description = String(body.description ?? "").trim()
  const groupId = body.groupId ? String(body.groupId) : null
  const courseIds = Array.isArray(body.courseIds) ? body.courseIds.map(String) : []

  if (!pathId || !title) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error: updateError } = await admin
    .from("learning_paths")
    .update({
      title,
      description: serializeLearningPathDescription({
        text: description,
        groupId
      })
    })
    .eq("id", pathId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  await admin.from("learning_path_courses").delete().eq("learning_path_id", pathId)

  if (courseIds.length > 0) {
    const { error: coursesError } = await admin.from("learning_path_courses").insert(
      courseIds.map((courseId, index) => ({
        learning_path_id: pathId,
        course_id: courseId,
        sort_order: index
      }))
    )

    if (coursesError) {
      return NextResponse.json({ error: coursesError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const adminUser = await assertAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as Payload
  const pathId = String(body.id ?? "")

  if (!pathId) {
    return NextResponse.json({ error: "Learning path id is required." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from("learning_paths").delete().eq("id", pathId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
