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

export async function POST(request: Request) {
  const user = await assertInstructor()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as InstructorAssessmentFormData
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Assessment title is required." }, { status: 400 })
  }

  if (!body.courseId) {
    return NextResponse.json({ error: "Course is required." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: course } = await admin
    .from("courses")
    .select("id, instructor_id")
    .eq("id", body.courseId)
    .maybeSingle()

  if (!course || course.instructor_id !== user.id) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 })
  }

  const { data: assessment, error: assessmentError } = await admin
    .from("assessments")
    .insert({
      title: body.title.trim(),
      course_id: body.courseId,
      time_limit_minutes: body.timeLimitMinutes,
      passing_score: body.passingScore ?? 70
    })
    .select("id")
    .single()

  if (assessmentError || !assessment) {
    return NextResponse.json(
      { error: assessmentError?.message ?? "Unable to create assessment." },
      { status: 400 }
    )
  }

  if (body.questions.length > 0) {
    const { error: questionsError } = await admin.from("questions").insert(
      body.questions.map((question, index) => ({
        assessment_id: assessment.id,
        type: question.type,
        text: question.text.trim(),
        options: serializeQuestionOptions({ ...question, sortOrder: index }),
        answer: question.answer,
        points: question.points || 1
      }))
    )

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id: assessment.id })
}
