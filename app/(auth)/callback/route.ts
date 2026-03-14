import { NextResponse } from "next/server"

import { getDashboardForRole, normalizeRole, type UserRole } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/auth/profile"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin))
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin))
  }

  let role: UserRole = "learner"
  const { data: roleData, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (roleError || !roleData?.role) {
    const ensuredProfile = await ensureUserProfile(user)
    role = normalizeRole(ensuredProfile.role)
  } else {
    role = normalizeRole(roleData.role)
  }

  const requestedPath = next
  const fallbackPath = getDashboardForRole(role)

  return NextResponse.redirect(new URL(requestedPath ?? fallbackPath, requestUrl.origin))
}
