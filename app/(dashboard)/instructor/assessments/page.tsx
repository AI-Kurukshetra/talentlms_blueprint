import { AssessmentsList } from "@/components/instructor/assessments-list"
import { getInstructorAssessmentListData } from "@/lib/assessment/data"

export default async function InstructorAssessmentsPage() {
  const data = await getInstructorAssessmentListData()

  return <AssessmentsList courses={data.courses} assessments={data.assessments} />
}
