import { ModulePlaceholder } from "@/components/shared/module-placeholder"

export default function AdminCoursesPage() {
  return (
    <ModulePlaceholder
      backHref="/admin"
      eyebrow="Admin"
      title="Course governance"
      description="Review publishing state, instructor ownership, and content readiness across your catalog."
    />
  )
}
