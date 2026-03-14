import "server-only"

import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Role = "admin" | "instructor" | "learner"
type CourseStatus = "draft" | "published" | "archived"
type LessonType = "video" | "document" | "scorm" | "text"
type EnrollmentStatus = "in_progress" | "completed" | "dropped"

type UserRow = {
  id: string
  name: string
  email: string
  role: Role
  avatar_url: string | null
  points: number | null
  badges: unknown
}

type CourseRow = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: CourseStatus
  price: number | string | null
  instructor_id: string | null
  created_at: string
}

type EnrollmentRow = {
  id: string
  user_id: string
  course_id: string
  status: EnrollmentStatus
  enrolled_at: string
  completed_at: string | null
}

type LessonRow = {
  id: string
  course_id: string
  title: string
  type: LessonType
  content: string | null
  video_url: string | null
  file_url: string | null
  duration_seconds: number | null
  sort_order: number
}

type ProgressRow = {
  id: string
  enrollment_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
}

type GradeRow = {
  id: string
  user_id: string
  assessment_id: string
  score: number | string
  passed: boolean
  submitted_at: string
}

type AssessmentRow = {
  id: string
  course_id: string
  title: string
  passing_score: number | null
  time_limit_minutes: number | null
  created_at: string
}

type CertificateRow = {
  id: string
  user_id: string
  course_id: string
  certificate_url: string | null
  issued_at: string
}

export type LearnerViewer = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  points: number
  badges: string[]
}

export type LearnerLeaderboardEntry = {
  rank: number
  id: string
  name: string
  avatarUrl: string | null
  points: number
  badges: number
}

export type LearnerDashboardData = {
  viewer: LearnerViewer
  metrics: Array<{
    label: string
    value: string
  }>
  continueCourses: Array<{
    enrollmentId: string
    courseId: string
    title: string
    thumbnailUrl: string | null
    progressPercent: number
    nextLessonTitle: string
    nextLessonId: string | null
  }>
  upcomingItems: Array<{
    id: string
    title: string
    courseTitle: string
    detail: string
    meta: string
  }>
  achievements: Array<{
    id: string
    title: string
    detail: string
    earnedAt: string
    kind: "badge" | "certificate" | "milestone"
  }>
}

export type LearnerBrowseCourse = {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  instructorName: string
  lessonCount: number
  price: number
  category: string
  isEnrolled: boolean
}

export type LearnerMyCourse = {
  enrollmentId: string
  courseId: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  status: EnrollmentStatus
  progressPercent: number
  lessonCount: number
  completedLessons: number
  nextLessonId: string | null
}

export type LearnerCoursePlayerData = {
  viewer: LearnerViewer
  course: {
    id: string
    title: string
    description: string | null
    thumbnailUrl: string | null
    enrollmentId: string
    progressPercent: number
    nextLessonId: string | null
  }
  lessons: Array<{
    id: string
    title: string
    type: LessonType
    content: string | null
    durationSeconds: number | null
    completed: boolean
    signedUrl: string | null
  }>
}

export type LearnerProgressData = {
  viewer: LearnerViewer
  metrics: Array<{
    label: string
    value: string
  }>
  courseBreakdown: Array<{
    courseId: string
    title: string
    progressPercent: number
    completedLessons: number
    totalLessons: number
    status: EnrollmentStatus
  }>
  activitySeries: Array<{
    label: string
    completions: number
  }>
  grades: Array<{
    id: string
    assessmentTitle: string
    courseTitle: string
    score: number
    passed: boolean
    submittedAt: string
  }>
  skills: string[]
}

export type LearnerCertificate = {
  id: string
  courseId: string
  courseTitle: string
  issuedAt: string
  certificateUrl: string | null
}

function asNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return 0
}

function parseBadges(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => `${item}`)
    .filter((badge) => !badge.startsWith("__meta:"))
}

function inferCourseCategory(title: string, description?: string | null) {
  const content = `${title} ${description ?? ""}`.toLowerCase()
  if (content.includes("onboard")) return "Onboarding"
  if (content.includes("product")) return "Product"
  if (content.includes("sale")) return "Sales"
  if (content.includes("compliance") || content.includes("policy")) return "Compliance"
  if (content.includes("lead") || content.includes("manager")) return "Leadership"
  if (content.includes("support") || content.includes("service")) return "Customer Success"
  return "General"
}

function inferSkills(courses: Array<{ title: string; description: string | null }>) {
  const skills = new Set<string>()

  courses.forEach((course) => {
    const category = inferCourseCategory(course.title, course.description)
    skills.add(category)

    const content = `${course.title} ${course.description ?? ""}`.toLowerCase()
    if (content.includes("communication")) skills.add("Communication")
    if (content.includes("analytics") || content.includes("data")) skills.add("Analytics")
    if (content.includes("customer")) skills.add("Customer Experience")
    if (content.includes("lead")) skills.add("Leadership")
    if (content.includes("security")) skills.add("Security")
  })

  return Array.from(skills).slice(0, 6)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

async function getLearnerProfile() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role, avatar_url, points, badges")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "learner") {
    redirect("/login")
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    points: profile.points ?? 0,
    badges: parseBadges(profile.badges)
  } satisfies LearnerViewer
}

async function getAllUsersMap() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("users")
    .select("id, name, email, role, avatar_url, points, badges")

  return new Map(((data ?? []) as UserRow[]).map((user) => [user.id, user]))
}

async function getLearnerCoreData(learnerId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const [coursesResult, enrollmentsResult, lessonsResult, progressResult, gradesResult, assessmentsResult, certificatesResult] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id, title, description, thumbnail_url, status, price, instructor_id, created_at"),
      supabase
        .from("enrollments")
        .select("id, user_id, course_id, status, enrolled_at, completed_at")
        .eq("user_id", learnerId),
      supabase
        .from("lessons")
        .select("id, course_id, title, type, content, video_url, file_url, duration_seconds, sort_order"),
      supabase
        .from("progress")
        .select("id, enrollment_id, lesson_id, completed, completed_at"),
      admin
        .from("grades")
        .select("id, user_id, assessment_id, score, passed, submitted_at")
        .eq("user_id", learnerId),
      admin
        .from("assessments")
        .select("id, course_id, title, passing_score, time_limit_minutes, created_at"),
      supabase
        .from("certificates")
        .select("id, user_id, course_id, certificate_url, issued_at")
        .eq("user_id", learnerId)
    ])

  return {
    courses: (coursesResult.data ?? []) as CourseRow[],
    enrollments: (enrollmentsResult.data ?? []) as EnrollmentRow[],
    lessons: (lessonsResult.data ?? []) as LessonRow[],
    progress: (progressResult.data ?? []) as ProgressRow[],
    grades: (gradesResult.data ?? []) as GradeRow[],
    assessments: (assessmentsResult.data ?? []) as AssessmentRow[],
    certificates: (certificatesResult.data ?? []) as CertificateRow[]
  }
}

function buildEnrollmentCourseCards({
  courses,
  enrollments,
  lessons,
  progress
}: {
  courses: CourseRow[]
  enrollments: EnrollmentRow[]
  lessons: LessonRow[]
  progress: ProgressRow[]
}) {
  return enrollments.map((enrollment) => {
    const course = courses.find((item) => item.id === enrollment.course_id)
    const courseLessons = lessons
      .filter((lesson) => lesson.course_id === enrollment.course_id)
      .sort((left, right) => left.sort_order - right.sort_order)
    const completedLessonIds = new Set(
      progress
        .filter((item) => item.enrollment_id === enrollment.id && item.completed)
        .map((item) => item.lesson_id)
    )
    const nextLesson = courseLessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? courseLessons[0] ?? null
    const progressPercent =
      courseLessons.length === 0
        ? enrollment.status === "completed"
          ? 100
          : 0
        : (completedLessonIds.size / courseLessons.length) * 100

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.course_id,
      title: course?.title ?? "Untitled course",
      description: course?.description ?? null,
      thumbnailUrl: course?.thumbnail_url ?? null,
      status: enrollment.status,
      progressPercent,
      lessonCount: courseLessons.length,
      completedLessons: completedLessonIds.size,
      nextLessonId: nextLesson?.id ?? null,
      enrolledAt: enrollment.enrolled_at,
      completedAt: enrollment.completed_at
    }
  })
}

async function getSignedUrl(bucket: "lesson-videos" | "lesson-documents" | "certificates", path: string | null) {
  if (!path) return null
  const admin = createAdminClient()
  const result = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60)
  return result.data?.signedUrl ?? null
}

export async function getLearnerViewer() {
  return getLearnerProfile()
}

export async function getLearnerDashboardData(): Promise<LearnerDashboardData> {
  const viewer = await getLearnerProfile()
  const { courses, enrollments, lessons, progress, grades, assessments, certificates } =
    await getLearnerCoreData(viewer.id)

  const enrolledCards = buildEnrollmentCourseCards({ courses, enrollments, lessons, progress })
  const completedCourses = enrolledCards.filter((course) => course.status === "completed").length
  const continueCourses = enrolledCards
    .filter((course) => course.status === "in_progress")
    .sort((left, right) => right.progressPercent - left.progressPercent)
    .slice(0, 3)
    .map((course) => ({
      enrollmentId: course.enrollmentId,
      courseId: course.courseId,
      title: course.title,
      thumbnailUrl: course.thumbnailUrl,
      progressPercent: course.progressPercent,
      nextLessonTitle:
        lessons.find((lesson) => lesson.id === course.nextLessonId)?.title ?? "Resume course",
      nextLessonId: course.nextLessonId
    }))

  const upcomingItems = assessments
    .filter((assessment) =>
      enrollments.some(
        (enrollment) =>
          enrollment.course_id === assessment.course_id &&
          enrollment.status === "in_progress" &&
          !grades.some((grade) => grade.assessment_id === assessment.id && grade.passed)
      )
    )
    .slice(0, 4)
    .map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      courseTitle: courses.find((course) => course.id === assessment.course_id)?.title ?? "Course",
      detail:
        assessment.time_limit_minutes != null
          ? `${assessment.time_limit_minutes} minute assessment`
          : "Self-paced assessment",
      meta: "Recommended next"
    }))

  const achievements = [
    ...viewer.badges.map((badge, index) => ({
      id: `badge-${index}`,
      title: badge,
      detail: "Badge earned on your learner profile.",
      earnedAt: new Date().toISOString(),
      kind: "badge" as const
    })),
    ...certificates.map((certificate) => ({
      id: certificate.id,
      title: courses.find((course) => course.id === certificate.course_id)?.title ?? "Certificate earned",
      detail: "Course certificate issued.",
      earnedAt: certificate.issued_at,
      kind: "certificate" as const
    })),
    ...enrolledCards
      .filter((course) => course.progressPercent >= 50)
      .slice(0, 2)
      .map((course) => ({
        id: `milestone-${course.courseId}`,
        title: `${course.title} milestone`,
        detail: `${formatPercent(course.progressPercent)} of the course completed.`,
        earnedAt: course.completedAt ?? course.enrolledAt,
        kind: "milestone" as const
      }))
  ]
    .sort((left, right) => new Date(right.earnedAt).getTime() - new Date(left.earnedAt).getTime())
    .slice(0, 4)

  return {
    viewer,
    metrics: [
      { label: "Enrolled Courses", value: `${enrolledCards.length}` },
      { label: "Completed Courses", value: `${completedCourses}` },
      { label: "Certificates Earned", value: `${certificates.length}` },
      { label: "Total Points", value: `${viewer.points}` }
    ],
    continueCourses,
    upcomingItems,
    achievements
  }
}

export async function getBrowseCoursesData() {
  const viewer = await getLearnerProfile()
  const { courses, enrollments, lessons } = await getLearnerCoreData(viewer.id)
  const usersMap = await getAllUsersMap()

  const publishedCourses = courses.filter((course) => course.status === "published")

  return {
    viewer,
    categories: Array.from(
      new Set(publishedCourses.map((course) => inferCourseCategory(course.title, course.description)))
    ).sort(),
    courses: publishedCourses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      instructorName: usersMap.get(course.instructor_id ?? "")?.name ?? "Instructor",
      lessonCount: lessons.filter((lesson) => lesson.course_id === course.id).length,
      price: asNumber(course.price),
      category: inferCourseCategory(course.title, course.description),
      isEnrolled: enrollments.some((enrollment) => enrollment.course_id === course.id)
    } satisfies LearnerBrowseCourse))
  }
}

export async function getLearnerMyCoursesData() {
  const viewer = await getLearnerProfile()
  const { courses, enrollments, lessons, progress } = await getLearnerCoreData(viewer.id)

  return {
    viewer,
    courses: buildEnrollmentCourseCards({ courses, enrollments, lessons, progress })
  }
}

export async function getLearnerCoursePlayerData(courseId: string): Promise<LearnerCoursePlayerData> {
  const viewer = await getLearnerProfile()
  const { courses, enrollments, lessons, progress } = await getLearnerCoreData(viewer.id)

  const enrollment = enrollments.find((item) => item.course_id === courseId)
  if (!enrollment) {
    redirect("/learner/my-courses")
  }

  const course = courses.find((item) => item.id === courseId)
  if (!course) {
    redirect("/learner/my-courses")
  }

  const courseLessons = lessons
    .filter((lesson) => lesson.course_id === courseId)
    .sort((left, right) => left.sort_order - right.sort_order)
  const completedLessonIds = new Set(
    progress
      .filter((item) => item.enrollment_id === enrollment.id && item.completed)
      .map((item) => item.lesson_id)
  )
  const progressPercent =
    courseLessons.length === 0
      ? 0
      : (completedLessonIds.size / courseLessons.length) * 100
  const nextLesson = courseLessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? courseLessons[0] ?? null

  const signedUrls = await Promise.all(
    courseLessons.map(async (lesson) => {
      if (lesson.type === "video") {
        return getSignedUrl("lesson-videos", lesson.video_url)
      }
      if (lesson.type === "document" || lesson.type === "scorm") {
        return getSignedUrl("lesson-documents", lesson.file_url)
      }
      return null
    })
  )

  return {
    viewer,
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      enrollmentId: enrollment.id,
      progressPercent,
      nextLessonId: nextLesson?.id ?? null
    },
    lessons: courseLessons.map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      content: lesson.content,
      durationSeconds: lesson.duration_seconds,
      completed: completedLessonIds.has(lesson.id),
      signedUrl: signedUrls[index]
    }))
  }
}

export async function getLearnerProgressData(): Promise<LearnerProgressData> {
  const viewer = await getLearnerProfile()
  const { courses, enrollments, lessons, progress, grades, assessments } = await getLearnerCoreData(viewer.id)
  const courseBreakdown = buildEnrollmentCourseCards({ courses, enrollments, lessons, progress }).map((course) => ({
    courseId: course.courseId,
    title: course.title,
    progressPercent: course.progressPercent,
    completedLessons: course.completedLessons,
    totalLessons: course.lessonCount,
    status: course.status
  }))

  const courseMap = new Map(courses.map((course) => [course.id, course]))
  const assessmentMap = new Map(assessments.map((assessment) => [assessment.id, assessment]))

  const activityBuckets = new Map<string, number>()
  progress
    .filter((item) => item.completed_at)
    .forEach((item) => {
      const key = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
        new Date(item.completed_at as string)
      )
      activityBuckets.set(key, (activityBuckets.get(key) ?? 0) + 1)
    })

  const activitySeries = Array.from(activityBuckets.entries())
    .map(([label, completions]) => ({ label, completions }))
    .slice(-8)

  return {
    viewer,
    metrics: [
      { label: "Learning Momentum", value: `${activitySeries.reduce((sum, item) => sum + item.completions, 0)}` },
      { label: "Avg Course Progress", value: formatPercent(courseBreakdown.length === 0 ? 0 : courseBreakdown.reduce((sum, course) => sum + course.progressPercent, 0) / courseBreakdown.length) },
      { label: "Assessments Taken", value: `${grades.length}` },
      { label: "Pass Rate", value: formatPercent(grades.length === 0 ? 0 : (grades.filter((grade) => grade.passed).length / grades.length) * 100) }
    ],
    courseBreakdown,
    activitySeries,
    grades: grades
      .map((grade) => {
        const assessment = assessmentMap.get(grade.assessment_id)
        return {
          id: grade.id,
          assessmentTitle: assessment?.title ?? "Assessment",
          courseTitle: courseMap.get(assessment?.course_id ?? "")?.title ?? "Course",
          score: asNumber(grade.score),
          passed: grade.passed,
          submittedAt: grade.submitted_at
        }
      })
      .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()),
    skills: inferSkills(courses.filter((course) => enrollments.some((enrollment) => enrollment.course_id === course.id)))
  }
}

export async function getLearnerCertificatesData() {
  const viewer = await getLearnerProfile()
  const { courses, certificates } = await getLearnerCoreData(viewer.id)

  const signedUrls = await Promise.all(
    certificates.map((certificate) => getSignedUrl("certificates", certificate.certificate_url))
  )

  return {
    viewer,
    certificates: certificates.map((certificate, index) => ({
      id: certificate.id,
      courseId: certificate.course_id,
      courseTitle: courses.find((course) => course.id === certificate.course_id)?.title ?? "Course certificate",
      issuedAt: certificate.issued_at,
      certificateUrl: signedUrls[index]
    } satisfies LearnerCertificate))
  }
}

export async function getLearnerLeaderboardData() {
  const viewer = await getLearnerProfile()
  const usersMap = await getAllUsersMap()
  const admin = createAdminClient()
  const [allEnrollmentsResult, allProgressResult, allGradesResult] = await Promise.all([
    admin.from("enrollments").select("id, user_id, course_id, status, enrolled_at, completed_at"),
    admin.from("progress").select("id, enrollment_id, lesson_id, completed, completed_at"),
    admin.from("grades").select("id, user_id, assessment_id, score, passed, submitted_at")
  ])

  const allUsers = Array.from(usersMap.values()).filter((user) => user.role === "learner")
  const allEnrollments = (allEnrollmentsResult.data ?? []) as EnrollmentRow[]
  const allProgress = (allProgressResult.data ?? []) as ProgressRow[]
  const allGrades = (allGradesResult.data ?? []) as GradeRow[]
  const enrollmentUserMap = new Map(allEnrollments.map((enrollment) => [enrollment.id, enrollment.user_id]))
  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000

  function buildEntries(mode: "all-time" | "weekly") {
    const entries = allUsers
      .map((user) => {
        const weeklyPoints =
          allProgress.filter(
            (item) =>
              item.completed &&
              item.completed_at &&
              new Date(item.completed_at).getTime() >= weekCutoff &&
              enrollmentUserMap.get(item.enrollment_id) === user.id
          ).length *
            10 +
          allEnrollments.filter(
            (enrollment) =>
              enrollment.user_id === user.id &&
              enrollment.completed_at &&
              new Date(enrollment.completed_at).getTime() >= weekCutoff
          ).length *
            100 +
          allGrades.filter(
            (grade) => grade.user_id === user.id && grade.passed && new Date(grade.submitted_at).getTime() >= weekCutoff
          ).length *
            50

        return {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatar_url,
          points: mode === "all-time" ? user.points ?? 0 : weeklyPoints,
          badges: parseBadges(user.badges).length
        }
      })
      .sort((left, right) => right.points - left.points || left.name.localeCompare(right.name))

    return entries.map((entry, index) => ({
      rank: index + 1,
      ...entry
    })) as LearnerLeaderboardEntry[]
  }

  const allTime = buildEntries("all-time")
  const weekly = buildEntries("weekly")

  return {
    viewer,
    allTime: allTime.slice(0, 10),
    weekly: weekly.slice(0, 10),
    allTimeRank: allTime.find((entry) => entry.id === viewer.id)?.rank ?? null,
    weeklyRank: weekly.find((entry) => entry.id === viewer.id)?.rank ?? null
  }
}
