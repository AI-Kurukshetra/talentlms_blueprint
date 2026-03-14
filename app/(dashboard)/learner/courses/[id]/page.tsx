import { CoursePlayer } from "@/components/learner/course-player"
import { getLearnerCoursePlayerData } from "@/lib/learner/data"

export default async function LearnerCoursePage({ params }: { params: { id: string } }) {
  const data = await getLearnerCoursePlayerData(params.id)

  return <CoursePlayer data={data} />
}
