import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { parseLearningPathDescription } from "@/lib/learning-paths"

type Role = "admin" | "instructor" | "learner"

type LearningPathRow = {
  id: string
  title: string
  description: string | null
  created_at: string
}

type LearningPathCourseRow = {
  learning_path_id: string
  course_id: string
  sort_order: number
}

type CourseRow = {
  id: string
  title: string
  thumbnail_url: string | null
}

type GroupRow = {
  id: string
  name: string
}

type EnrollmentRow = {
  course_id: string
  status: "in_progress" | "completed" | "dropped"
}

type UserProfileRow = {
  id: string
  role: Role
  group_id: string | null
}

async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, group_id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("Unauthorized")
  }

  return profile as UserProfileRow
}

export async function getAdminLearningPathsData() {
  const profile = await getCurrentProfile()
  if (profile.role !== "admin") {
    throw new Error("Unauthorized")
  }

  const admin = createAdminClient()
  const [pathsResult, pathCoursesResult, coursesResult, groupsResult] = await Promise.all([
    admin.from("learning_paths").select("id, title, description, created_at").order("created_at", { ascending: false }),
    admin.from("learning_path_courses").select("learning_path_id, course_id, sort_order"),
    admin.from("courses").select("id, title, thumbnail_url").order("title"),
    admin.from("groups").select("id, name").order("name")
  ])

  const paths = (pathsResult.data ?? []) as LearningPathRow[]
  const pathCourses = (pathCoursesResult.data ?? []) as LearningPathCourseRow[]
  const courses = (coursesResult.data ?? []) as CourseRow[]
  const groups = (groupsResult.data ?? []) as GroupRow[]
  const coursesMap = new Map(courses.map((course) => [course.id, course]))
  const groupMap = new Map(groups.map((group) => [group.id, group.name]))

  return {
    groups,
    courses: courses.map((course) => ({
      id: course.id,
      title: course.title
    })),
    learningPaths: paths.map((path) => {
      const meta = parseLearningPathDescription(path.description)
      const orderedCourses = pathCourses
        .filter((item) => item.learning_path_id === path.id)
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((item) => ({
          id: item.course_id,
          title: coursesMap.get(item.course_id)?.title ?? "Unknown course"
        }))

      return {
        id: path.id,
        title: path.title,
        description: meta.text,
        groupId: meta.groupId,
        groupName: meta.groupId ? groupMap.get(meta.groupId) ?? "Unknown group" : "Unassigned",
        createdAt: path.created_at,
        courses: orderedCourses
      }
    })
  }
}

export async function getLearnerLearningPathsData() {
  const profile = await getCurrentProfile()
  if (profile.role !== "learner") {
    throw new Error("Unauthorized")
  }

  const admin = createAdminClient()
  const [pathsResult, pathCoursesResult, coursesResult, enrollmentsResult] = await Promise.all([
    admin.from("learning_paths").select("id, title, description, created_at").order("created_at", { ascending: false }),
    admin.from("learning_path_courses").select("learning_path_id, course_id, sort_order"),
    admin.from("courses").select("id, title, thumbnail_url"),
    admin.from("enrollments").select("course_id, status").eq("user_id", profile.id)
  ])

  const paths = (pathsResult.data ?? []) as LearningPathRow[]
  const pathCourses = (pathCoursesResult.data ?? []) as LearningPathCourseRow[]
  const courses = new Map(((coursesResult.data ?? []) as CourseRow[]).map((course) => [course.id, course]))
  const enrollments = new Map(((enrollmentsResult.data ?? []) as EnrollmentRow[]).map((enrollment) => [enrollment.course_id, enrollment]))

  const assignedPaths = paths
    .map((path) => {
      const meta = parseLearningPathDescription(path.description)
      if (meta.groupId && meta.groupId !== profile.group_id) {
        return null
      }

      const orderedCourses = pathCourses
        .filter((item) => item.learning_path_id === path.id)
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((item, index, allItems) => {
          const enrollment = enrollments.get(item.course_id)
          const previousCompleted =
            index === 0
              ? true
              : allItems.slice(0, index).every((previousItem) => enrollments.get(previousItem.course_id)?.status === "completed")

          return {
            id: item.course_id,
            title: courses.get(item.course_id)?.title ?? "Unknown course",
            thumbnailUrl: courses.get(item.course_id)?.thumbnail_url ?? null,
            status: enrollment?.status ?? null,
            locked: !previousCompleted,
            completed: enrollment?.status === "completed"
          }
        })

      const completedCount = orderedCourses.filter((course) => course.completed).length

      return {
        id: path.id,
        title: path.title,
        description: meta.text,
        progressPercent: orderedCourses.length === 0 ? 0 : Number(((completedCount / orderedCourses.length) * 100).toFixed(1)),
        courses: orderedCourses
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  return {
    learningPaths: assignedPaths
  }
}
