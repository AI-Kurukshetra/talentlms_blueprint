import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const allowedBuckets = new Set(["course-thumbnails", "lesson-videos", "lesson-documents"])

async function assertInstructor() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "instructor") return null

  return user
}

export async function POST(request: Request) {
  const user = await assertInstructor()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const bucket = String(formData.get("bucket") ?? "")
  const file = formData.get("file")

  if (!allowedBuckets.has(bucket) || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 })
  }

  const admin = createAdminClient()
  const safeName = file.name.replace(/\s+/g, "-").toLowerCase()
  const path = `${user.id}/${Date.now()}-${safeName}`

  const { error } = await admin.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const publicUrl =
    bucket === "course-thumbnails" ? admin.storage.from(bucket).getPublicUrl(path).data.publicUrl : null

  return NextResponse.json({
    bucket,
    path,
    fileName: file.name,
    storageKey: `${bucket}/${path}`,
    publicUrl
  })
}
