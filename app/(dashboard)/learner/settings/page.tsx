import { LearnerSettingsForm } from "@/components/learner/learner-settings-form"
import { getLearnerViewer } from "@/lib/learner/data"

export default async function LearnerSettingsPage() {
  const viewer = await getLearnerViewer()

  return (
    <LearnerSettingsForm
      name={viewer.name}
      email={viewer.email}
      badges={viewer.badges}
    />
  )
}
