import { NextResponse } from "next/server"

import { getStripeClient, ensureEnrollmentForPayment } from "@/lib/payments"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

async function assertLearner() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("id, role").eq("id", user.id).single()
  return profile?.role === "learner" ? profile : null
}

export async function POST(request: Request) {
  const learner = await assertLearner()
  if (!learner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    courseId?: string
    userId?: string
  }

  if (!body.courseId) {
    return NextResponse.json({ error: "Course is required." }, { status: 400 })
  }

  if (body.userId && body.userId !== learner.id) {
    return NextResponse.json({ error: "Invalid user context." }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, description, price, status")
    .eq("id", body.courseId)
    .maybeSingle()

  if (courseError || !course || course.status !== "published") {
    return NextResponse.json(
      { error: courseError?.message ?? "Course is not available for checkout." },
      { status: 404 }
    )
  }

  const { data: existingEnrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("course_id", course.id)
    .eq("user_id", learner.id)
    .maybeSingle()

  if (existingEnrollment) {
    return NextResponse.json({
      url: `/learner/courses/${course.id}?enrolled=true`
    })
  }

  const price = typeof course.price === "number" ? course.price : Number(course.price ?? 0)
  if (price <= 0) {
    await ensureEnrollmentForPayment({
      courseId: course.id,
      userId: learner.id
    })

    return NextResponse.json({
      url: `/learner/courses/${course.id}?enrolled=true`
    })
  }

  const stripe = getStripeClient()
  const origin = new URL(request.url).origin
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/learner/courses/${course.id}?enrolled=true`,
    cancel_url: `${origin}/learner/browse`,
    metadata: {
      courseId: course.id,
      userId: learner.id
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(price * 100),
          product_data: {
            name: course.title,
            description: course.description ?? "CloudLMS course purchase"
          }
        }
      }
    ]
  })

  return NextResponse.json({
    url: session.url
  })
}
