import { NextResponse } from "next/server"

import { issueCourseCertificate } from "@/lib/certificates"
import { applyRewards, createNotification } from "@/lib/engagement"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function assertLearner() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, role, points")
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

  const body = (await request.json()) as { lessonId?: string }
  if (!body.lessonId) {
    return NextResponse.json({ error: "Lesson is required." }, { status: 400 })
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  const [courseResult, enrollmentResult, lessonResult] = await Promise.all([
    supabase.from("courses").select("id, title").eq("id", params.id).maybeSingle(),
    supabase
      .from("enrollments")
      .select("id, status, enrolled_at, completed_at")
      .eq("course_id", params.id)
      .eq("user_id", learner.id)
      .maybeSingle(),
    supabase
      .from("lessons")
      .select("id, course_id, title")
      .eq("id", body.lessonId)
      .eq("course_id", params.id)
      .maybeSingle()
  ])

  if (!courseResult.data || !enrollmentResult.data || !lessonResult.data) {
    return NextResponse.json({ error: "Course lesson not found." }, { status: 404 })
  }

  const existingProgress = await admin
    .from("progress")
    .select("id, completed")
    .eq("enrollment_id", enrollmentResult.data.id)
    .eq("lesson_id", body.lessonId)
    .maybeSingle()

  const completedAt = new Date().toISOString()
  const { error: progressError } = await admin.from("progress").upsert(
    {
      enrollment_id: enrollmentResult.data.id,
      lesson_id: body.lessonId,
      completed: true,
      completed_at: completedAt
    },
    { onConflict: "enrollment_id,lesson_id" }
  )

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 400 })
  }

  const lessonsResult = await supabase
    .from("lessons")
    .select("id, sort_order")
    .eq("course_id", params.id)
    .order("sort_order", { ascending: true })

  const courseLessons = lessonsResult.data ?? []
  const progressResult = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("enrollment_id", enrollmentResult.data.id)
    .eq("completed", true)

  const completedLessonIds = new Set((progressResult.data ?? []).map((item) => item.lesson_id))
  const progressPercent =
    courseLessons.length === 0 ? 0 : (completedLessonIds.size / courseLessons.length) * 100
  const nextLesson = courseLessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? null
  const courseCompleted = courseLessons.length > 0 && completedLessonIds.size === courseLessons.length

  let certificateIssued = false
  const completionWasNew =
    courseCompleted &&
    enrollmentResult.data.status !== "completed" &&
    !enrollmentResult.data.completed_at

  const badgesToAward: Array<"Fast Learner"> = []
  if (completionWasNew) {
    const enrolledAt = new Date(enrollmentResult.data.enrolled_at).getTime()
    const now = new Date(completedAt).getTime()
    const days = (now - enrolledAt) / (1000 * 60 * 60 * 24)
    if (days < 7) {
      badgesToAward.push("Fast Learner")
    }
  }

  const rewardResult =
    !existingProgress.data || !existingProgress.data.completed
      ? await applyRewards({
          admin,
          userId: learner.id,
          pointsDelta: 10 + (completionWasNew ? 100 : 0),
          badgesToAward
        })
      : { earnedBadges: [], totalPoints: learner.points ?? 0, visibleBadges: [] }

  if (!existingProgress.data || !existingProgress.data.completed) {
    await createNotification({
      admin,
      userId: learner.id,
      title: "Lesson completed",
      message: `Great job completing ${lessonResult.data.title}.`
    })
  }

  if (courseCompleted) {
    await admin
      .from("enrollments")
      .update({
        status: "completed",
        completed_at: completedAt
      })
      .eq("id", enrollmentResult.data.id)

    const certificateResult = await issueCourseCertificate({
      admin,
      learnerId: learner.id,
      learnerName: learner.name,
      courseId: params.id,
      courseTitle: courseResult.data.title,
      issuedAt: completedAt
    })

    certificateIssued = certificateResult.issued

    if (completionWasNew) {
      await createNotification({
        admin,
        userId: learner.id,
        title: `Congratulations! You completed ${courseResult.data.title}!`,
        message: "The course is now marked complete in your learning record."
      })
    }

    if (certificateIssued) {
      await createNotification({
        admin,
        userId: learner.id,
        title: "Your certificate is ready!",
        message: `${courseResult.data.title} certificate is available from your certificates page.`
      })
    }
  }

  return NextResponse.json({
    nextLessonId: nextLesson?.id ?? null,
    progressPercent,
    courseCompleted,
    certificateIssued,
    earnedBadges: rewardResult.earnedBadges
  })
}
