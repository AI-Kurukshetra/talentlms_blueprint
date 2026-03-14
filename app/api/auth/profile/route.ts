import { NextResponse } from "next/server"

import { ensureUserProfile } from "@/lib/auth/profile"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const profile = await ensureUserProfile(user)
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to ensure profile."
      },
      { status: 500 }
    )
  }
}
