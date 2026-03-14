import { DashboardPage, type DashboardSection } from "@/components/shared/dashboard-page"

const sections: DashboardSection[] = [
  {
    href: "/admin/users",
    title: "Users",
    description: "Manage learners, instructors, admins, and group assignments."
  },
  {
    href: "/admin/courses",
    title: "Courses",
    description: "Review course catalog status, instructor ownership, and publishing controls."
  },
  {
    href: "/admin/analytics",
    title: "Analytics",
    description: "Track platform engagement, completion rates, and organization-wide performance."
  },
  {
    href: "/admin/settings",
    title: "Settings",
    description: "Configure tenant branding, permissions, auth providers, and operational defaults."
  }
]

export default function AdminDashboardPage() {
  return (
    <DashboardPage
      role="Admin"
      summary="The admin area is scaffolded for platform oversight, reporting, and tenant-wide configuration."
      sections={sections}
    />
  )
}
