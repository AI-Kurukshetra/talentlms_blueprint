import { CourseBuilderForm } from "@/components/instructor/course-builder-form"
import { getInstructorCourseFormData } from "@/lib/instructor/data"

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const course = await getInstructorCourseFormData(params.id)
  return <CourseBuilderForm mode="edit" initialData={course} />
}
