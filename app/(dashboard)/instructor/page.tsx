import { DashboardPage, type DashboardSection } from "@/components/shared/dashboard-page"

const sections: DashboardSection[] = [
  {
    href: "/instructor/courses",
    title: "Courses",
    description: "Build lessons, manage drafts, and prepare content for publishing."
  },
  {
    href: "/instructor/assessments",
    title: "Assessments",
    description: "Create quizzes, grading rules, and course completion checks."
  },
  {
    href: "/instructor/students",
    title: "Students",
    description: "Monitor progress, completions, and intervention opportunities."
  }
]

export default function InstructorDashboardPage() {
  return (
    <DashboardPage
      role="Instructor"
      summary="The instructor workspace is structured for course authoring, assessment delivery, and learner tracking."
      sections={sections}
    />
  )
}
