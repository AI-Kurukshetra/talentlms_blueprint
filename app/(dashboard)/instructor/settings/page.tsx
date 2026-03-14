import { InstructorSettingsForm } from "@/components/instructor/instructor-settings-form"
import { getInstructorViewer } from "@/lib/instructor/data"

export default async function InstructorSettingsPage() {
  const viewer = await getInstructorViewer()

  return (
    <InstructorSettingsForm
      instructorName={viewer.name}
      instructorEmail={viewer.email}
    />
  )
}
