import { CoursesGrid } from "@/components/instructor/courses-grid"
import { getInstructorCoursesData } from "@/lib/instructor/data"

export default async function InstructorCoursesPage() {
  const data = await getInstructorCoursesData()
  return <CoursesGrid courses={data.courses} />
}
