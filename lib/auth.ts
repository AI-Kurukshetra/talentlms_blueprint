import type { Route } from "next"

export type UserRole = "admin" | "instructor" | "learner"

type NavItem = {
  href: Route
  label: string
}

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  instructor: "Instructor",
  learner: "Learner"
}

export const dashboardRoutes: Record<UserRole, Route> = {
  admin: "/admin",
  instructor: "/instructor",
  learner: "/learner"
}

export const dashboardNavigation: Record<UserRole, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/courses", label: "Courses" },
    { href: "/admin/groups", label: "Groups" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/notifications", label: "Notifications" },
    { href: "/admin/settings", label: "Settings" }
  ],
  instructor: [
    { href: "/instructor", label: "Overview" },
    { href: "/instructor/courses", label: "Courses" },
    { href: "/instructor/assessments", label: "Assessments" },
    { href: "/instructor/students", label: "Students" }
  ],
  learner: [
    { href: "/learner", label: "Overview" },
    { href: "/learner/my-courses", label: "My courses" },
    { href: "/learner/progress", label: "Progress" },
    { href: "/learner/certificates", label: "Certificates" }
  ]
}

export function normalizeRole(role: string | null | undefined): UserRole {
  if (role === "admin" || role === "instructor" || role === "learner") {
    return role
  }

  return "learner"
}

export function getDashboardForRole(role: UserRole): Route {
  return dashboardRoutes[role]
}

export function getRoleFromPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/instructor")) return "instructor"
  if (pathname.startsWith("/learner")) return "learner"
  return null
}
