import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Role = "admin" | "instructor" | "learner"

type UserRow = {
  id: string
  name: string
  email: string
  role: Role
  created_at: string
}

type CourseRow = {
  id: string
  title: string
  price: number | string | null
  created_at: string
}

type EnrollmentRow = {
  id: string
  user_id: string
  course_id: string
  status: "in_progress" | "completed" | "dropped"
  enrolled_at: string
}

type LessonRow = {
  id: string
  course_id: string
}

type ProgressRow = {
  enrollment_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
}

type AssessmentRow = {
  id: string
  course_id: string
  title: string
}

type GradeRow = {
  assessment_id: string
  passed: boolean
}

function asNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return 0
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value)
}

function dayLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value))
}

function toBucketDate(value: string) {
  const date = new Date(value)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

function getRangeStart(days: number) {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() - (days - 1))
  return date
}

function percent(value: number) {
  return `${value.toFixed(1)}%`
}

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized")
  }
}

export async function getAdminAdvancedAnalyticsData() {
  await assertAdmin()
  const admin = createAdminClient()

  const [usersResult, coursesResult, enrollmentsResult, lessonsResult, progressResult, assessmentsResult, gradesResult] =
    await Promise.all([
      admin.from("users").select("id, name, email, role, created_at"),
      admin.from("courses").select("id, title, price, created_at"),
      admin.from("enrollments").select("id, user_id, course_id, status, enrolled_at"),
      admin.from("lessons").select("id, course_id"),
      admin.from("progress").select("enrollment_id, lesson_id, completed, completed_at"),
      admin.from("assessments").select("id, course_id, title"),
      admin.from("grades").select("assessment_id, passed")
    ])

  const users = (usersResult.data ?? []) as UserRow[]
  const courses = (coursesResult.data ?? []) as CourseRow[]
  const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[]
  const lessons = (lessonsResult.data ?? []) as LessonRow[]
  const progress = (progressResult.data ?? []) as ProgressRow[]
  const assessments = (assessmentsResult.data ?? []) as AssessmentRow[]
  const grades = (gradesResult.data ?? []) as GradeRow[]

  const courseMap = new Map(courses.map((course) => [course.id, course]))
  const userMap = new Map(users.map((user) => [user.id, user]))
  const lessonsByCourse = lessons.reduce<Map<string, LessonRow[]>>((map, lesson) => {
    const next = map.get(lesson.course_id) ?? []
    next.push(lesson)
    map.set(lesson.course_id, next)
    return map
  }, new Map())

  const registrationsByDay = users.reduce<Map<string, number>>((map, user) => {
    const key = toBucketDate(user.created_at)
    map.set(key, (map.get(key) ?? 0) + 1)
    return map
  }, new Map())

  const enrollmentsByDay = enrollments.reduce<Map<string, number>>((map, enrollment) => {
    const key = toBucketDate(enrollment.enrolled_at)
    map.set(key, (map.get(key) ?? 0) + 1)
    return map
  }, new Map())

  const allDates = Array.from(new Set([...registrationsByDay.keys(), ...enrollmentsByDay.keys()])).sort()
  const timeline = allDates.map((date) => ({
    date,
    label: dayLabel(date),
    registrations: registrationsByDay.get(date) ?? 0,
    enrollments: enrollmentsByDay.get(date) ?? 0
  }))

  const topCourses = courses
    .map((course) => {
      const courseEnrollments = enrollments.filter((enrollment) => enrollment.course_id === course.id)
      return {
        name: course.title,
        enrollments: courseEnrollments.length
      }
    })
    .sort((left, right) => right.enrollments - left.enrollments)
    .slice(0, 10)

  const completionRates = courses
    .map((course) => {
      const courseEnrollments = enrollments.filter((enrollment) => enrollment.course_id === course.id)
      const completed = courseEnrollments.filter((enrollment) => enrollment.status === "completed").length
      return {
        name: course.title,
        completionRate: courseEnrollments.length === 0 ? 0 : Number(((completed / courseEnrollments.length) * 100).toFixed(1))
      }
    })
    .sort((left, right) => right.completionRate - left.completionRate)
    .slice(0, 10)

  const passDistribution = [
    { name: "Passed", value: grades.filter((grade) => grade.passed).length },
    { name: "Failed", value: grades.filter((grade) => !grade.passed).length }
  ]

  const paidEnrollments = enrollments.filter((enrollment) => asNumber(courseMap.get(enrollment.course_id)?.price) > 0)
  const totalRevenueValue = paidEnrollments.reduce(
    (sum, enrollment) => sum + asNumber(courseMap.get(enrollment.course_id)?.price),
    0
  )

  const atRiskLearners = enrollments
    .filter((enrollment) => enrollment.status === "in_progress")
    .map((enrollment) => {
      const enrollmentLessons = lessonsByCourse.get(enrollment.course_id) ?? []
      const completedProgress = progress.filter(
        (item) => item.enrollment_id === enrollment.id && item.completed
      )
      const progressPercent =
        enrollmentLessons.length === 0 ? 0 : (completedProgress.length / enrollmentLessons.length) * 100
      const lastActive =
        completedProgress
          .map((item) => item.completed_at)
          .filter((item): item is string => Boolean(item))
          .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? enrollment.enrolled_at

      return {
        enrollmentId: enrollment.id,
        learnerId: enrollment.user_id,
        name: userMap.get(enrollment.user_id)?.name ?? "Unknown learner",
        courseTitle: courseMap.get(enrollment.course_id)?.title ?? "Unknown course",
        progressPercent: Number(progressPercent.toFixed(1)),
        lastActive
      }
    })
    .filter((row) => {
      const daysIdle = (Date.now() - new Date(row.lastActive).getTime()) / 86400000
      return row.progressPercent < 50 && daysIdle >= 7
    })
    .sort((left, right) => new Date(left.lastActive).getTime() - new Date(right.lastActive).getTime())
    .slice(0, 20)

  const metricsByRange = [7, 30, 90].reduce<Record<string, {
    totalUsers: string
    totalCourses: string
    totalEnrollments: string
    completionRate: string
    totalRevenue: string
  }>>((accumulator, range) => {
    const rangeStart = getRangeStart(range)
    const rangeUsers = users.filter((user) => new Date(user.created_at) >= rangeStart)
    const rangeCourses = courses.filter((course) => new Date(course.created_at) >= rangeStart)
    const rangeEnrollments = enrollments.filter((enrollment) => new Date(enrollment.enrolled_at) >= rangeStart)
    const completed = rangeEnrollments.filter((enrollment) => enrollment.status === "completed").length
    const revenue = rangeEnrollments.reduce((sum, enrollment) => sum + asNumber(courseMap.get(enrollment.course_id)?.price), 0)

    accumulator[String(range)] = {
      totalUsers: `${rangeUsers.length}`,
      totalCourses: `${rangeCourses.length}`,
      totalEnrollments: `${rangeEnrollments.length}`,
      completionRate: percent(rangeEnrollments.length === 0 ? 0 : (completed / rangeEnrollments.length) * 100),
      totalRevenue: formatCurrency(revenue)
    }

    return accumulator
  }, {})

  const reportRows = enrollments.map((enrollment) => ({
    learnerName: userMap.get(enrollment.user_id)?.name ?? "Unknown learner",
    learnerEmail: userMap.get(enrollment.user_id)?.email ?? "",
    courseTitle: courseMap.get(enrollment.course_id)?.title ?? "Unknown course",
    status: enrollment.status,
    enrolledAt: enrollment.enrolled_at,
    amount: asNumber(courseMap.get(enrollment.course_id)?.price)
  }))

  return {
    metricsByRange,
    timeline,
    topCourses,
    completionRates,
    passDistribution,
    atRiskLearners,
    reportRows,
    summary: {
      totalRevenue: formatCurrency(totalRevenueValue),
      totalAssessments: assessments.length
    }
  }
}
