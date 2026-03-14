import { NextResponse } from "next/server"

import { applyRewards, createNotification } from "@/lib/engagement"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function assertLearner() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("id, role").eq("id", user.id).single()
  if (!profile || profile.role !== "learner") return null

  return profile
}

export async function POST(request: Request) {
  const learner = await assertLearner()
  if (!learner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { courseId?: string }
  if (!body.courseId) {
    return NextResponse.json({ error: "Course is required." }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: course } = await admin
    .from("courses")
    .select("id, status, title")
    .eq("id", body.courseId)
    .maybeSingle()

  if (!course || course.status !== "published") {
    return NextResponse.json({ error: "Course is not available for enrollment." }, { status: 404 })
  }

  const existingEnrollment = await admin
    .from("enrollments")
    .select("id")
    .eq("course_id", body.courseId)
    .eq("user_id", learner.id)
    .maybeSingle()

  if (existingEnrollment.data) {
    return NextResponse.json({ id: existingEnrollment.data.id })
  }

  const { data: enrollment, error } = await admin
    .from("enrollments")
    .insert({
      user_id: learner.id,
      course_id: body.courseId,
      status: "in_progress"
    })
    .select("id")
    .single()

  if (error || !enrollment) {
    return NextResponse.json({ error: error?.message ?? "Unable to create enrollment." }, { status: 400 })
  }

  const existingCountResult = await admin
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", learner.id)

  const rewardResult = await applyRewards({
    admin,
    userId: learner.id,
    badgesToAward: existingCountResult.count === 1 ? ["First Course"] : []
  })

  await createNotification({
    admin,
    userId: learner.id,
    title: `Welcome to ${course.title}!`,
    message: "Your enrollment is active. Start with the first lesson when you are ready."
  })

  return NextResponse.json({ id: enrollment.id, earnedBadges: rewardResult.earnedBadges })
}
