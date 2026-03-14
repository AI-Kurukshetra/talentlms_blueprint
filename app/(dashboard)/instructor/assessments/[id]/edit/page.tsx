import { AssessmentBuilderForm } from "@/components/instructor/assessment-builder-form"
import { getInstructorAssessmentFormData } from "@/lib/assessment/data"

export default async function EditAssessmentPage({ params }: { params: { id: string } }) {
  const data = await getInstructorAssessmentFormData(params.id)

  return (
    <AssessmentBuilderForm
      mode="edit"
      courses={data.courses}
      initialData={data.assessment}
    />
  )
}
