import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

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
  user_id: string
  assessment_id: string
  score: number | string
  passed: boolean
}

type QuestionRow = {
  id: string
  assessment_id: string
  text: string
  points: number | null
}

type UserRow = {
  id: string
  name: string
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

function monthKey(value: string) {
  const date = new Date(value)
  date.setUTCDate(1)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric"
  }).format(new Date(value))
}

async function assertInstructor() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase.from("users").select("id, role").eq("id", user.id).single()

  if (!profile || profile.role !== "instructor") {
    throw new Error("Unauthorized")
  }

  return profile.id
}

export async function getInstructorRevenueData() {
  const instructorId = await assertInstructor()
  const admin = createAdminClient()

  const { data: coursesData } = await admin
    .from("courses")
    .select("id, title, price, created_at, instructor_id")
    .eq("instructor_id", instructorId)

  const courses = (coursesData ?? []) as Array<CourseRow & { instructor_id: string | null }>
  const courseIds = courses.map((course) => course.id)

  if (courseIds.length === 0) {
    return {
      metrics: [
        { label: "Total Revenue", value: formatCurrency(0) },
        { label: "This Month", value: formatCurrency(0) },
        { label: "Total Sales", value: "0" },
        { label: "Avg Course Price", value: formatCurrency(0) }
      ],
      revenueByCourse: [],
      monthlyRevenue: [],
      recentTransactions: []
    }
  }

  const [enrollmentsResult, usersResult] = await Promise.all([
    admin.from("enrollments").select("id, user_id, course_id, status, enrolled_at").in("course_id", courseIds),
    admin.from("users").select("id, name")
  ])

  const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[]
  const users = new Map(((usersResult.data ?? []) as UserRow[]).map((user) => [user.id, user]))
  const courseMap = new Map(courses.map((course) => [course.id, course]))

  const paidEnrollments = enrollments.filter((enrollment) => asNumber(courseMap.get(enrollment.course_id)?.price) > 0)
  const totalRevenue = paidEnrollments.reduce((sum, enrollment) => sum + asNumber(courseMap.get(enrollment.course_id)?.price), 0)
  const currentMonth = new Date()
  const monthStart = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 1))
  const thisMonthRevenue = paidEnrollments
    .filter((enrollment) => new Date(enrollment.enrolled_at) >= monthStart)
    .reduce((sum, enrollment) => sum + asNumber(courseMap.get(enrollment.course_id)?.price), 0)

  const monthlyRevenueMap = paidEnrollments.reduce<Map<string, number>>((map, enrollment) => {
    const key = monthKey(enrollment.enrolled_at)
    map.set(key, (map.get(key) ?? 0) + asNumber(courseMap.get(enrollment.course_id)?.price))
    return map
  }, new Map())

  const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
    .sort((left, right) => new Date(left[0]).getTime() - new Date(right[0]).getTime())
    .slice(-6)
    .map(([date, revenue]) => ({
      label: monthLabel(date),
      revenue
    }))

  const revenueByCourse = courses
    .map((course) => {
      const courseSales = paidEnrollments.filter((enrollment) => enrollment.course_id === course.id)
      return {
        courseId: course.id,
        title: course.title,
        price: asNumber(course.price),
        totalSales: courseSales.length,
        revenue: courseSales.reduce((sum, enrollment) => sum + asNumber(course.price), 0)
      }
    })
    .sort((left, right) => right.revenue - left.revenue)

  const recentTransactions = paidEnrollments
    .map((enrollment) => ({
      id: enrollment.id,
      learnerName: users.get(enrollment.user_id)?.name ?? "Unknown learner",
      courseTitle: courseMap.get(enrollment.course_id)?.title ?? "Unknown course",
      amount: asNumber(courseMap.get(enrollment.course_id)?.price),
      date: enrollment.enrolled_at
    }))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 10)

  const avgCoursePrice =
    courses.length === 0 ? 0 : courses.reduce((sum, course) => sum + asNumber(course.price), 0) / courses.length

  return {
    metrics: [
      { label: "Total Revenue", value: formatCurrency(totalRevenue) },
      { label: "This Month", value: formatCurrency(thisMonthRevenue) },
      { label: "Total Sales", value: `${paidEnrollments.length}` },
      { label: "Avg Course Price", value: formatCurrency(avgCoursePrice) }
    ],
    revenueByCourse,
    monthlyRevenue,
    recentTransactions
  }
}

export async function getInstructorAnalyticsData() {
  const instructorId = await assertInstructor()
  const admin = createAdminClient()

  const { data: coursesData } = await admin
    .from("courses")
    .select("id, title, price, created_at, instructor_id")
    .eq("instructor_id", instructorId)

  const courses = (coursesData ?? []) as Array<CourseRow & { instructor_id: string | null }>
  const courseIds = courses.map((course) => course.id)

  if (courseIds.length === 0) {
    return {
      engagementSeries: [],
      coursePerformance: [],
      difficultyAnalysis: [],
      progressDistribution: [
        { name: "0-25%", value: 0 },
        { name: "26-50%", value: 0 },
        { name: "51-75%", value: 0 },
        { name: "76-100%", value: 0 }
      ]
    }
  }

  const [enrollmentsResult, lessonsResult, progressResult, assessmentsResult, gradesResult, questionsResult] =
    await Promise.all([
      admin.from("enrollments").select("id, user_id, course_id, status, enrolled_at").in("course_id", courseIds),
      admin.from("lessons").select("id, course_id").in("course_id", courseIds),
      admin.from("progress").select("enrollment_id, lesson_id, completed, completed_at"),
      admin.from("assessments").select("id, course_id, title").in("course_id", courseIds),
      admin.from("grades").select("user_id, assessment_id, score, passed"),
      admin.from("questions").select("id, assessment_id, text, points")
    ])

  const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[]
  const lessons = (lessonsResult.data ?? []) as LessonRow[]
  const progress = (progressResult.data ?? []) as ProgressRow[]
  const assessments = (assessmentsResult.data ?? []) as AssessmentRow[]
  const grades = (gradesResult.data ?? []) as GradeRow[]
  const questions = (questionsResult.data ?? []) as QuestionRow[]

  const courseMap = new Map(courses.map((course) => [course.id, course]))
  const lessonsByCourse = lessons.reduce<Map<string, LessonRow[]>>((map, lesson) => {
    const next = map.get(lesson.course_id) ?? []
    next.push(lesson)
    map.set(lesson.course_id, next)
    return map
  }, new Map())

  const engagementMap = progress
    .filter((item) => item.completed && item.completed_at)
    .reduce<Map<string, number>>((map, item) => {
      const key = monthKey(item.completed_at ?? new Date().toISOString())
      map.set(key, (map.get(key) ?? 0) + 1)
      return map
    }, new Map())

  const engagementSeries = Array.from(engagementMap.entries())
    .sort((left, right) => new Date(left[0]).getTime() - new Date(right[0]).getTime())
    .slice(-6)
    .map(([date, completions]) => ({
      label: monthLabel(date),
      completions
    }))

  const coursePerformance = courses.map((course) => {
    const courseEnrollments = enrollments.filter((enrollment) => enrollment.course_id === course.id)
    const completed = courseEnrollments.filter((enrollment) => enrollment.status === "completed").length
    return {
      title: course.title,
      enrollments: courseEnrollments.length,
      completionRate: courseEnrollments.length === 0 ? 0 : Number(((completed / courseEnrollments.length) * 100).toFixed(1))
    }
  })

  const assessmentMap = new Map(assessments.map((assessment) => [assessment.id, assessment]))
  const difficultyAnalysis = questions
    .filter((question) => assessmentMap.has(question.assessment_id))
    .map((question) => {
      const assessmentGrades = grades.filter((grade) => grade.assessment_id === question.assessment_id)
      const avgAssessmentScore =
        assessmentGrades.length === 0
          ? 0
          : assessmentGrades.reduce((sum, grade) => sum + asNumber(grade.score), 0) / assessmentGrades.length

      return {
        id: question.id,
        question: question.text,
        assessmentTitle: assessmentMap.get(question.assessment_id)?.title ?? "Assessment",
        estimatedCorrectRate: Number(avgAssessmentScore.toFixed(1))
      }
    })
    .sort((left, right) => left.estimatedCorrectRate - right.estimatedCorrectRate)
    .slice(0, 8)

  const progressDistribution = [
    { name: "0-25%", value: 0 },
    { name: "26-50%", value: 0 },
    { name: "51-75%", value: 0 },
    { name: "76-100%", value: 0 }
  ]

  for (const enrollment of enrollments) {
    const courseLessons = lessonsByCourse.get(enrollment.course_id) ?? []
    const completedLessons = progress.filter(
      (item) => item.enrollment_id === enrollment.id && item.completed
    ).length
    const progressPercent =
      courseLessons.length === 0 ? 0 : (completedLessons / courseLessons.length) * 100

    if (progressPercent <= 25) progressDistribution[0].value += 1
    else if (progressPercent <= 50) progressDistribution[1].value += 1
    else if (progressPercent <= 75) progressDistribution[2].value += 1
    else progressDistribution[3].value += 1
  }

  return {
    engagementSeries,
    coursePerformance,
    difficultyAnalysis,
    progressDistribution
  }
}
