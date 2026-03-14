import { MyCoursesGrid } from "@/components/learner/my-courses-grid"
import { getLearnerMyCoursesData } from "@/lib/learner/data"

export default async function LearnerCoursesPage() {
  const data = await getLearnerMyCoursesData()

  return <MyCoursesGrid courses={data.courses} />
}
