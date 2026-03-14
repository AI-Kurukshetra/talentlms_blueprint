import Stripe from "stripe"
import { NextResponse } from "next/server"

import { ensureEnrollmentForPayment, getStripeClient } from "@/lib/payments"

export async function POST(request: Request) {
  const stripe = getStripeClient()
  const signature = request.headers.get("stripe-signature")
  const rawBody = await request.text()

  let event: Stripe.Event

  if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } else {
    event = JSON.parse(rawBody) as Stripe.Event
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const courseId = session.metadata?.courseId
    const userId = session.metadata?.userId

    if (courseId && userId) {
      await ensureEnrollmentForPayment({
        courseId,
        userId
      })
    }
  }

  return NextResponse.json({ received: true })
}
