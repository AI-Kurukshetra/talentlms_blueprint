import { NextResponse } from "next/server"

import {
  evaluateQuestionAnswer,
  normalizeQuestionOptions,
  type AssessmentQuestion
} from "@/lib/assessment/schema"
import { issueCourseCertificate } from "@/lib/certificates"
import { applyRewards, createNotification } from "@/lib/engagement"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type QuestionRow = {
  id: string
  type: AssessmentQuestion["type"]
  text: string
  options: unknown
  answer: string
  points: number | null
}

async function assertLearner() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "learner") return null

  return profile
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const learner = await assertLearner()
  if (!learner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    answers?: Record<string, string>
  }

  const supabase = await createClient()
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, course_id, title, passing_score")
    .eq("id", params.id)
    .maybeSingle()

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 })
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status, enrolled_at, completed_at")
    .eq("course_id", assessment.course_id)
    .eq("user_id", learner.id)
    .maybeSingle()

  if (!enrollment) {
    return NextResponse.json({ error: "You are not enrolled in this course." }, { status: 403 })
  }

  const [questionsResult, courseResult] = await Promise.all([
    supabase
      .from("questions")
      .select("id, type, text, options, answer, points")
      .eq("assessment_id", params.id),
    supabase.from("courses").select("id, title").eq("id", assessment.course_id).maybeSingle()
  ])

  const questions = ((questionsResult.data ?? []) as QuestionRow[])
    .map((row) => {
      const parsedOptions = normalizeQuestionOptions(row.options as never)
      return {
        id: row.id,
        type: row.type,
        text: row.text,
        options: parsedOptions.choices,
        answer: row.answer,
        points: row.points ?? 1,
        sortOrder: parsedOptions.order
      } satisfies AssessmentQuestion
    })
    .sort((left, right) => left.sortOrder - right.sortOrder)

  if (questions.length === 0) {
    return NextResponse.json({ error: "This assessment has no questions yet." }, { status: 400 })
  }

  const answers = body.answers ?? {}
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0)
  const earnedPoints = questions.reduce((sum, question) => {
    const submittedAnswer = answers[question.id ?? ""] ?? ""
    return sum + (evaluateQuestionAnswer(question, submittedAnswer) ? question.points : 0)
  }, 0)
  const score = totalPoints === 0 ? 0 : Number(((earnedPoints / totalPoints) * 100).toFixed(2))
  const passingScore = assessment.passing_score ?? 70
  const passed = score >= passingScore
  const completionWasNew =
    passed &&
    enrollment.status !== "completed" &&
    !enrollment.completed_at
  const fastLearner =
    completionWasNew &&
    (new Date().getTime() - new Date(enrollment.enrolled_at).getTime()) / (1000 * 60 * 60 * 24) < 7

  const admin = createAdminClient()
  const { error: gradeError } = await admin.from("grades").insert({
    user_id: learner.id,
    assessment_id: assessment.id,
    score,
    passed
  })

  if (gradeError) {
    return NextResponse.json({ error: gradeError.message }, { status: 400 })
  }

  let certificateIssued = false
  const rewardResult = passed
    ? await applyRewards({
        admin,
        userId: learner.id,
        pointsDelta: 50 + (completionWasNew ? 100 : 0),
        badgesToAward: [
          ...(score === 100 ? (["Perfect Score"] as const) : []),
          ...(fastLearner ? (["Fast Learner"] as const) : [])
        ]
      })
    : { earnedBadges: [], totalPoints: 0, visibleBadges: [] }

  if (passed) {
    const issuedAt = new Date().toISOString()
    const certificateResult = await issueCourseCertificate({
      admin,
      learnerName: learner.name,
      learnerId: learner.id,
      courseId: assessment.course_id,
      courseTitle: courseResult.data?.title ?? "Course",
      issuedAt
    })

    certificateIssued = certificateResult.issued

    await createNotification({
      admin,
      userId: learner.id,
      title: `You passed ${assessment.title}!`,
      message: `You scored ${score.toFixed(2)}% and cleared the passing threshold.`
    })

    if (completionWasNew) {
      await createNotification({
        admin,
        userId: learner.id,
        title: `Congratulations! You completed ${courseResult.data?.title ?? "the course"}!`,
        message: "The course is now marked complete in your learning record."
      })
    }

    if (certificateIssued) {
      await createNotification({
        admin,
        userId: learner.id,
        title: "Your certificate is ready!",
        message: `${courseResult.data?.title ?? "This course"} certificate is available from your certificates page.`
      })
    }

    await admin
      .from("enrollments")
      .update({
        status: "completed",
        completed_at: issuedAt
      })
      .eq("id", enrollment.id)
  }

  return NextResponse.json({
    score,
    passed,
    passingScore,
    certificateIssued,
    earnedBadges: rewardResult.earnedBadges
  })
}
