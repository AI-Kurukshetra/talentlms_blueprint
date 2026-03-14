import { PageSkeleton } from "@/components/shared/page-skeleton"

export default function AuthLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      <PageSkeleton />
    </main>
  )
}
