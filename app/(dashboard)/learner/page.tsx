import { DashboardPage, type DashboardSection } from "@/components/shared/dashboard-page"

const sections: DashboardSection[] = [
  {
    href: "/learner/my-courses",
    title: "My courses",
    description: "Continue assigned learning, enrollments, and featured onboarding content."
  },
  {
    href: "/learner/progress",
    title: "Progress",
    description: "View lesson completion, points, streaks, and assessment outcomes."
  },
  {
    href: "/learner/certificates",
    title: "Certificates",
    description: "Access earned certificates and completion records."
  }
]

export default function LearnerDashboardPage() {
  return (
    <DashboardPage
      role="Learner"
      summary="The learner dashboard is scaffolded for enrollments, progress visibility, and certificate access."
      sections={sections}
    />
  )
}
