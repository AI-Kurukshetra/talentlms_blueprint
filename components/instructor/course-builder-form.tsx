"use client"

import type { Route } from "next"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Plus,
  Save,
  Trash2,
  Upload,
  WandSparkles
} from "lucide-react"
import { useRouter } from "next/navigation"

import type { CourseFormData } from "@/lib/instructor/data"
import { AIAssistant } from "@/components/course-builder/ai-assistant"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type CourseBuilderFormProps = {
  mode: "create" | "edit"
  initialData?: CourseFormData
}

type LessonDraft = CourseFormData["lessons"][number] & {
  clientId: string
}

const steps = [
  { id: 1, label: "Course Details" },
  { id: 2, label: "Add Lessons" },
  { id: 3, label: "Review & Publish" }
]

function createEmptyLesson(): LessonDraft {
  return {
    clientId: crypto.randomUUID(),
    title: "",
    type: "text",
    content: "",
    videoUrl: "",
    fileUrl: "",
    durationSeconds: 0,
    sortOrder: 0
  }
}

function toDraftLessons(lessons: CourseFormData["lessons"]) {
  return lessons.map((lesson, index) => ({
    ...lesson,
    clientId: lesson.id ?? `lesson-${index}-${crypto.randomUUID()}`
  }))
}

function formatCurrency(value: number) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`
}

function formatLessonAsset(lesson: LessonDraft) {
  const value = lesson.type === "video" ? lesson.videoUrl : lesson.fileUrl
  if (!value) return "No file uploaded"
  return value.split("/").pop() ?? value
}

export function CourseBuilderForm({ mode, initialData }: CourseBuilderFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [course, setCourse] = useState<CourseFormData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    thumbnailUrl: initialData?.thumbnailUrl ?? "",
    price: initialData?.price ?? 0,
    status: initialData?.status ?? "draft",
    lessons: initialData?.lessons ?? []
  })
  const [lessons, setLessons] = useState<LessonDraft[]>(
    initialData?.lessons ? toDraftLessons(initialData.lessons) : [createEmptyLesson()]
  )
  const [formError, setFormError] = useState<string | null>(null)

  const progressWidth = useMemo(() => `${((currentStep - 1) / (steps.length - 1)) * 100}%`, [currentStep])

  function updateLesson(clientId: string, patch: Partial<LessonDraft>) {
    setLessons((current) =>
      current.map((lesson, index) =>
        lesson.clientId === clientId ? { ...lesson, ...patch, sortOrder: index } : lesson
      )
    )
  }

  function reorderLessons(fromIndex: number, toIndex: number) {
    setLessons((current) => {
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next.map((lesson, index) => ({ ...lesson, sortOrder: index }))
    })
  }

  async function uploadFile(bucket: "course-thumbnails" | "lesson-videos" | "lesson-documents", file: File) {
    const formData = new FormData()
    formData.append("bucket", bucket)
    formData.append("file", file)

    const response = await fetch("/api/instructor/uploads", {
      method: "POST",
      body: formData
    })
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error ?? "Upload failed")
    }

    return result as {
      publicUrl: string | null
      storageKey: string
      fileName: string
    }
  }

  function validateStep(step: number) {
    if (step === 1) {
      if (!course.title.trim()) {
        setFormError("Course title is required.")
        return false
      }
    }

    if (step === 2) {
      const invalidLesson = lessons.find((lesson) => !lesson.title.trim())
      if (invalidLesson) {
        setFormError("Every lesson needs a title.")
        return false
      }
    }

    setFormError(null)
    return true
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((step) => Math.min(3, step + 1))
    }
  }

  function previousStep() {
    setCurrentStep((step) => Math.max(1, step - 1))
  }

  async function submitCourse(statusOverride?: CourseFormData["status"]) {
    if (!validateStep(1) || !validateStep(2)) return

    startTransition(async () => {
      const payload: CourseFormData = {
        ...course,
        status: statusOverride ?? course.status,
        lessons: lessons.map(({ clientId: _clientId, ...lesson }, index) => ({
          ...lesson,
          sortOrder: index
        }))
      }

      const endpoint = mode === "create" ? "/api/instructor/courses" : `/api/instructor/courses/${initialData?.id}`
      const method = mode === "create" ? "POST" : "PATCH"
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      const result = await response.json()

      if (!response.ok) {
        const message = result.error ?? "Unable to save course."
        setFormError(message)
        toast({
          variant: "destructive",
          title: "Unable to save course",
          description: message
        })
        return
      }

      toast({
        title: mode === "create" ? "Course created" : "Course updated",
        description:
          payload.status === "published"
            ? "Your course is now published."
            : "Your changes have been saved."
      })

      router.push((`/instructor/courses/${result.id}` as Route))
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">
                {mode === "create" ? "Create Course" : "Edit Course"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {mode === "create" ? "Build a new learning experience" : "Refine course content"}
              </h2>
            </div>
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/instructor/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to courses
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: progressWidth }} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${
                    currentStep === step.id
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : currentStep > step.id
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground"
                  }`}
                >
                  <p className="font-medium">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {formError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      {currentStep === 1 ? (
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Course details</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Define the learning proposition, pricing, visibility, and first impression.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="course-title">Course title</Label>
              <Input
                id="course-title"
                value={course.title}
                onChange={(event) => setCourse((current) => ({ ...current, title: event.target.value }))}
                placeholder="Customer onboarding academy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-description">Description</Label>
              <Textarea
                id="course-description"
                value={course.description}
                onChange={(event) => setCourse((current) => ({ ...current, description: event.target.value }))}
                placeholder="Outline the course goals, audience, and what learners will achieve."
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <div className="space-y-3">
                <Label htmlFor="thumbnail-upload">Thumbnail upload</Label>
                <div className="rounded-[24px] border border-dashed border-white/15 bg-black/10 p-4">
                  <div className="mb-4 overflow-hidden rounded-[20px] border border-white/10 bg-black/20">
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnailUrl}
                        alt="Course thumbnail"
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                        Upload a thumbnail to brand this course
                      </div>
                    )}
                  </div>
                  <Input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      startTransition(async () => {
                        try {
                          const result = await uploadFile("course-thumbnails", file)
                          setCourse((current) => ({ ...current, thumbnailUrl: result.publicUrl ?? "" }))
                          toast({
                            title: "Thumbnail uploaded",
                            description: "The course thumbnail is ready."
                          })
                        } catch (error) {
                          toast({
                            variant: "destructive",
                            title: "Upload failed",
                            description: error instanceof Error ? error.message : "Please try again."
                          })
                        }
                      })
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="course-price">Price</Label>
                  <Input
                    id="course-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={course.price}
                    onChange={(event) =>
                      setCourse((current) => ({ ...current, price: Number(event.target.value || 0) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={course.status}
                    onValueChange={(value: CourseFormData["status"]) =>
                      setCourse((current) => ({ ...current, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                  <p className="text-sm font-medium">Pricing summary</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {formatCurrency(course.price)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Set `0` for a free internal course.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 2 ? (
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl tracking-tight">Add lessons</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Build the curriculum, upload content, and reorder the learner journey.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setLessons((current) => [...current, createEmptyLesson()])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.clientId}
                className="rounded-[26px] border border-white/10 bg-black/10 p-5"
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === index) return
                  reorderLessons(dragIndex, index)
                  setDragIndex(null)
                }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-primary">Lesson {index + 1}</p>
                      <p className="text-sm text-muted-foreground">Drag to reorder</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() =>
                      setLessons((current) => current.filter((item) => item.clientId !== lesson.clientId))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px]">
                  <div className="space-y-2">
                    <Label>Lesson title</Label>
                    <Input
                      value={lesson.title}
                      onChange={(event) => updateLesson(lesson.clientId, { title: event.target.value })}
                      placeholder="Introduction to the product"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={lesson.type}
                      onValueChange={(value: LessonDraft["type"]) =>
                        updateLesson(lesson.clientId, { type: value, content: "", videoUrl: "", fileUrl: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="scorm">SCORM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={lesson.durationSeconds}
                      onChange={(event) =>
                        updateLesson(lesson.clientId, { durationSeconds: Number(event.target.value || 0) })
                      }
                    />
                  </div>
                </div>

                {lesson.type === "text" ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Heading", snippet: "\n## New section\n" },
                        { label: "Bold", snippet: "**highlight**" },
                        { label: "Bullet", snippet: "\n- key point" }
                      ].map((item) => (
                        <Button
                          key={item.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() =>
                            updateLesson(lesson.clientId, {
                              content: `${lesson.content}${item.snippet}`
                            })
                          }
                        >
                          <WandSparkles className="mr-2 h-4 w-4" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      value={lesson.content}
                      onChange={(event) => updateLesson(lesson.clientId, { content: event.target.value })}
                      placeholder="Write rich course notes, summaries, or embedded references."
                      className="min-h-[180px]"
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <Label>
                      {lesson.type === "video"
                        ? "Upload lesson video"
                        : lesson.type === "document"
                          ? "Upload lesson document"
                          : "Upload SCORM package"}
                    </Label>
                    <div className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.02] p-4">
                      <Input
                        type="file"
                        accept={lesson.type === "video" ? "video/*" : lesson.type === "document" ? ".pdf,.doc,.docx,.ppt,.pptx" : ".zip,.scorm"}
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          const bucket = lesson.type === "video" ? "lesson-videos" : "lesson-documents"
                          startTransition(async () => {
                            try {
                              const result = await uploadFile(bucket, file)
                              updateLesson(lesson.clientId, {
                                videoUrl: lesson.type === "video" ? result.storageKey : "",
                                fileUrl: lesson.type === "video" ? "" : result.storageKey
                              })
                              toast({
                                title: "File uploaded",
                                description: `${file.name} is attached to this lesson.`
                              })
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Upload failed",
                                description: error instanceof Error ? error.message : "Please try again."
                              })
                            }
                          })
                        }}
                      />
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        {formatLessonAsset(lesson)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 3 ? (
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Review & publish</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Double-check the structure before saving or publishing to learners.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4 rounded-[26px] border border-white/10 bg-black/10 p-5">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-primary">Course</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-tight">{course.title || "Untitled course"}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {course.description || "No description added yet."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                  {course.status}
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {formatCurrency(course.price)}
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {lessons.length} lessons
                </Badge>
              </div>
            </div>
            <div className="space-y-3 rounded-[26px] border border-white/10 bg-black/10 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-primary">Lesson sequence</p>
              {lessons.map((lesson, index) => (
                <div key={lesson.clientId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {index + 1}. {lesson.title || "Untitled lesson"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground capitalize">{lesson.type}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {lesson.durationSeconds || 0}s
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {currentStep > 1 ? (
            <Button variant="outline" className="rounded-full" onClick={previousStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {currentStep < 3 ? (
            <Button className="rounded-full" onClick={nextStep}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="outline" className="rounded-full" onClick={() => submitCourse("draft")} disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button className="rounded-full" onClick={() => submitCourse("published")} disabled={isPending}>
                Publish Course
              </Button>
            </>
          )}
        </div>
      </div>

      <AIAssistant
        courseTitle={course.title}
        lessons={lessons.map((lesson) => ({
          title: lesson.title,
          content: lesson.content
        }))}
        onApplySuggestion={(lessonIndex, content) => {
          const targetLesson = lessons[lessonIndex]
          if (!targetLesson) return

          updateLesson(targetLesson.clientId, { content, type: "text" })
          toast({
            title: "Suggestion applied",
            description: "The lesson content has been updated in the editor."
          })
        }}
      />
    </div>
  )
}
