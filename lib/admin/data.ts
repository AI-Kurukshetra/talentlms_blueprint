import "server-only"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

type Role = "admin" | "instructor" | "learner"

export type AdminViewer = {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl: string | null
}

export type DashboardMetric = {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "flat"
}

export type RecentEnrollment = {
  id: string
  learnerName: string
  courseTitle: string
  enrolledDate: string
  status: string
}

export type ChartDatum = {
  name: string
  enrollments: number
}

export type AtRiskLearner = {
  id: string
  name: string
  email: string
  courseTitle: string
  idleDays: number
}

export type AdminUserRow = {
  id: string
  avatarUrl: string | null
  name: string
  email: string
  role: Role
  groupId: string | null
  groupName: string | null
  joinedDate: string
}

export type AdminGroup = {
  id: string
  name: string
  memberCount: number
  members: Array<{
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }>
}

export type AdminSettingsData = {
  id: string | null
  platformName: string
  logoUrl: string
  defaultUserRole: Role
  emailNotifications: {
    enrollments: boolean
    reminders: boolean
    weeklyDigest: boolean
  }
}

type BasicUser = {
  id: string
  name: string
  email: string
  role: Role
  avatar_url: string | null
  group_id: string | null
  created_at: string
}

type BasicGroup = {
  id: string
  name: string
}

type EnrollmentRow = {
  id: string
  user_id: string
  course_id: string
  status: string
  enrolled_at: string
}

type CourseRow = {
  id: string
  title: string
  created_at: string
}

type OrgRow = {
  id: string
  name: string
  logo_url: string | null
  theme: {
    defaultUserRole?: Role
    emailNotifications?: {
      enrollments?: boolean
      reminders?: boolean
      weeklyDigest?: boolean
    }
  } | null
}

function startOfWindow(daysAgo: number) {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() - daysAgo)
  return date.toISOString()
}

function percentageChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return { text: "0% vs last month", trend: "flat" as const }
  if (previous === 0) return { text: "+100% vs last month", trend: "up" as const }
  const delta = ((current - previous) / previous) * 100
  const sign = delta > 0 ? "+" : ""
  return {
    text: `${sign}${delta.toFixed(1)}% vs last month`,
    trend: delta > 0 ? ("up" as const) : delta < 0 ? ("down" as const) : ("flat" as const)
  }
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export async function getAdminViewer() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    redirect("/learner")
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatarUrl: profile.avatar_url
  } satisfies AdminViewer
}

export async function getAdminDashboardData() {
  const supabase = await createClient()
  const viewer = await getAdminViewer()

  const last30 = startOfWindow(30)
  const last60 = startOfWindow(60)
  const last7 = startOfWindow(7)

  const [
    usersCount,
    usersCurrent,
    usersPrevious,
    coursesCount,
    coursesCurrent,
    coursesPrevious,
    enrollments,
    users,
    courses,
    recentEnrollmentsResult
  ] = await Promise.all([
    supabase.from("users").select("id", { head: true, count: "exact" }),
    supabase.from("users").select("id", { head: true, count: "exact" }).gte("created_at", last30),
    supabase.from("users").select("id", { head: true, count: "exact" }).gte("created_at", last60).lt("created_at", last30),
    supabase.from("courses").select("id", { head: true, count: "exact" }),
    supabase.from("courses").select("id", { head: true, count: "exact" }).gte("created_at", last30),
    supabase.from("courses").select("id", { head: true, count: "exact" }).gte("created_at", last60).lt("created_at", last30),
    supabase.from("enrollments").select("id, user_id, course_id, status, enrolled_at").order("enrolled_at", { ascending: false }),
    supabase.from("users").select("id, name, email, role, avatar_url, created_at, group_id"),
    supabase.from("courses").select("id, title, created_at"),
    supabase.from("enrollments").select("id, user_id, course_id, status, enrolled_at").order("enrolled_at", { ascending: false }).limit(10)
  ])

  const enrollmentRows = (enrollments.data ?? []) as EnrollmentRow[]
  const usersRows = (users.data ?? []) as BasicUser[]
  const courseRows = (courses.data ?? []) as CourseRow[]
  const recentEnrollmentRows = (recentEnrollmentsResult.data ?? []) as EnrollmentRow[]

  const usersMap = new Map(usersRows.map((item) => [item.id, item]))
  const coursesMap = new Map(courseRows.map((item) => [item.id, item]))

  const activeEnrollments = enrollmentRows.filter((row) => row.status === "in_progress")
  const completedEnrollments = enrollmentRows.filter((row) => row.status === "completed")
  const currentActive = activeEnrollments.filter((row) => row.enrolled_at >= last30).length
  const previousActive = activeEnrollments.filter(
    (row) => row.enrolled_at >= last60 && row.enrolled_at < last30
  ).length

  const currentPeriodEnrollments = enrollmentRows.filter((row) => row.enrolled_at >= last30)
  const previousPeriodEnrollments = enrollmentRows.filter(
    (row) => row.enrolled_at >= last60 && row.enrolled_at < last30
  )

  const currentCompletionRate =
    currentPeriodEnrollments.length === 0
      ? 0
      : (currentPeriodEnrollments.filter((row) => row.status === "completed").length /
          currentPeriodEnrollments.length) *
        100
  const previousCompletionRate =
    previousPeriodEnrollments.length === 0
      ? 0
      : (previousPeriodEnrollments.filter((row) => row.status === "completed").length /
          previousPeriodEnrollments.length) *
        100

  const usersChange = percentageChange(usersCurrent.count ?? 0, usersPrevious.count ?? 0)
  const coursesChange = percentageChange(coursesCurrent.count ?? 0, coursesPrevious.count ?? 0)
  const activeChange = percentageChange(currentActive, previousActive)
  const completionChange = percentageChange(currentCompletionRate, previousCompletionRate)

  const metrics: DashboardMetric[] = [
    { label: "Total Users", value: `${usersCount.count ?? 0}`, delta: usersChange.text, trend: usersChange.trend },
    { label: "Total Courses", value: `${coursesCount.count ?? 0}`, delta: coursesChange.text, trend: coursesChange.trend },
    { label: "Active Enrollments", value: `${activeEnrollments.length}`, delta: activeChange.text, trend: activeChange.trend },
    {
      label: "Completion Rate",
      value: formatPercent(enrollmentRows.length === 0 ? 0 : (completedEnrollments.length / enrollmentRows.length) * 100),
      delta: completionChange.text,
      trend: completionChange.trend
    }
  ]

  const recentEnrollments = recentEnrollmentRows.map((row) => ({
    id: row.id,
    learnerName: usersMap.get(row.user_id)?.name ?? "Unknown learner",
    courseTitle: coursesMap.get(row.course_id)?.title ?? "Unknown course",
    enrolledDate: row.enrolled_at,
    status: row.status
  }))

  const topCourses = Object.values(
    enrollmentRows.reduce<Record<string, { name: string; enrollments: number }>>((accumulator, row) => {
      const title = coursesMap.get(row.course_id)?.title ?? "Unknown course"
      if (!accumulator[row.course_id]) {
        accumulator[row.course_id] = { name: title, enrollments: 0 }
      }
      accumulator[row.course_id].enrollments += 1
      return accumulator
    }, {})
  )
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 5)

  const atRiskMap = new Map<string, { id: string; name: string; email: string; courseTitle: string; idleDays: number }>()
  enrollmentRows
    .filter((row) => row.status === "in_progress" && row.enrolled_at <= last7)
    .forEach((row) => {
      const learner = usersMap.get(row.user_id)
      if (!learner) return
      const idleDays = Math.floor((Date.now() - new Date(row.enrolled_at).getTime()) / 86400000)
      const existing = atRiskMap.get(row.user_id)
      if (!existing || idleDays > existing.idleDays) {
        atRiskMap.set(row.user_id, {
          id: learner.id,
          name: learner.name,
          email: learner.email,
          courseTitle: coursesMap.get(row.course_id)?.title ?? "Unknown course",
          idleDays
        })
      }
    })

  return {
    viewer,
    metrics,
    recentEnrollments,
    topCourses,
    atRiskLearners: Array.from(atRiskMap.values()).sort((a, b) => b.idleDays - a.idleDays).slice(0, 6)
  }
}

export async function getAdminUsersData() {
  const supabase = await createClient()
  const viewer = await getAdminViewer()

  const [usersResult, groupsResult] = await Promise.all([
    supabase.from("users").select("id, name, email, role, avatar_url, group_id, created_at").order("created_at", { ascending: false }),
    supabase.from("groups").select("id, name").order("name")
  ])

  const groups = (groupsResult.data ?? []) as BasicGroup[]
  const groupMap = new Map(groups.map((group) => [group.id, group.name]))

  return {
    viewer,
    users: ((usersResult.data ?? []) as BasicUser[]).map((user) => ({
      id: user.id,
      avatarUrl: user.avatar_url,
      name: user.name,
      email: user.email,
      role: user.role,
      groupId: user.group_id,
      groupName: user.group_id ? groupMap.get(user.group_id) ?? null : null,
      joinedDate: user.created_at
    })),
    groups: groups.map((group) => ({ id: group.id, name: group.name }))
  }
}

export async function getAdminGroupsData() {
  const supabase = await createClient()
  const viewer = await getAdminViewer()

  const [groupsResult, usersResult] = await Promise.all([
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("users").select("id, name, email, avatar_url, group_id").order("name")
  ])

  const groups = (groupsResult.data ?? []) as BasicGroup[]
  const users = (usersResult.data ?? []) as Array<Pick<BasicUser, "id" | "name" | "email" | "avatar_url" | "group_id">>

  return {
    viewer,
    groups: groups.map((group) => {
      const members = users
        .filter((user) => user.group_id === group.id)
        .map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          avatarUrl: member.avatar_url
        }))

      return {
        id: group.id,
        name: group.name,
        memberCount: members.length,
        members
      }
    }),
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      groupId: user.group_id
    }))
  }
}

export async function getAdminSettingsData() {
  const supabase = await createClient()
  const viewer = await getAdminViewer()

  const { data } = await supabase
    .from("organizations")
    .select("id, name, logo_url, theme")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  const settings = data as OrgRow | null

  return {
    viewer,
    settings: {
      id: settings?.id ?? null,
      platformName: settings?.name ?? "CloudLMS",
      logoUrl: settings?.logo_url ?? "",
      defaultUserRole: settings?.theme?.defaultUserRole ?? "learner",
      emailNotifications: {
        enrollments: settings?.theme?.emailNotifications?.enrollments ?? true,
        reminders: settings?.theme?.emailNotifications?.reminders ?? true,
        weeklyDigest: settings?.theme?.emailNotifications?.weeklyDigest ?? false
      }
    } satisfies AdminSettingsData
  }
}
