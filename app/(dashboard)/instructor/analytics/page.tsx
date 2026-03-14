import { InstructorAnalyticsDashboard } from "@/components/instructor/instructor-analytics-dashboard"
import { getInstructorAnalyticsData } from "@/lib/instructor/insights"

export default async function InstructorAnalyticsPage() {
  const data = await getInstructorAnalyticsData()

  return <InstructorAnalyticsDashboard data={data} />
}
