"use client"

import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { BookOpenText, Search, Sparkles } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"

import type { LearnerBrowseCourse } from "@/lib/learner/data"
import { EmptyState } from "@/components/shared/empty-state"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type BrowseCoursesGridProps = {
  courses: LearnerBrowseCourse[]
  categories: string[]
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")

function formatPrice(value: number) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`
}

export function BrowseCoursesGrid({ courses, categories }: BrowseCoursesGridProps) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isPending, startTransition] = useTransition()
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(
    new Set(courses.filter((course) => course.isEnrolled).map((course) => course.id))
  )

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.instructorName.toLowerCase().includes(normalizedQuery)
      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
      return matchesQuery && matchesCategory
    })
  }, [courses, query, selectedCategory])

  function handleCheckout(courseId: string, price: number) {
    startTransition(async () => {
      const response = await fetch(price === 0 ? "/api/learner/enrollments" : "/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ courseId })
      })
      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: price === 0 ? "Enrollment failed" : "Checkout failed",
          description: result.error ?? "Unable to continue right now."
        })
        return
      }

      if (price > 0) {
        await stripePromise
        window.location.assign(result.url)
        return
      }

      setEnrolledCourseIds((current) => new Set([...current, courseId]))
      toast({
        title: "Enrolled successfully",
        description: "The course is now available in your learning queue."
      })

      for (const badge of (result.earnedBadges ?? []) as string[]) {
        toast({
          title: "Badge unlocked",
          description: badge
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.24em] text-primary">Browse Courses</p>
          <h2 className="text-3xl font-semibold tracking-tight">Discover your next learning track</h2>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Explore the published catalog, search by topic, and enroll in courses that align with your current goals.
          </p>
        </div>
      </section>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Published catalog</CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">
            Search by course title or instructor, then filter by inferred learning category.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-2">
              <Label htmlFor="course-search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="course-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search courses or instructors"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id)

                return (
                  <Card
                    key={course.id}
                    className="rounded-[28px] border-white/10 bg-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white/[0.05]"
                  >
                    <div className="overflow-hidden rounded-t-[28px] border-b border-white/10 bg-black/20">
                      {course.thumbnailUrl ? (
                        <Image src={course.thumbnailUrl} alt={course.title} width={960} height={540} unoptimized className="h-44 w-full object-cover" />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_55%)]">
                          <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {course.category}
                        </Badge>
                        {course.price === 0 ? (
                          <Badge className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                            Free
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full px-3 py-1">
                            {formatPrice(course.price)}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl tracking-tight">{course.title}</CardTitle>
                      <CardDescription className="text-sm leading-7 text-muted-foreground">
                        {course.description || "A structured course designed to build practical learner momentum."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{course.instructorName}</span>
                        <span>{course.lessonCount} lessons</span>
                      </div>
                      {isEnrolled ? (
                        <Button asChild className="w-full rounded-full">
                          <Link href={`/learner/courses/${course.id}` as Route}>Continue</Link>
                        </Button>
                      ) : (
                        <Button
                          className="w-full rounded-full"
                          onClick={() => handleCheckout(course.id, course.price)}
                          disabled={isPending}
                        >
                          {course.price === 0 ? "Enroll Now" : "Buy Now"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={BookOpenText}
              title="No courses match your filters"
              description="Try another keyword or category, or come back when more published courses are available."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
