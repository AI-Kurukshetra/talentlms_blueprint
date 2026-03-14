import { AdminAnalyticsDashboard } from "@/components/admin/admin-analytics-dashboard"
import { getAdminAdvancedAnalyticsData } from "@/lib/admin/advanced-analytics"

export default async function AdminAnalyticsPage() {
  const data = await getAdminAdvancedAnalyticsData()

  return <AdminAnalyticsDashboard data={data} />
}
