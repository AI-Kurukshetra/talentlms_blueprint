"use client"

import type { Route } from "next"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  GripVertical,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  WandSparkles,
  Youtube
} from "lucide-react"

import type { AIGeneratedCourse, AIGeneratedQuestion } from "@/lib/ai/types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type GenerationMode = "topic" | "document" | "youtube"
type AudienceLevel = "beginner" | "intermediate" | "advanced"
type QuestionType = "mcq" | "true_false" | "short_answer"

const sourceOptions = [
  {
    id: "topic" as const,
    icon: Sparkles,
    title: "From a Topic",
    description: "Start with a concise topic or course title and let AI build the structure."
  },
  {
    id: "document" as const,
    icon: FileText,
    title: "From a Document",
    description: "Paste source material or upload a .txt or .pdf file to turn existing knowledge into a course."
  },
  {
    id: "youtube" as const,
    icon: Youtube,
    title: "From a YouTube URL",
    description: "Use a YouTube link as the seed for a structured course outline and lesson plan."
  }
]

const progressSteps = [
  "Analyzing your input...",
  "Structuring course outline...",
  "Writing lesson content...",
  "Creating quiz questions...",
  "Finalizing your course..."
]

function createEmptyQuestion(type: QuestionType): AIGeneratedQuestion {
  if (type === "mcq") {
    return {
      type,
      text: "",
      options: ["", "", "", ""],
      answer: "0",
      points: 1
    }
  }

  return {
    type,
    text: "",
    options: [],
    answer: type === "true_false" ? "true" : "",
    points: 1
  }
}

function createEmptyGeneratedCourse(): AIGeneratedCourse {
  return {
    title: "",
    description: "",
    lessons: [],
    assessment: undefined
  }
}

async function extractSourceText(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension === "txt" || file.type.startsWith("text/")) {
    return file.text()
  }

  if (extension === "pdf" || file.type === "application/pdf") {
    const buffer = await file.arrayBuffer()
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
    const matches = text.match(/[A-Za-z0-9,.;:()'"%/\-\n\r ]{20,}/g)
    return matches?.join("\n").trim() || ""
  }

  throw new Error("Only .txt and .pdf files are supported.")
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

function getStepStatus(completedSteps: string[], includeQuiz: boolean, currentStep: number) {
  const visibleSteps = includeQuiz ? progressSteps : progressSteps.filter((step) => step !== "Creating quiz questions...")
  return visibleSteps.map((label, index) => ({
    label,
    done: completedSteps.includes(label),
    active: currentStep === 2 && !completedSteps.includes(label) && index === completedSteps.length
  }))
}

export function AICourseGenerator() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [mode, setMode] = useState<GenerationMode>("topic")
  const [topic, setTopic] = useState("")
  const [documentText, setDocumentText] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [level, setLevel] = useState<AudienceLevel>("beginner")
  const [lessonCount, setLessonCount] = useState(8)
  const [includeQuiz, setIncludeQuiz] = useState(true)
  const [uploadName, setUploadName] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [generatedCourse, setGeneratedCourse] = useState<AIGeneratedCourse>(createEmptyGeneratedCourse())
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [isGenerating, startGenerating] = useTransition()

  const visibleProgressSteps = useMemo(
    () => getStepStatus(completedSteps, includeQuiz, currentStep),
    [completedSteps, currentStep, includeQuiz]
  )

  async function handleUpload(file: File) {
    try {
      const text = await extractSourceText(file)
      if (!text.trim()) {
        throw new Error("The uploaded file did not contain readable text.")
      }

      setDocumentText(text)
      setUploadName(file.name)
      toast({
        title: "Source loaded",
        description: `${file.name} is ready for AI generation.`
      })
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Unable to read the uploaded file."
      setError(message)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: message
      })
    }
  }

  function resetBuilder() {
    setCurrentStep(1)
    setCompletedSteps([])
    setGeneratedCourse(createEmptyGeneratedCourse())
    setError(null)
  }

  function updateLesson(index: number, patch: Partial<AIGeneratedCourse["lessons"][number]>) {
    setGeneratedCourse((current) => ({
      ...current,
      lessons: current.lessons.map((lesson, lessonIndex) =>
        lessonIndex === index ? { ...lesson, ...patch } : lesson
      )
    }))
  }

  function updateQuestion(index: number, patch: Partial<AIGeneratedQuestion>) {
    setGeneratedCourse((current) => {
      if (!current.assessment) return current

      return {
        ...current,
        assessment: {
          ...current.assessment,
          questions: current.assessment.questions.map((question, questionIndex) =>
            questionIndex === index ? { ...question, ...patch } : question
          )
        }
      }
    })
  }

  function addQuestion(type: QuestionType) {
    setGeneratedCourse((current) => ({
      ...current,
      assessment: {
        title: current.assessment?.title || `${current.title || "Generated course"} knowledge check`,
        questions: [...(current.assessment?.questions ?? []), createEmptyQuestion(type)]
      }
    }))
  }

  async function generateCourse() {
    const sourceValue =
      mode === "topic" ? topic.trim() : mode === "document" ? documentText.trim() : youtubeUrl.trim()

    if (!sourceValue) {
      setError(
        mode === "topic"
          ? "Enter a topic for the AI generator."
          : mode === "document"
            ? "Paste source text or upload a file."
            : "Paste a YouTube URL to continue."
      )
      return
    }

    setError(null)
    setCompletedSteps([])
    setCurrentStep(2)

    startGenerating(async () => {
      try {
        const response = await fetch("/api/ai/generate-course", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            topic: mode === "topic" ? topic : undefined,
            content: mode === "document" ? documentText : undefined,
            youtubeUrl: mode === "youtube" ? youtubeUrl : undefined,
            level,
            lessonCount,
            includeQuiz
          })
        })

        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => ({ error: "Unable to generate course." }))
          throw new Error(payload.error ?? "Unable to generate course.")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.trim()) continue
            const event = JSON.parse(line) as
              | { type: "progress"; step: string }
              | { type: "result"; data: AIGeneratedCourse }
              | { type: "error"; error: string }

            if (event.type === "progress") {
              setCompletedSteps((current) => (current.includes(event.step) ? current : [...current, event.step]))
            }

            if (event.type === "result") {
              setGeneratedCourse(event.data)
              setCurrentStep(3)
            }

            if (event.type === "error") {
              throw new Error(event.error)
            }
          }
        }
      } catch (generationError) {
        const message = generationError instanceof Error ? generationError.message : "Unable to generate course."
        setError(message)
        setCurrentStep(1)
        toast({
          variant: "destructive",
          title: "AI generation failed",
          description: message
        })
      }
    })
  }

  async function saveCourse() {
    if (!generatedCourse.title.trim()) {
      setError("Add a course title before saving.")
      return
    }

    if (generatedCourse.lessons.length === 0) {
      setError("Generate at least one lesson before saving.")
      return
    }

    startSaving(async () => {
      try {
        const courseResponse = await fetch("/api/instructor/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: generatedCourse.title,
            description: generatedCourse.description,
            thumbnailUrl: "",
            price: 0,
            status: "draft",
            lessons: generatedCourse.lessons.map((lesson, index) => ({
              title: lesson.title,
              type: "text",
              content: lesson.content,
              videoUrl: "",
              fileUrl: "",
              durationSeconds: 0,
              sortOrder: index
            }))
          })
        })

        const coursePayload = await courseResponse.json()
        if (!courseResponse.ok) {
          throw new Error(coursePayload.error ?? "Unable to save generated course.")
        }

        if (includeQuiz && generatedCourse.assessment?.questions.length) {
          const assessmentResponse = await fetch("/api/instructor/assessments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: generatedCourse.assessment.title || `${generatedCourse.title} knowledge check`,
              courseId: coursePayload.id,
              timeLimitMinutes: null,
              passingScore: 70,
              questions: generatedCourse.assessment.questions.map((question, index) => ({
                type: question.type,
                text: question.text,
                options: question.type === "mcq" ? question.options.slice(0, 4) : [],
                answer: question.answer,
                points: question.points,
                sortOrder: index
              }))
            })
          })

          const assessmentPayload = await assessmentResponse.json()
          if (!assessmentResponse.ok) {
            throw new Error(assessmentPayload.error ?? "Course saved, but assessment creation failed.")
          }
        }

        toast({
          title: "AI draft saved",
          description: "The generated course is ready for final polishing."
        })
        router.push((`/instructor/courses/${coursePayload.id}/edit` as Route))
        router.refresh()
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : "Unable to save generated course."
        setError(message)
        toast({
          variant: "destructive",
          title: "Save failed",
          description: message
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      {currentStep === 1 ? (
        <>
          <section className="glass-panel overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_28%),rgba(255,255,255,0.04)] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
                  <Sparkles className="h-4 w-4" />
                  AI Course Generator
                </div>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                  Generate Course with AI
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Turn a raw idea, document, or YouTube source into a structured course draft with lesson content and
                  optional quiz questions, then refine it before publishing.
                </p>
              </div>
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/instructor/courses">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to courses
                </Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            {sourceOptions.map((option) => {
              const Icon = option.icon
              const selected = option.id === mode
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  className={`glass-panel rounded-[28px] border p-6 text-left transition duration-300 hover:-translate-y-1 ${
                    selected
                      ? "border-primary/30 bg-primary/10 shadow-[0_24px_80px_rgba(59,130,246,0.18)]"
                      : "border-white/10 bg-white/[0.04] hover:border-white/20"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                    <Icon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold tracking-tight">{option.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{option.description}</p>
                </button>
              )
            })}
          </section>

          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-2xl tracking-tight">Input</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Pick the source type, then provide enough context for Claude to generate a strong first draft.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {mode === "topic" ? (
                  <div className="space-y-2">
                    <Label htmlFor="ai-topic">Topic or course title</Label>
                    <Input
                      id="ai-topic"
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      placeholder="Introduction to Python Programming"
                    />
                  </div>
                ) : null}

                {mode === "document" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-document">Paste source text</Label>
                      <Textarea
                        id="ai-document"
                        value={documentText}
                        onChange={(event) => setDocumentText(event.target.value)}
                        placeholder="Paste documentation, training notes, or a source article here."
                        className="min-h-[220px]"
                      />
                    </div>
                    <div className="rounded-[24px] border border-dashed border-white/15 bg-black/10 p-4">
                      <Label htmlFor="document-upload">Upload .txt or .pdf</Label>
                      <Input
                        id="document-upload"
                        type="file"
                        accept=".txt,.pdf,text/plain,application/pdf"
                        className="mt-3"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          void handleUpload(file)
                        }}
                      />
                      <p className="mt-3 text-sm text-muted-foreground">
                        {uploadName ? `${uploadName} loaded for generation.` : "Text extraction works best with text-first documents."}
                      </p>
                    </div>
                  </div>
                ) : null}

                {mode === "youtube" ? (
                  <div className="space-y-2">
                    <Label htmlFor="ai-youtube">YouTube URL</Label>
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="ai-youtube"
                        value={youtubeUrl}
                        onChange={(event) => setYoutubeUrl(event.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="pl-11"
                      />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-2xl tracking-tight">Generation settings</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Tune the course depth, lesson volume, and whether AI should include an assessment draft.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Audience level</Label>
                  <Select value={level} onValueChange={(value: AudienceLevel) => setLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="lesson-count">Number of lessons</Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Balance breadth and production time for the first draft.
                      </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {lessonCount} lessons
                    </Badge>
                  </div>
                  <input
                    id="lesson-count"
                    type="range"
                    min={5}
                    max={15}
                    step={1}
                    value={lessonCount}
                    onChange={(event) => setLessonCount(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-black/10 p-4">
                  <div>
                    <p className="font-medium">Include quiz</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Generate a matching knowledge check after the lesson outline.
                    </p>
                  </div>
                  <Switch checked={includeQuiz} onCheckedChange={setIncludeQuiz} />
                </div>

                <Button className="w-full rounded-full" disabled={isGenerating} onClick={generateCourse}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isGenerating ? "Generating..." : "Generate with AI"}
                </Button>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}

      {currentStep === 2 ? (
        <section className="glass-panel min-h-[72vh] rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_35%),rgba(255,255,255,0.04)] p-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-primary/20 bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="mt-6 text-sm uppercase tracking-[0.24em] text-primary">AI Generation In Progress</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Building your course draft</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Claude is turning your source material into a course outline, lesson bodies, and an optional quiz draft.
            </p>

            <div className="mt-10 w-full space-y-4 text-left">
              {visibleProgressSteps.map((step) => (
                <div
                  key={step.label}
                  className={`flex items-center gap-4 rounded-[24px] border p-4 transition ${
                    step.done
                      ? "border-emerald-500/20 bg-emerald-500/10"
                      : step.active
                        ? "border-primary/20 bg-primary/10"
                        : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                      step.done
                        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                        : step.active
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-white/10 bg-black/20 text-muted-foreground"
                    }`}
                  >
                    {step.done ? <Check className="h-4 w-4" /> : <Loader2 className={`h-4 w-4 ${step.active ? "animate-spin" : ""}`} />}
                  </div>
                  <div>
                    <p className="font-medium">{step.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.done ? "Completed" : step.active ? "Working now" : "Queued"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {currentStep === 3 ? (
        <>
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <section className="glass-panel rounded-[32px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.24em] text-primary">Preview & Edit</p>
                <Input
                  value={generatedCourse.title}
                  onChange={(event) => setGeneratedCourse((current) => ({ ...current, title: event.target.value }))}
                  className="mt-4 h-auto border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
                  placeholder="Generated course title"
                />
                <Textarea
                  value={generatedCourse.description}
                  onChange={(event) => setGeneratedCourse((current) => ({ ...current, description: event.target.value }))}
                  className="mt-4 min-h-[120px] border-white/10 bg-black/10"
                  placeholder="Generated course description"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[360px] xl:grid-cols-1">
                <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                  <p className="text-sm text-muted-foreground">Lessons</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{generatedCourse.lessons.length}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                  <p className="text-sm text-muted-foreground">Quiz</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {generatedCourse.assessment?.questions.length ?? 0}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                  <p className="text-sm text-muted-foreground">Audience</p>
                  <p className="mt-2 text-3xl font-semibold capitalize tracking-tight">{level}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Generated lessons</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Edit titles and content inline, remove sections, or reorder the lesson flow before saving.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {generatedCourse.lessons.map((lesson, index) => (
                <Card key={`${lesson.title}-${index}`} className="glass-panel rounded-[28px] border-white/10 bg-white/[0.04]">
                  <CardHeader className="pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          Lesson {index + 1}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={index === 0}
                          onClick={() =>
                            setGeneratedCourse((current) => ({
                              ...current,
                              lessons: moveItem(current.lessons, index, index - 1)
                            }))
                          }
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Move up
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={index === generatedCourse.lessons.length - 1}
                          onClick={() =>
                            setGeneratedCourse((current) => ({
                              ...current,
                              lessons: moveItem(current.lessons, index, index + 1)
                            }))
                          }
                        >
                          Move down
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={() =>
                            setGeneratedCourse((current) => ({
                              ...current,
                              lessons: current.lessons.filter((_, lessonIndex) => lessonIndex !== index)
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      value={lesson.title}
                      onChange={(event) => updateLesson(index, { title: event.target.value })}
                      placeholder={`Lesson ${index + 1} title`}
                    />
                    <Textarea
                      value={lesson.content}
                      onChange={(event) => updateLesson(index, { content: event.target.value })}
                      className="min-h-[220px]"
                      placeholder="Generated lesson content"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Generated quiz</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Refine the assessment draft or add new questions before saving.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => addQuestion("mcq")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add MCQ
                </Button>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => addQuestion("true_false")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add True / False
                </Button>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => addQuestion("short_answer")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Short Answer
                </Button>
              </div>
            </div>

            <Card className="glass-panel rounded-[28px] border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">Assessment title</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  The assessment is optional. Remove every question if you do not want to save one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={generatedCourse.assessment?.title ?? ""}
                  onChange={(event) =>
                    setGeneratedCourse((current) => ({
                      ...current,
                      assessment: {
                        title: event.target.value,
                        questions: current.assessment?.questions ?? []
                      }
                    }))
                  }
                  placeholder="Knowledge check title"
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {(generatedCourse.assessment?.questions ?? []).map((question, index) => (
                <Card key={`${question.text}-${index}`} className="glass-panel rounded-[28px] border-white/10 bg-white/[0.04]">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          Question {index + 1}
                        </Badge>
                        <Select
                          value={question.type}
                          onValueChange={(value: QuestionType) => updateQuestion(index, createEmptyQuestion(value))}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">MCQ</SelectItem>
                            <SelectItem value="true_false">True & False</SelectItem>
                            <SelectItem value="short_answer">Short Answer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={index === 0}
                          onClick={() =>
                            setGeneratedCourse((current) =>
                              current.assessment
                                ? {
                                    ...current,
                                    assessment: {
                                      ...current.assessment,
                                      questions: moveItem(current.assessment.questions, index, index - 1)
                                    }
                                  }
                                : current
                            )
                          }
                        >
                          Move up
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={index === (generatedCourse.assessment?.questions.length ?? 1) - 1}
                          onClick={() =>
                            setGeneratedCourse((current) =>
                              current.assessment
                                ? {
                                    ...current,
                                    assessment: {
                                      ...current.assessment,
                                      questions: moveItem(current.assessment.questions, index, index + 1)
                                    }
                                  }
                                : current
                            )
                          }
                        >
                          Move down
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={() =>
                            setGeneratedCourse((current) =>
                              current.assessment
                                ? {
                                    ...current,
                                    assessment: {
                                      ...current.assessment,
                                      questions: current.assessment.questions.filter((_, questionIndex) => questionIndex !== index)
                                    }
                                  }
                                : current
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      value={question.text}
                      onChange={(event) => updateQuestion(index, { text: event.target.value })}
                      placeholder="Question text"
                    />

                    {question.type === "mcq" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={`${optionIndex}`} className="space-y-2 rounded-[22px] border border-white/10 bg-black/10 p-4">
                            <Label>Option {optionIndex + 1}</Label>
                            <Input
                              value={option}
                              onChange={(event) =>
                                updateQuestion(index, {
                                  options: question.options.map((item, itemIndex) =>
                                    itemIndex === optionIndex ? event.target.value : item
                                  )
                                })
                              }
                            />
                          </div>
                        ))}
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Correct answer</Label>
                          <Select value={question.answer} onValueChange={(value) => updateQuestion(index, { answer: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.map((option, optionIndex) => (
                                <SelectItem key={`${optionIndex}`} value={`${optionIndex}`}>
                                  {option || `Option ${optionIndex + 1}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}

                    {question.type === "true_false" ? (
                      <div className="space-y-2">
                        <Label>Correct answer</Label>
                        <Select value={question.answer} onValueChange={(value) => updateQuestion(index, { answer: value })}>
                          <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}

                    {question.type === "short_answer" ? (
                      <div className="space-y-2">
                        <Label>Expected answer</Label>
                        <Textarea
                          value={question.answer}
                          onChange={(event) => updateQuestion(index, { answer: event.target.value })}
                          className="min-h-[100px]"
                        />
                      </div>
                    ) : null}

                    <div className="w-full sm:w-[160px]">
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(event) => updateQuestion(index, { points: Number(event.target.value || 1) })}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" className="rounded-full" onClick={resetBuilder}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="rounded-full" onClick={() => setCurrentStep(1)}>
                <WandSparkles className="mr-2 h-4 w-4" />
                Back to input
              </Button>
              <Button className="rounded-full" disabled={isSaving} onClick={saveCourse}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save Course
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
