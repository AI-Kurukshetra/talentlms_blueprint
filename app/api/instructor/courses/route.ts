import { NextResponse } from "next/server"

import type { CourseFormData } from "@/lib/instructor/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function assertInstructor() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "instructor") return null

  return user
}

export async function POST(request: Request) {
  const user = await assertInstructor()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as CourseFormData
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Course title is required." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from("courses")
    .insert({
      title: body.title.trim(),
      description: body.description?.trim() || null,
      thumbnail_url: body.thumbnailUrl || null,
      status: body.status,
      price: body.price ?? 0,
      instructor_id: user.id
    })
    .select("id")
    .single()

  if (courseError || !course) {
    return NextResponse.json({ error: courseError?.message ?? "Unable to create course." }, { status: 400 })
  }

  if (body.lessons.length > 0) {
    const { error: lessonsError } = await admin.from("lessons").insert(
      body.lessons.map((lesson, index) => ({
        course_id: course.id,
        title: lesson.title.trim(),
        type: lesson.type,
        content: lesson.content?.trim() || null,
        video_url: lesson.videoUrl || null,
        file_url: lesson.fileUrl || null,
        duration_seconds: lesson.durationSeconds || null,
        sort_order: index
      }))
    )

    if (lessonsError) {
      return NextResponse.json({ error: lessonsError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id: course.id })
}
