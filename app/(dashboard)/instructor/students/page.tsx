import { StudentsTable } from "@/components/instructor/students-table"
import { getInstructorStudentsData } from "@/lib/instructor/data"

export default async function InstructorStudentsPage() {
  const data = await getInstructorStudentsData()

  return <StudentsTable data={data} />
}
