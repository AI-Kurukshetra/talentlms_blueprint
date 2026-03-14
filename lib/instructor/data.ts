import "server-only"

import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Role = "admin" | "instructor" | "learner"
type CourseStatus = "draft" | "published" | "archived"
type LessonType = "video" | "document" | "text" | "scorm"

export type InstructorViewer = {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl: string | null
}

export type InstructorMetric = {
  label: string
  value: string
}

export type InstructorCourseCard = {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  status: CourseStatus
  price: number
  createdAt: string
  studentCount: number
  completionRate: number
  lessonCount: number
}

export type InstructorActivityItem = {
  id: string
  type: "enrollment" | "progress"
  learnerName: string
  courseTitle: string
  detail: string
  createdAt: string
}

export type CourseLesson = {
  id: string
  title: string
  type: LessonType
  content: string | null
  videoUrl: string | null
  fileUrl: string | null
  durationSeconds: number | null
  sortOrder: number
}

export type InstructorCourseDetail = {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  status: CourseStatus
  price: number
  createdAt: string
  updatedAt: string
  studentCount: number
  completionRate: number
  lessons: Array<
    CourseLesson & {
      completions: number
      completionRate: number
    }
  >
  students: Array<{
    id: string
    name: string
    email: string
    progressPercent: number
    status: string
  }>
  assessments: Array<{
    id: string
    title: string
    submissions: number
    avgScore: number
    passRate: number
  }>
}

export type CourseFormData = {
  id?: string
  title: string
  description: string
  thumbnailUrl: string
  price: number
  status: CourseStatus
  lessons: Array<{
    id?: string
    title: string
    type: LessonType
    content: string
    videoUrl: string
    fileUrl: string
    durationSeconds: number
    sortOrder: number
  }>
}

export type InstructorStudentsData = {
  viewer: InstructorViewer
  metrics: InstructorMetric[]
  courses: Array<{
    id: string
    title: string
  }>
  rows: Array<{
    enrollmentId: string
    learnerId: string
    name: string
    email: string
    avatarUrl: string | null
    courseId: string
    courseTitle: string
    progressPercent: number
    lastActivity: string
    assessmentScore: number
    status: string
    enrolledAt: string
    completedLessons: number
    totalLessons: number
  }>
}

export type InstructorAssessmentsData = {
  viewer: InstructorViewer
  metrics: InstructorMetric[]
  assessments: Array<{
    id: string
    title: string
    courseTitle: string
    submissions: number
    avgScore: number
    passRate: number
  }>
}

type CourseRow = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: CourseStatus
  price: number | string | null
  created_at: string
  updated_at: string
}

type EnrollmentRow = {
  id: string
  user_id: string
  course_id: string
  status: string
  enrolled_at: string
}

type UserRow = {
  id: string
  name: string
  email: string
  role: Role
  avatar_url: string | null
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

type AssessmentRow = {
  id: string
  course_id: string
  title: string
}

type GradeRow = {
  id: string
  user_id: string
  assessment_id: string
  score: number | string
  passed: boolean
}

function asNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return 0
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  return items.reduce<Map<string, T[]>>((map, item) => {
    const groupKey = key(item)
    const next = map.get(groupKey) ?? []
    next.push(item)
    map.set(groupKey, next)
    return map
  }, new Map())
}

export async function getInstructorViewer() {
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

  if (!profile || profile.role !== "instructor") {
    redirect("/learner")
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatarUrl: profile.avatar_url
  } satisfies InstructorViewer
}

async function getInstructorCourseRows(instructorId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url, status, price, created_at, updated_at")
    .eq("instructor_id", instructorId)
    .order("updated_at", { ascending: false })

  return (data ?? []) as CourseRow[]
}

async function getUsersMap() {
  const admin = createAdminClient()
  const { data } = await admin.from("users").select("id, name, email, role, avatar_url")
  return new Map(((data ?? []) as UserRow[]).map((user) => [user.id, user]))
}

export async function getInstructorDashboardData() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const viewer = await getInstructorViewer()
  const courses = await getInstructorCourseRows(viewer.id)
  const courseIds = courses.map((course) => course.id)

  if (courseIds.length === 0) {
    return {
      viewer,
      metrics: [
        { label: "Total Courses", value: "0" },
        { label: "Total Students", value: "0" },
        { label: "Avg Completion Rate", value: "0.0%" },
        { label: "Total Assessments", value: "0" }
      ],
      recentCourses: [] as InstructorCourseCard[],
      activity: [] as InstructorActivityItem[]
    }
  }

  const [enrollmentsResult, assessmentsResult, lessonsResult] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, user_id, course_id, status, enrolled_at")
      .in("course_id", courseIds)
      .order("enrolled_at", { ascending: false }),
    admin.from("assessments").select("id, course_id, title").in("course_id", courseIds),
    supabase
      .from("lessons")
      .select("id, course_id, title, type, content, video_url, file_url, duration_seconds, sort_order")
      .in("course_id", courseIds)
  ])

  const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[]
  const assessments = (assessmentsResult.data ?? []) as AssessmentRow[]
  const lessons = (lessonsResult.data ?? []) as LessonRow[]
  const lessonIds = lessons.map((lesson) => lesson.id)
  const usersMap = await getUsersMap()

  const { data: progressData } =
    lessonIds.length > 0
      ? await supabase
          .from("progress")
          .select("id, enrollment_id, lesson_id, completed, completed_at")
          .in("lesson_id", lessonIds)
      : { data: [] }

  const progress = (progressData ?? []) as ProgressRow[]
  const courseLessons = groupBy(lessons, (lesson) => lesson.course_id)
  const courseMap = new Map(courses.map((course) => [course.id, course]))
  const uniqueStudents = new Set(enrollments.map((enrollment) => enrollment.user_id))
  const completedEnrollments = enrollments.filter((enrollment) => enrollment.status === "completed")

  const metrics: InstructorMetric[] = [
    { label: "Total Courses", value: `${courses.length}` },
    { label: "Total Students", value: `${uniqueStudents.size}` },
    {
      label: "Avg Completion Rate",
      value: formatPercent(enrollments.length === 0 ? 0 : (completedEnrollments.length / enrollments.length) * 100)
    },
    { label: "Total Assessments", value: `${assessments.length}` }
  ]

  const recentCourses: InstructorCourseCard[] = courses.slice(0, 4).map((course) => {
    const courseEnrollments = enrollments.filter((enrollment) => enrollment.course_id === course.id)
    const completedCount = courseEnrollments.filter((enrollment) => enrollment.status === "completed").length

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      status: course.status,
      price: asNumber(course.price),
      createdAt: course.created_at,
      studentCount: courseEnrollments.length,
      completionRate: courseEnrollments.length === 0 ? 0 : (completedCount / courseEnrollments.length) * 100,
      lessonCount: courseLessons.get(course.id)?.length ?? 0
    }
  })

  const activity: InstructorActivityItem[] = [
    ...enrollments.slice(0, 6).map((enrollment) => ({
      id: `enrollment-${enrollment.id}`,
      type: "enrollment" as const,
      learnerName: usersMap.get(enrollment.user_id)?.name ?? "Unknown learner",
      courseTitle: courseMap.get(enrollment.course_id)?.title ?? "Unknown course",
      detail: "joined the course",
      createdAt: enrollment.enrolled_at
    })),
    ...progress
      .filter((item) => item.completed && item.completed_at)
      .slice(0, 6)
      .map((item) => {
        const enrollment = enrollments.find((enrollmentRow) => enrollmentRow.id === item.enrollment_id)
        const lesson = lessons.find((lessonItem) => lessonItem.id === item.lesson_id)

        return {
          id: `progress-${item.id}`,
          type: "progress" as const,
          learnerName: enrollment ? usersMap.get(enrollment.user_id)?.name ?? "Unknown learner" : "Unknown learner",
          courseTitle: lesson ? courseMap.get(lesson.course_id)?.title ?? "Unknown course" : "Unknown course",
          detail: lesson ? `completed lesson "${lesson.title}"` : "completed a lesson",
          createdAt: item.completed_at ?? new Date().toISOString()
        }
      })
  ]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 8)

  return {
    viewer,
    metrics,
    recentCourses,
    activity
  }
}

export async function getInstructorCoursesData() {
  const supabase = await createClient()
  const viewer = await getInstructorViewer()
  const courses = await getInstructorCourseRows(viewer.id)
  const courseIds = courses.map((course) => course.id)

  const [enrollmentsResult, lessonsResult] =
    courseIds.length > 0
      ? await Promise.all([
          supabase.from("enrollments").select("id, user_id, course_id, status, enrolled_at").in("course_id", courseIds),
          supabase
            .from("lessons")
            .select("id, course_id, title, type, content, video_url, file_url, duration_seconds, sort_order")
            .in("course_id", courseIds)
        ])
      : [{ data: [] }, { data: [] }]

  const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[]
  const lessons = (lessonsResult.data ?? []) as LessonRow[]
  const courseLessons = groupBy(lessons, (lesson) => lesson.course_id)

  return {
    viewer,
    courses: courses.map((course) => {
      const courseEnrollments = enrollments.filter((enrollment) => enrollment.course_id === course.id)
      const completedCount = courseEnrollments.filter((enrollment) => enrollment.status === "completed").length

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnail_url,
        status: course.status,
        price: asNumber(course.price),
        createdAt: course.created_at,
        studentCount: courseEnrollments.length,
        completionRate: courseEnrollments.length === 0 ? 0 : (completedCount / courseEnrollments.length) * 100,
        lessonCount: courseLessons.get(course.id)?.length ?? 0
      } satisfies InstructorCourseCard
    })
  }
}

export async function getInstructorStudentsData(): Promise<InstructorStudentsData> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const viewer = await getInstructorViewer()
  const courses = await getInstructorCourseRows(viewer.id)
  const courseIds = courses.map((course) => course.id)

  if (courseIds.length === 0) {
    return {
      viewer,
      metrics: [
        { label: "Total Students", value: "0" },
        { label: "Active Enrollments", value: "0" },
        { label: "Avg Progress", value: "0.0%" },
        { label: "Needs Attention", value: "0" }
      ],
      courses: [],
      rows: []
    }
  }

  const [enrollmentsResult, lessonsResult, assessmentsResult, gradesResult] = await Promise.all([
    supabase.from("enrollments").select("id, user_id, course_id, status, enrolled_at").in("course_id", courseIds),
    supabase
      .from("lessons")
      .select("id, course_id, title, type, content, video_url, file_url, duration_seconds, sort_order")
      .in("course_id", courseIds),
    admin.from("assessments").select("id, course_id, title").in("course_id", courseIds),
    admin.from("grades").select("id, user_id, assessment_id, score, passed")
  ])

  const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[]
  const lessons = (lessonsResult.data ?? []) as LessonRow[]
  const assessments = (assessmentsResult.data ?? []) as AssessmentRow[]
  const grades = (gradesResult.data ?? []) as GradeRow[]
  const enrollmentIds = enrollments.map((enrollment) => enrollment.id)

  const { data: progressData } =
    enrollmentIds.length > 0
      ? await supabase
          .from("progress")
          .select("id, enrollment_id, lesson_id, completed, completed_at")
          .in("enrollment_id", enrollmentIds)
      : { data: [] }

  const progress = (progressData ?? []) as ProgressRow[]
  const lessonsByCourse = groupBy(lessons, (lesson) => lesson.course_id)
  const usersMap = await getUsersMap()
  const courseMap = new Map(courses.map((course) => [course.id, course]))
  const assessmentCourseMap = new Map(assessments.map((assessment) => [assessment.id, assessment.course_id]))

  const rows = enrollments
    .map((enrollment) => {
      const user = usersMap.get(enrollment.user_id)
      const course = courseMap.get(enrollment.course_id)
      const courseLessons = lessonsByCourse.get(enrollment.course_id) ?? []
      const completedProgress = progress.filter(
        (item) => item.enrollment_id === enrollment.id && item.completed
      )
      const completedLessons = completedProgress.length
      const progressPercent =
        courseLessons.length === 0
          ? enrollment.status === "completed"
            ? 100
            : 0
          : (completedLessons / courseLessons.length) * 100
      const lastActivity =
        [...completedProgress.map((item) => item.completed_at).filter(Boolean), enrollment.enrolled_at]
          .sort((left, right) => new Date(right as string).getTime() - new Date(left as string).getTime())[0] ?? enrollment.enrolled_at
      const assessmentIds = assessments
        .filter((assessment) => assessment.course_id === enrollment.course_id)
        .map((assessment) => assessment.id)
      const assessmentGrades = grades.filter(
        (grade) =>
          grade.user_id === enrollment.user_id &&
          assessmentIds.includes(grade.assessment_id) &&
          assessmentCourseMap.get(grade.assessment_id) === enrollment.course_id
      )
      const assessmentScore =
        assessmentGrades.length === 0
          ? 0
          : assessmentGrades.reduce((sum, grade) => sum + asNumber(grade.score), 0) / assessmentGrades.length

      return {
        enrollmentId: enrollment.id,
        learnerId: enrollment.user_id,
        name: user?.name ?? "Unknown learner",
        email: user?.email ?? "",
        avatarUrl: user?.avatar_url ?? null,
        courseId: enrollment.course_id,
        courseTitle: course?.title ?? "Unknown course",
        progressPercent,
        lastActivity: lastActivity as string,
        assessmentScore,
        status: enrollment.status,
        enrolledAt: enrollment.enrolled_at,
        completedLessons,
        totalLessons: courseLessons.length
      }
    })
    .sort((left, right) => new Date(right.lastActivity).getTime() - new Date(left.lastActivity).getTime())

  const uniqueStudents = new Set(rows.map((row) => row.learnerId)).size
  const needsAttention = rows.filter((row) => row.progressPercent < 25 && row.status !== "completed").length
  const avgProgress =
    rows.length === 0 ? 0 : rows.reduce((sum, row) => sum + row.progressPercent, 0) / rows.length

  return {
    viewer,
    metrics: [
      { label: "Total Students", value: `${uniqueStudents}` },
      { label: "Active Enrollments", value: `${enrollments.length}` },
      { label: "Avg Progress", value: formatPercent(avgProgress) },
      { label: "Needs Attention", value: `${needsAttention}` }
    ],
    courses: courses.map((course) => ({
      id: course.id,
      title: course.title
    })),
    rows
  }
}

export async function getInstructorAssessmentsData(): Promise<InstructorAssessmentsData> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const viewer = await getInstructorViewer()
  const courses = await getInstructorCourseRows(viewer.id)
  const courseIds = courses.map((course) => course.id)

  if (courseIds.length === 0) {
    return {
      viewer,
      metrics: [
        { label: "Assessments", value: "0" },
        { label: "Submissions", value: "0" },
        { label: "Avg Score", value: "0.0" },
        { label: "Pass Rate", value: "0.0%" }
      ],
      assessments: []
    }
  }

  const { data: assessmentData } = await admin
    .from("assessments")
    .select("id, course_id, title")
    .in("course_id", courseIds)

  const assessments = (assessmentData ?? []) as AssessmentRow[]
  const assessmentIds = assessments.map((assessment) => assessment.id)
  const courseMap = new Map(courses.map((course) => [course.id, course]))

  const { data: gradesData } =
    assessmentIds.length > 0
      ? await admin.from("grades").select("id, user_id, assessment_id, score, passed").in("assessment_id", assessmentIds)
      : { data: [] }

  const grades = (gradesData ?? []) as GradeRow[]
  const assessmentsList = assessments
    .map((assessment) => {
      const assessmentGrades = grades.filter((grade) => grade.assessment_id === assessment.id)
      const avgScore =
        assessmentGrades.length === 0
          ? 0
          : assessmentGrades.reduce((sum, grade) => sum + asNumber(grade.score), 0) / assessmentGrades.length
      const passRate =
        assessmentGrades.length === 0
          ? 0
          : (assessmentGrades.filter((grade) => grade.passed).length / assessmentGrades.length) * 100

      return {
        id: assessment.id,
        title: assessment.title,
        courseTitle: courseMap.get(assessment.course_id)?.title ?? "Unknown course",
        submissions: assessmentGrades.length,
        avgScore,
        passRate
      }
    })
    .sort((left, right) => right.submissions - left.submissions)

  const totalSubmissions = assessmentsList.reduce((sum, assessment) => sum + assessment.submissions, 0)
  const avgScore =
    totalSubmissions === 0
      ? 0
      : assessmentsList.reduce((sum, assessment) => sum + assessment.avgScore * assessment.submissions, 0) / totalSubmissions
  const passRate =
    totalSubmissions === 0
      ? 0
      : assessmentsList.reduce((sum, assessment) => sum + assessment.passRate * assessment.submissions, 0) / totalSubmissions

  return {
    viewer,
    metrics: [
      { label: "Assessments", value: `${assessmentsList.length}` },
      { label: "Submissions", value: `${totalSubmissions}` },
      { label: "Avg Score", value: avgScore.toFixed(1) },
      { label: "Pass Rate", value: formatPercent(passRate) }
    ],
    assessments: assessmentsList
  }
}

export async function getInstructorCourseFormData(courseId: string) {
  const supabase = await createClient()
  const viewer = await getInstructorViewer()

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url, status, price, instructor_id")
    .eq("id", courseId)
    .eq("instructor_id", viewer.id)
    .maybeSingle()

  if (!course) {
    redirect("/instructor/courses")
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, type, content, video_url, file_url, duration_seconds, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })

  return {
    id: course.id,
    title: course.title,
    description: course.description ?? "",
    thumbnailUrl: course.thumbnail_url ?? "",
    price: asNumber(course.price),
    status: course.status,
    lessons: ((lessons ?? []) as Array<Omit<LessonRow, "course_id">>).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      content: lesson.content ?? "",
      videoUrl: lesson.video_url ?? "",
      fileUrl: lesson.file_url ?? "",
      durationSeconds: lesson.duration_seconds ?? 0,
      sortOrder: lesson.sort_order
    }))
  } satisfies CourseFormData
}

export async function getInstructorCourseDetail(courseId: string): Promise<InstructorCourseDetail> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const viewer = await getInstructorViewer()

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url, status, price, created_at, updated_at, instructor_id")
    .eq("id", courseId)
    .eq("instructor_id", viewer.id)
    .maybeSingle()

  if (!course) {
    redirect("/instructor/courses")
  }

  const [lessonsResult, enrollmentsResult, assessmentsResult] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, course_id, title, type, content, video_url, file_url, duration_seconds, sort_order")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true }),
    supabase.from("enrollments").select("id, user_id, course_id, status, enrolled_at").eq("course_id", courseId),
    admin.from("assessments").select("id, course_id, title").eq("course_id", courseId)
  ])

  const lessons = (lessonsResult.data ?? []) as LessonRow[]
  const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[]
  const assessments = (assessmentsResult.data ?? []) as AssessmentRow[]
  const usersMap = await getUsersMap()

  const enrollmentIds = enrollments.map((enrollment) => enrollment.id)
  const lessonIds = lessons.map((lesson) => lesson.id)
  const assessmentIds = assessments.map((assessment) => assessment.id)

  const [progressResult, gradesResult] = await Promise.all([
    enrollmentIds.length > 0 && lessonIds.length > 0
      ? supabase
          .from("progress")
          .select("id, enrollment_id, lesson_id, completed, completed_at")
          .in("enrollment_id", enrollmentIds)
          .in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] }),
    assessmentIds.length > 0
      ? admin.from("grades").select("id, user_id, assessment_id, score, passed").in("assessment_id", assessmentIds)
      : Promise.resolve({ data: [] })
  ])

  const progress = (progressResult.data ?? []) as ProgressRow[]
  const grades = (gradesResult.data ?? []) as GradeRow[]

  const lessonStats = lessons.map((lesson) => {
    const lessonProgress = progress.filter((item) => item.lesson_id === lesson.id && item.completed)

    return {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      content: lesson.content,
      videoUrl: lesson.video_url,
      fileUrl: lesson.file_url,
      durationSeconds: lesson.duration_seconds,
      sortOrder: lesson.sort_order,
      completions: lessonProgress.length,
      completionRate: enrollments.length === 0 ? 0 : (lessonProgress.length / enrollments.length) * 100
    }
  })

  const students = enrollments.map((enrollment) => {
    const user = usersMap.get(enrollment.user_id)
    const completedLessons = progress.filter(
      (item) => item.enrollment_id === enrollment.id && item.completed
    ).length
    const progressPercent = lessons.length === 0 ? 0 : (completedLessons / lessons.length) * 100

    return {
      id: enrollment.user_id,
      name: user?.name ?? "Unknown learner",
      email: user?.email ?? "",
      progressPercent,
      status: enrollment.status
    }
  })

  const assessmentStats = assessments.map((assessment) => {
    const assessmentGrades = grades.filter((grade) => grade.assessment_id === assessment.id)
    const avgScore =
      assessmentGrades.length === 0
        ? 0
        : assessmentGrades.reduce((sum, grade) => sum + asNumber(grade.score), 0) / assessmentGrades.length
    const passRate =
      assessmentGrades.length === 0
        ? 0
        : (assessmentGrades.filter((grade) => grade.passed).length / assessmentGrades.length) * 100

    return {
      id: assessment.id,
      title: assessment.title,
      submissions: assessmentGrades.length,
      avgScore,
      passRate
    }
  })

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnailUrl: course.thumbnail_url,
    status: course.status,
    price: asNumber(course.price),
    createdAt: course.created_at,
    updatedAt: course.updated_at,
    studentCount: enrollments.length,
    completionRate:
      enrollments.length === 0
        ? 0
        : (enrollments.filter((enrollment) => enrollment.status === "completed").length / enrollments.length) * 100,
    lessons: lessonStats,
    students,
    assessments: assessmentStats
  }
}
