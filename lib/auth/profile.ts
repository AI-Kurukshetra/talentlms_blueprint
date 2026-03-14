import "server-only"

import type { User } from "@supabase/supabase-js"

import { normalizeRole } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function ensureUserProfile(user: User) {
  const admin = createAdminClient()

  const { data: existing, error: existingError } = await admin
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existing) {
    return {
      id: existing.id,
      role: normalizeRole(existing.role)
    }
  }

  const email = user.email
  if (!email) {
    throw new Error("Authenticated user is missing an email address.")
  }

  const fallbackName =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim().length > 0
      ? user.user_metadata.name.trim()
      : email.split("@")[0]

  const desiredRole =
    typeof user.user_metadata?.role === "string" ? normalizeRole(user.user_metadata.role) : "learner"

  const { data: inserted, error: insertError } = await admin
    .from("users")
    .upsert(
      {
        id: user.id,
        email,
        name: fallbackName,
        role: desiredRole
      },
      {
        onConflict: "id"
      }
    )
    .select("id, role")
    .single()

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Unable to create public user profile.")
  }

  return {
    id: inserted.id,
    role: normalizeRole(inserted.role)
  }
}
