import { PageSkeleton } from "@/components/shared/page-skeleton"

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
      <PageSkeleton />
    </main>
  )
}
