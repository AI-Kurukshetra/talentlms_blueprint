import type { Route } from "next"
import Link from "next/link"
import { Lock, MoveRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type LearningPathsBoardProps = {
  data: {
    learningPaths: Array<{
      id: string
      title: string
      description: string
      progressPercent: number
      courses: Array<{
        id: string
        title: string
        thumbnailUrl: string | null
        status: "in_progress" | "completed" | "dropped" | null
        locked: boolean
        completed: boolean
      }>
    }>
  }
}

export function LearningPathsBoard({ data }: LearningPathsBoardProps) {
  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-primary">Learning Paths</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Follow your assigned learning journeys</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
          Complete courses in sequence to unlock the next milestone in each path.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {data.learningPaths.length > 0 ? (
          data.learningPaths.map((path) => (
            <Card key={path.id} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-2xl tracking-tight">{path.title}</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  {path.description || "A sequenced program designed for steady learner progression."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span>Overall completion</span>
                    <span>{path.progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${path.progressPercent}%` }} />
                  </div>
                </div>

                <div className="space-y-3">
                  {path.courses.map((course, index) => (
                    <div key={course.id} className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-primary">Step {index + 1}</p>
                          <p className="mt-1 font-medium">{course.title}</p>
                        </div>
                        {course.locked ? (
                          <Badge variant="secondary" className="rounded-full px-3 py-1">
                            <Lock className="mr-1 h-3.5 w-3.5" />
                            Locked
                          </Badge>
                        ) : course.completed ? (
                          <Badge className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full px-3 py-1">
                            {course.status === "in_progress" ? "In progress" : "Available"}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-4">
                        {course.locked ? (
                          <p className="text-sm text-muted-foreground">
                            Finish the previous course in this path to unlock this step.
                          </p>
                        ) : (
                          <Button asChild variant="outline" className="rounded-full">
                            <Link href={`/learner/courses/${course.id}` as Route}>
                              Continue
                              <MoveRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
            <CardContent className="p-8 text-sm text-muted-foreground">
              No learning paths are currently assigned to your group.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
