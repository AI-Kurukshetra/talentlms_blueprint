"use client"

import type { Route } from "next"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { CheckCircle2, FileText, PlayCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import type { LearnerCoursePlayerData } from "@/lib/learner/data"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CoursePlayerProps = {
  data: LearnerCoursePlayerData
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatDuration(value: number | null) {
  if (!value) return "Flexible"
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

export function CoursePlayer({ data }: CoursePlayerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [lessons, setLessons] = useState(data.lessons)
  const [activeLessonId, setActiveLessonId] = useState(data.course.nextLessonId ?? data.lessons[0]?.id ?? "")
  const [progressPercent, setProgressPercent] = useState(data.course.progressPercent)

  const activeLesson = lessons.find((lesson) => lesson.id === activeLessonId) ?? lessons[0]
  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeLesson?.id)
  const nextLesson = activeIndex >= 0 ? lessons[activeIndex + 1] ?? null : null
  const completedCount = useMemo(() => lessons.filter((lesson) => lesson.completed).length, [lessons])

  function handleComplete() {
    if (!activeLesson || activeLesson.completed) return

    startTransition(async () => {
      const response = await fetch(`/api/learner/courses/${data.course.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ lessonId: activeLesson.id })
      })

      const result = await response.json()
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Unable to update progress",
          description: result.error ?? "Please try again."
        })
        return
      }

      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === activeLesson.id ? { ...lesson, completed: true } : lesson
        )
      )
      setProgressPercent(result.progressPercent ?? progressPercent)

      if (result.nextLessonId) {
        setActiveLessonId(result.nextLessonId)
      }

      toast({
        title: result.courseCompleted ? "Course completed" : "Lesson completed",
        description: result.certificateIssued
          ? "A course certificate has been issued."
          : result.courseCompleted
            ? "You have completed every lesson in this course."
            : "Progress has been updated."
      })

      for (const badge of (result.earnedBadges ?? []) as string[]) {
        toast({
          title: "Badge unlocked",
          description: badge
        })
      }

      router.refresh()
    })
  }

  if (!activeLesson) {
    return (
      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardContent className="p-8 text-sm text-muted-foreground">
          This course does not contain any lessons yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-28 xl:h-[calc(100vh-8rem)]">
        <Card className="glass-panel h-full rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">{data.course.title}</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              {completedCount} of {lessons.length} lessons completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span>Overall progress</span>
                <span>{formatPercent(progressPercent)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {lessons.map((lesson, index) => {
                const selected = lesson.id === activeLesson.id
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`flex w-full items-start gap-3 rounded-[22px] border px-4 py-4 text-left transition ${
                      selected
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                    onClick={() => setActiveLessonId(lesson.id)}
                  >
                    <div className="mt-0.5">
                      {lesson.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : lesson.type === "video" ? (
                        <PlayCircle className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{index + 1}. {lesson.title}</p>
                      <p className="mt-1 text-sm capitalize text-muted-foreground">
                        {lesson.type.replace("_", " ")} • {formatDuration(lesson.durationSeconds)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-6">
        <section className="glass-panel rounded-[30px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">Lesson experience</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{activeLesson.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {data.course.description || "Move through lessons, track completions, and finish the course to earn a certificate."}
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full px-4 py-2 capitalize">
              {activeLesson.type.replace("_", " ")}
            </Badge>
          </div>
        </section>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardContent className="p-0">
            {activeLesson.type === "video" ? (
              activeLesson.signedUrl ? (
                <video controls className="w-full rounded-[30px]" src={activeLesson.signedUrl} />
              ) : (
                <div className="p-8 text-sm text-muted-foreground">Video is unavailable.</div>
              )
            ) : null}

            {activeLesson.type === "document" || activeLesson.type === "scorm" ? (
              <div className="p-6">
                {activeLesson.signedUrl?.toLowerCase().includes(".pdf") ? (
                  <iframe
                    src={activeLesson.signedUrl}
                    className="h-[720px] w-full rounded-[22px] border border-white/10"
                    title={activeLesson.title}
                  />
                ) : (
                  <div className="rounded-[24px] border border-white/10 bg-black/10 p-6">
                    <p className="text-sm text-muted-foreground">
                      This lesson opens as a secure document download.
                    </p>
                    <Button asChild className="mt-4 rounded-full">
                      <a href={activeLesson.signedUrl ?? "#"} target="_blank" rel="noreferrer">
                        Open document
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {activeLesson.type === "text" ? (
              <div className="p-6">
                <div className="rounded-[24px] border border-white/10 bg-black/10 p-6 text-sm leading-8 text-muted-foreground whitespace-pre-wrap">
                  {activeLesson.content || "No lesson content has been added yet."}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {activeLesson.completed ? "Lesson completed." : "Mark the lesson complete when you finish reviewing it."}
          </div>
          <div className="flex gap-2">
            {nextLesson ? (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setActiveLessonId(nextLesson.id)}
              >
                Next lesson
              </Button>
            ) : null}
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/learner/courses/${data.course.id}/discussion` as Route}>Discussion</Link>
            </Button>
            <Button
              className="rounded-full"
              onClick={handleComplete}
              disabled={isPending || activeLesson.completed}
            >
              {activeLesson.completed ? "Completed" : isPending ? "Saving..." : "Mark lesson complete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
