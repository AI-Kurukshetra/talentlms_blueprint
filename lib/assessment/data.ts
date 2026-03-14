import "server-only"

import { redirect } from "next/navigation"

import { normalizeQuestionOptions, type AssessmentQuestion } from "@/lib/assessment/schema"
import { createClient } from "@/lib/supabase/server"

type Role = "admin" | "instructor" | "learner"

type UserRow = {
  id: string
  name: string
  email: string
  role: Role
  avatar_url: string | null
}

type CourseRow = {
  id: string
  title: string
  instructor_id: string | null
  thumbnail_url: string | null
}

type AssessmentRow = {
  id: string
  course_id: string
  title: string
  time_limit_minutes: number | null
  passing_score: number | null
  created_at: string
}

type QuestionRow = {
  id: string
  assessment_id: string
  type: AssessmentQuestion["type"]
  text: string
  options: unknown
  answer: string
  points: number | null
}

type GradeRow = {
  id: string
  user_id: string
  assessment_id: string
  score: number | string
  passed: boolean
  submitted_at: string
}

export type InstructorCourseOption = {
  id: string
  title: string
}

export type InstructorAssessmentCard = {
  id: string
  title: string
  courseId: string
  courseTitle: string
  questionCount: number
  passingScore: number
  totalAttempts: number
  avgScore: number
  timeLimitMinutes: number | null
  createdAt: string
}

export type InstructorAssessmentFormData = {
  id?: string
  title: string
  courseId: string
  timeLimitMinutes: number | null
  passingScore: number
  questions: AssessmentQuestion[]
}

export type InstructorAssessmentResultsData = {
  id: string
  title: string
  courseTitle: string
  passingScore: number
  totalAttempts: number
  avgScore: number
  passRate: number
  attempts: Array<{
    id: string
    learnerName: string
    learnerEmail: string
    score: number
    passed: boolean
    submittedAt: string
  }>
  distribution: Array<{
    range: string
    count: number
  }>
}

export type LearnerAssessmentQuestion = AssessmentQuestion

export type LearnerAssessmentData = {
  viewer: {
    id: string
    name: string
    email: string
  }
  assessment: {
    id: string
    title: string
    courseId: string
    courseTitle: string
    passingScore: number
    timeLimitMinutes: number | null
    questions: LearnerAssessmentQuestion[]
  }
}

function asNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return 0
}

async function getCurrentProfile(requiredRole: Role) {
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

  if (!profile || profile.role !== requiredRole) {
    redirect(requiredRole === "instructor" ? "/learner" : "/login")
  }

  return profile as UserRow
}

async function getInstructorCourses(instructorId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("courses")
    .select("id, title, instructor_id, thumbnail_url")
    .eq("instructor_id", instructorId)
    .order("title", { ascending: true })

  return (data ?? []) as CourseRow[]
}

function toAssessmentQuestion(row: QuestionRow): AssessmentQuestion {
  const { choices, order } = normalizeQuestionOptions(row.options as never)

  return {
    id: row.id,
    type: row.type,
    text: row.text,
    options: choices,
    answer: row.answer,
    points: row.points ?? 1,
    sortOrder: order
  }
}

export async function getInstructorAssessmentListData() {
  const supabase = await createClient()
  const viewer = await getCurrentProfile("instructor")
  const courses = await getInstructorCourses(viewer.id)
  const courseIds = courses.map((course) => course.id)

  if (courseIds.length === 0) {
    return {
      viewer,
      courses: [] as InstructorCourseOption[],
      assessments: [] as InstructorAssessmentCard[]
    }
  }

  const [assessmentsResult, questionsResult, gradesResult] = await Promise.all([
    supabase
      .from("assessments")
      .select("id, course_id, title, time_limit_minutes, passing_score, created_at")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false }),
    supabase.from("questions").select("id, assessment_id, type, text, options, answer, points"),
    supabase.from("grades").select("id, user_id, assessment_id, score, passed, submitted_at")
  ])

  const assessments = (assessmentsResult.data ?? []) as AssessmentRow[]
  const questions = (questionsResult.data ?? []) as QuestionRow[]
  const grades = (gradesResult.data ?? []) as GradeRow[]
  const courseMap = new Map(courses.map((course) => [course.id, course.title]))

  return {
    viewer,
    courses: courses.map((course) => ({
      id: course.id,
      title: course.title
    })),
    assessments: assessments.map((assessment) => {
      const assessmentQuestions = questions.filter((question) => question.assessment_id === assessment.id)
      const assessmentGrades = grades.filter((grade) => grade.assessment_id === assessment.id)
      const avgScore =
        assessmentGrades.length === 0
          ? 0
          : assessmentGrades.reduce((sum, grade) => sum + asNumber(grade.score), 0) / assessmentGrades.length

      return {
        id: assessment.id,
        title: assessment.title,
        courseId: assessment.course_id,
        courseTitle: courseMap.get(assessment.course_id) ?? "Unknown course",
        questionCount: assessmentQuestions.length,
        passingScore: assessment.passing_score ?? 70,
        totalAttempts: assessmentGrades.length,
        avgScore,
        timeLimitMinutes: assessment.time_limit_minutes,
        createdAt: assessment.created_at
      } satisfies InstructorAssessmentCard
    })
  }
}

export async function getInstructorAssessmentFormOptions() {
  const viewer = await getCurrentProfile("instructor")
  const courses = await getInstructorCourses(viewer.id)

  return {
    viewer,
    courses: courses.map((course) => ({
      id: course.id,
      title: course.title
    }))
  }
}

export async function getInstructorAssessmentFormData(assessmentId: string) {
  const supabase = await createClient()
  const viewer = await getCurrentProfile("instructor")
  const courses = await getInstructorCourses(viewer.id)

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, course_id, title, time_limit_minutes, passing_score")
    .eq("id", assessmentId)
    .maybeSingle()

  if (!assessment) {
    redirect("/instructor/assessments")
  }

  const ownedCourse = courses.find((course) => course.id === assessment.course_id)
  if (!ownedCourse) {
    redirect("/instructor/assessments")
  }

  const { data: questionsData } = await supabase
    .from("questions")
    .select("id, assessment_id, type, text, options, answer, points")
    .eq("assessment_id", assessmentId)

  const questions = ((questionsData ?? []) as QuestionRow[])
    .map(toAssessmentQuestion)
    .sort((left, right) => left.sortOrder - right.sortOrder)

  return {
    viewer,
    courses: courses.map((course) => ({
      id: course.id,
      title: course.title
    })),
    assessment: {
      id: assessment.id,
      title: assessment.title,
      courseId: assessment.course_id,
      timeLimitMinutes: assessment.time_limit_minutes,
      passingScore: assessment.passing_score ?? 70,
      questions
    } satisfies InstructorAssessmentFormData
  }
}

export async function getInstructorAssessmentResultsData(
  assessmentId: string
): Promise<InstructorAssessmentResultsData> {
  const supabase = await createClient()
  const viewer = await getCurrentProfile("instructor")
  const courses = await getInstructorCourses(viewer.id)
  const courseMap = new Map(courses.map((course) => [course.id, course.title]))

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, course_id, title, passing_score")
    .eq("id", assessmentId)
    .maybeSingle()

  if (!assessment || !courseMap.has(assessment.course_id)) {
    redirect("/instructor/assessments")
  }

  const [gradesResult, usersResult] = await Promise.all([
    supabase
      .from("grades")
      .select("id, user_id, assessment_id, score, passed, submitted_at")
      .eq("assessment_id", assessmentId)
      .order("submitted_at", { ascending: false }),
    supabase.from("users").select("id, name, email, role, avatar_url")
  ])

  const grades = (gradesResult.data ?? []) as GradeRow[]
  const users = (usersResult.data ?? []) as UserRow[]
  const userMap = new Map(users.map((user) => [user.id, user]))

  const attempts = grades.map((grade) => ({
    id: grade.id,
    learnerName: userMap.get(grade.user_id)?.name ?? "Unknown learner",
    learnerEmail: userMap.get(grade.user_id)?.email ?? "",
    score: asNumber(grade.score),
    passed: grade.passed,
    submittedAt: grade.submitted_at
  }))

  const avgScore =
    attempts.length === 0
      ? 0
      : attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length
  const passRate =
    attempts.length === 0
      ? 0
      : (attempts.filter((attempt) => attempt.passed).length / attempts.length) * 100

  const buckets = [
    { range: "0-20", min: 0, max: 20 },
    { range: "21-40", min: 21, max: 40 },
    { range: "41-60", min: 41, max: 60 },
    { range: "61-80", min: 61, max: 80 },
    { range: "81-100", min: 81, max: 100 }
  ]

  return {
    id: assessment.id,
    title: assessment.title,
    courseTitle: courseMap.get(assessment.course_id) ?? "Unknown course",
    passingScore: assessment.passing_score ?? 70,
    totalAttempts: attempts.length,
    avgScore,
    passRate,
    attempts,
    distribution: buckets.map((bucket) => ({
      range: bucket.range,
      count: attempts.filter((attempt) => attempt.score >= bucket.min && attempt.score <= bucket.max).length
    }))
  }
}

export async function getLearnerAssessmentData(assessmentId: string): Promise<LearnerAssessmentData> {
  const supabase = await createClient()
  const viewer = await getCurrentProfile("learner")

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, course_id, title, time_limit_minutes, passing_score")
    .eq("id", assessmentId)
    .maybeSingle()

  if (!assessment) {
    redirect("/learner")
  }

  const [courseResult, questionsResult, enrollmentResult] = await Promise.all([
    supabase.from("courses").select("id, title, status").eq("id", assessment.course_id).maybeSingle(),
    supabase
      .from("questions")
      .select("id, assessment_id, type, text, options, answer, points")
      .eq("assessment_id", assessmentId),
    supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", assessment.course_id)
      .eq("user_id", viewer.id)
      .maybeSingle()
  ])

  if (!courseResult.data || !enrollmentResult.data) {
    redirect("/learner")
  }

  const questions = ((questionsResult.data ?? []) as QuestionRow[])
    .map(toAssessmentQuestion)
    .sort((left, right) => left.sortOrder - right.sortOrder)

  return {
    viewer: {
      id: viewer.id,
      name: viewer.name,
      email: viewer.email
    },
    assessment: {
      id: assessment.id,
      title: assessment.title,
      courseId: assessment.course_id,
      courseTitle: courseResult.data.title,
      passingScore: assessment.passing_score ?? 70,
      timeLimitMinutes: assessment.time_limit_minutes,
      questions
    }
  }
}
