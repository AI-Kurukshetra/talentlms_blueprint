import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Role = "admin" | "instructor" | "learner"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim()
  if (!query) {
    return NextResponse.json({
      courses: [],
      users: [],
      assessments: []
    })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ courses: [], users: [], assessments: [] }, { status: 401 })
  }

  const { data: profile } = await supabase.from("users").select("id, role").eq("id", user.id).single()
  if (!profile) {
    return NextResponse.json({ courses: [], users: [], assessments: [] }, { status: 401 })
  }

  const role = profile.role as Role
  const admin = createAdminClient()
  const search = `%${query}%`

  const [coursesResult, usersResult, assessmentsResult] = await Promise.all([
    role === "learner"
      ? admin
          .from("courses")
          .select("id, title, status")
          .eq("status", "published")
          .ilike("title", search)
          .limit(6)
      : role === "instructor"
        ? admin
            .from("courses")
            .select("id, title")
            .eq("instructor_id", profile.id)
            .ilike("title", search)
            .limit(6)
        : admin.from("courses").select("id, title").ilike("title", search).limit(6),
    role === "learner"
      ? Promise.resolve({ data: [] })
      : admin.from("users").select("id, name, email, role").or(`name.ilike.${search},email.ilike.${search}`).limit(6),
    role === "learner"
      ? admin
          .from("assessments")
          .select("id, title, course_id")
          .ilike("title", search)
          .limit(6)
      : role === "instructor"
        ? admin
            .from("assessments")
            .select("id, title, course_id")
            .ilike("title", search)
            .limit(6)
        : admin.from("assessments").select("id, title, course_id").ilike("title", search).limit(6)
  ])

  return NextResponse.json({
    courses: (coursesResult.data ?? []).map((course: { id: string; title: string; status?: string }) => ({
      id: course.id,
      title: course.title,
      subtitle: role === "learner" ? "Published course" : "Course",
      href: (role === "learner" ? `/learner/browse` : `/instructor/courses/${course.id}`) as const
    })),
    users: (usersResult.data ?? []).map((item: { id: string; name: string; email: string; role: string }) => ({
      id: item.id,
      title: item.name,
      subtitle: `${item.role} • ${item.email}`,
      href: "/admin/users" as const
    })),
    assessments: (assessmentsResult.data ?? []).map((assessment: { id: string; title: string }) => ({
      id: assessment.id,
      title: assessment.title,
      subtitle: role === "learner" ? "Assessment" : "Assessment builder",
      href: (role === "learner"
        ? `/learner/assessments/${assessment.id}`
        : `/instructor/assessments/${assessment.id}/results`) as const
    }))
  })
}
