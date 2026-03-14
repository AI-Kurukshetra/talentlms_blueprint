import { ModulePlaceholder } from "@/components/shared/module-placeholder"

export default function AdminAnalyticsPage() {
  return (
    <ModulePlaceholder
      backHref="/admin"
      eyebrow="Admin"
      title="Analytics"
      description="Track engagement, completion, and organization-level performance with role-aware reporting."
    />
  )
}
