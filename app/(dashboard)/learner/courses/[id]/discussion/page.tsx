import { DiscussionForum } from "@/components/shared/discussion-forum"
import { getLearnerCoursePlayerData } from "@/lib/learner/data"

export default async function LearnerCourseDiscussionPage({ params }: { params: { id: string } }) {
  const data = await getLearnerCoursePlayerData(params.id)

  return (
    <DiscussionForum
      courseId={params.id}
      title={`${data.course.title} discussion`}
      description="Join the learner discussion, ask for help, and reply to classmates in real time."
    />
  )
}
