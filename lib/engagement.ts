import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

const META_PREFIX = "__meta:"

type KnownBadge =
  | "First Course"
  | "Fast Learner"
  | "Perfect Score"
  | "Dedicated"

type RewardResult = {
  earnedBadges: KnownBadge[]
  totalPoints: number
  visibleBadges: string[]
}

function toBadgeArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => `${item}`)
}

function getMetaValue(badges: string[], key: string) {
  const item = badges.find((badge) => badge.startsWith(`${META_PREFIX}${key}:`))
  if (!item) return null
  return item.slice(`${META_PREFIX}${key}:`.length)
}

function setMetaValue(badges: string[], key: string, value: string) {
  const next = badges.filter((badge) => !badge.startsWith(`${META_PREFIX}${key}:`))
  next.push(`${META_PREFIX}${key}:${value}`)
  return next
}

function getVisibleBadges(badges: string[]) {
  return badges.filter((badge) => !badge.startsWith(META_PREFIX))
}

export async function createNotification({
  admin,
  userId,
  title,
  message
}: {
  admin: SupabaseClient
  userId: string
  title: string
  message: string
}) {
  await admin.from("notifications").insert({
    user_id: userId,
    title,
    message
  })
}

export async function applyRewards({
  admin,
  userId,
  pointsDelta = 0,
  badgesToAward = [],
  loginDate
}: {
  admin: SupabaseClient
  userId: string
  pointsDelta?: number
  badgesToAward?: KnownBadge[]
  loginDate?: string
}): Promise<RewardResult> {
  const { data: user } = await admin
    .from("users")
    .select("points, badges")
    .eq("id", userId)
    .single()

  const rawBadges = toBadgeArray(user?.badges)
  let nextBadges = [...rawBadges]
  const earnedBadges: KnownBadge[] = []

  for (const badge of badgesToAward) {
    if (!getVisibleBadges(nextBadges).includes(badge)) {
      nextBadges.push(badge)
      earnedBadges.push(badge)
    }
  }

  if (loginDate) {
    const lastLogin = getMetaValue(nextBadges, "last-login")
    const previousStreak = Number(getMetaValue(nextBadges, "login-streak") ?? "0")
    let nextStreak = previousStreak

    if (lastLogin !== loginDate) {
      const currentDate = new Date(`${loginDate}T00:00:00.000Z`)
      const previousDate = lastLogin ? new Date(`${lastLogin}T00:00:00.000Z`) : null
      const dayDifference = previousDate
        ? Math.round((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24))
        : null

      if (dayDifference === 1) {
        nextStreak = previousStreak + 1
      } else if (dayDifference === 0) {
        nextStreak = previousStreak
      } else {
        nextStreak = 1
      }

      nextBadges = setMetaValue(nextBadges, "last-login", loginDate)
      nextBadges = setMetaValue(nextBadges, "login-streak", `${nextStreak}`)

      if (nextStreak >= 7 && !getVisibleBadges(nextBadges).includes("Dedicated")) {
        nextBadges.push("Dedicated")
        earnedBadges.push("Dedicated")
      }
    }
  }

  const nextPoints = (user?.points ?? 0) + pointsDelta

  await admin
    .from("users")
    .update({
      points: nextPoints,
      badges: nextBadges
    })
    .eq("id", userId)

  for (const badge of earnedBadges) {
    await createNotification({
      admin,
      userId,
      title: `Badge unlocked: ${badge}`,
      message: `You earned the ${badge} badge.`
    })
  }

  return {
    earnedBadges,
    totalPoints: nextPoints,
    visibleBadges: getVisibleBadges(nextBadges)
  }
}
