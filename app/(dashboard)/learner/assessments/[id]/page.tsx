import { LearnerAssessmentPlayer } from "@/components/learner/assessment-player"
import { getLearnerAssessmentData } from "@/lib/assessment/data"

export default async function LearnerAssessmentPage({ params }: { params: { id: string } }) {
  const data = await getLearnerAssessmentData(params.id)

  return <LearnerAssessmentPlayer data={data} />
}
