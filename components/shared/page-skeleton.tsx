import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Skeleton className="h-36 w-full rounded-[30px]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-[30px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[320px] w-full rounded-[30px]" />
        <Skeleton className="h-[320px] w-full rounded-[30px]" />
      </div>
    </div>
  )
}
