import { AssessmentBuilderForm } from "@/components/instructor/assessment-builder-form"
import { getInstructorAssessmentFormOptions } from "@/lib/assessment/data"

export default async function NewAssessmentPage() {
  const data = await getInstructorAssessmentFormOptions()

  return <AssessmentBuilderForm mode="create" courses={data.courses} />
}
