import { RevenueDashboard } from "@/components/instructor/revenue-dashboard"
import { getInstructorRevenueData } from "@/lib/instructor/insights"

export default async function InstructorRevenuePage() {
  const data = await getInstructorRevenueData()

  return <RevenueDashboard data={data} />
}
