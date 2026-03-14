import { BrowseCoursesGrid } from "@/components/learner/browse-courses-grid"
import { getBrowseCoursesData } from "@/lib/learner/data"

export default async function LearnerBrowsePage() {
  const data = await getBrowseCoursesData()

  return <BrowseCoursesGrid courses={data.courses} categories={data.categories} />
}
