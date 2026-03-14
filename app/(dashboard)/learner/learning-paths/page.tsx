import { LearningPathsBoard } from "@/components/learner/learning-paths-board"
import { getLearnerLearningPathsData } from "@/lib/learning-paths-data"

export default async function LearnerLearningPathsPage() {
  const data = await getLearnerLearningPathsData()

  return <LearningPathsBoard data={data} />
}
