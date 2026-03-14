import "server-only"

import Stripe from "stripe"

import { createNotification } from "@/lib/engagement"
import { createAdminClient } from "@/lib/supabase/admin"

let stripeClient: Stripe | null = null

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.")
  }

  return secretKey
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-02-25.clover"
    })
  }

  return stripeClient
}

export async function ensureEnrollmentForPayment({
  courseId,
  userId
}: {
  courseId: string
  userId: string
}) {
  const admin = createAdminClient()

  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, status")
    .eq("id", courseId)
    .maybeSingle()

  if (courseError || !course || course.status !== "published") {
    throw new Error(courseError?.message ?? "Course is not available for enrollment.")
  }

  const { data: existingEnrollment, error: existingError } = await admin
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existingEnrollment) {
    return {
      id: existingEnrollment.id,
      courseTitle: course.title,
      isNew: false
    }
  }

  const { data: enrollment, error: enrollmentError } = await admin
    .from("enrollments")
    .insert({
      course_id: courseId,
      user_id: userId,
      status: "in_progress"
    })
    .select("id")
    .single()

  if (enrollmentError || !enrollment) {
    throw new Error(enrollmentError?.message ?? "Unable to create enrollment.")
  }

  await createNotification({
    admin,
    userId,
    title: `Welcome to ${course.title}!`,
    message: "Your enrollment is active. Start with the first lesson when you are ready."
  })

  return {
    id: enrollment.id,
    courseTitle: course.title,
    isNew: true
  }
}
