import { NextResponse } from "next/server"

import type { InstructorAssessmentFormData } from "@/lib/assessment/data"
import { serializeQuestionOptions } from "@/lib/assessment/schema"
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

  const body = (await request.json()) as InstructorAssessmentFormData
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Assessment title is required." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: assessmentWithCourse } = await admin
    .from("assessments")
    .select("id, course_id, courses!inner(instructor_id)")
    .eq("id", params.id)
    .maybeSingle()

  if (!assessmentWithCourse) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 })
  }

  const courseOwner =
    Array.isArray(assessmentWithCourse.courses) ? assessmentWithCourse.courses[0] : assessmentWithCourse.courses
  if (!courseOwner || courseOwner.instructor_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: targetCourse } = await admin
    .from("courses")
    .select("id, instructor_id")
    .eq("id", body.courseId)
    .maybeSingle()

  if (!targetCourse || targetCourse.instructor_id !== user.id) {
    return NextResponse.json({ error: "Target course not found." }, { status: 404 })
  }

  const { error: assessmentError } = await admin
    .from("assessments")
    .update({
      title: body.title.trim(),
      course_id: body.courseId,
      time_limit_minutes: body.timeLimitMinutes,
      passing_score: body.passingScore ?? 70
    })
    .eq("id", params.id)

  if (assessmentError) {
    return NextResponse.json({ error: assessmentError.message }, { status: 400 })
  }

  const { error: deleteError } = await admin.from("questions").delete().eq("assessment_id", params.id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  if (body.questions.length > 0) {
    const { error: insertError } = await admin.from("questions").insert(
      body.questions.map((question, index) => ({
        assessment_id: params.id,
        type: question.type,
        text: question.text.trim(),
        options: serializeQuestionOptions({ ...question, sortOrder: index }),
        answer: question.answer,
        points: question.points || 1
      }))
    )

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id: params.id })
}
