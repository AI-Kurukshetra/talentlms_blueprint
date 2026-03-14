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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await assertInstructor()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as CourseFormData
  const courseId = params.id

  const admin = createAdminClient()
  const { data: course } = await admin
    .from("courses")
    .select("id, instructor_id")
    .eq("id", courseId)
    .maybeSingle()

  if (!course || course.instructor_id !== user.id) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 })
  }

  const { error: courseError } = await admin
    .from("courses")
    .update({
      title: body.title.trim(),
      description: body.description?.trim() || null,
      thumbnail_url: body.thumbnailUrl || null,
      status: body.status,
      price: body.price ?? 0,
      updated_at: new Date().toISOString()
    })
    .eq("id", courseId)

  if (courseError) {
    return NextResponse.json({ error: courseError.message }, { status: 400 })
  }

  const { error: deleteLessonsError } = await admin.from("lessons").delete().eq("course_id", courseId)
  if (deleteLessonsError) {
    return NextResponse.json({ error: deleteLessonsError.message }, { status: 400 })
  }

  if (body.lessons.length > 0) {
    const { error: insertLessonsError } = await admin.from("lessons").insert(
      body.lessons.map((lesson, index) => ({
        course_id: courseId,
        title: lesson.title.trim(),
        type: lesson.type,
        content: lesson.content?.trim() || null,
        video_url: lesson.videoUrl || null,
        file_url: lesson.fileUrl || null,
        duration_seconds: lesson.durationSeconds || null,
        sort_order: index
      }))
    )

    if (insertLessonsError) {
      return NextResponse.json({ error: insertLessonsError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id: courseId })
}
