import { LearningPathsManager } from "@/components/admin/learning-paths-manager"
import { getAdminLearningPathsData } from "@/lib/learning-paths-data"

export default async function AdminLearningPathsPage() {
  const data = await getAdminLearningPathsData()

  return <LearningPathsManager data={data} />
}
