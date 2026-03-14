"use client"

import type { Route } from "next"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { ArrowLeft, Check, CircleOff, GripVertical, Plus, Save, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import type { InstructorAssessmentFormData, InstructorCourseOption } from "@/lib/assessment/data"
import { getQuestionCorrectAnswerLabel, type AssessmentQuestion, type QuestionType } from "@/lib/assessment/schema"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type AssessmentBuilderFormProps = {
  mode: "create" | "edit"
  courses: InstructorCourseOption[]
  initialData?: InstructorAssessmentFormData
}

type QuestionDraft = AssessmentQuestion & {
  clientId: string
}

function createQuestion(type: QuestionType = "mcq"): QuestionDraft {
  return {
    clientId: crypto.randomUUID(),
    type,
    text: "",
    options: type === "mcq" ? ["", "", "", ""] : [],
    answer: type === "true_false" ? "true" : type === "mcq" ? "0" : "",
    points: 1,
    sortOrder: 0
  }
}

function toDraftQuestions(questions: AssessmentQuestion[]) {
  return questions.map((question, index) => ({
    ...question,
    clientId: question.id ?? `question-${index}-${crypto.randomUUID()}`
  }))
}

export function AssessmentBuilderForm({
  mode,
  courses,
  initialData
}: AssessmentBuilderFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [courseId, setCourseId] = useState(initialData?.courseId ?? courses[0]?.id ?? "")
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | "">(initialData?.timeLimitMinutes ?? "")
  const [passingScore, setPassingScore] = useState(initialData?.passingScore ?? 70)
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialData?.questions ? toDraftQuestions(initialData.questions) : [createQuestion()]
  )
  const [formError, setFormError] = useState<string | null>(null)

  const totalPoints = useMemo(
    () => questions.reduce((sum, question) => sum + (question.points || 0), 0),
    [questions]
  )

  function updateQuestion(clientId: string, patch: Partial<QuestionDraft>) {
    setQuestions((current) =>
      current.map((question, index) =>
        question.clientId === clientId ? { ...question, ...patch, sortOrder: index } : question
      )
    )
  }

  function reorderQuestions(fromIndex: number, toIndex: number) {
    setQuestions((current) => {
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next.map((question, index) => ({ ...question, sortOrder: index }))
    })
  }

  function validate() {
    if (!title.trim()) {
      setFormError("Assessment title is required.")
      return false
    }

    if (!courseId) {
      setFormError("Select a course for this assessment.")
      return false
    }

    if (questions.length === 0) {
      setFormError("Add at least one question before saving.")
      return false
    }

    const invalidQuestion = questions.find((question) => !question.text.trim())
    if (invalidQuestion) {
      setFormError("Each question needs question text.")
      return false
    }

    const invalidMcq = questions.find(
      (question) =>
        question.type === "mcq" &&
        (question.options.length < 2 || question.options.some((option) => !option.trim()))
    )
    if (invalidMcq) {
      setFormError("MCQ questions need four filled options.")
      return false
    }

    const invalidShortAnswer = questions.find(
      (question) => question.type === "short_answer" && !question.answer.trim()
    )
    if (invalidShortAnswer) {
      setFormError("Short answer questions need an expected answer.")
      return false
    }

    setFormError(null)
    return true
  }

  async function saveAssessment() {
    if (!validate()) return

    startTransition(async () => {
      const payload: InstructorAssessmentFormData = {
        title: title.trim(),
        courseId,
        timeLimitMinutes: timeLimitMinutes === "" ? null : Number(timeLimitMinutes),
        passingScore,
        questions: questions.map(({ clientId: _clientId, ...question }, index) => ({
          ...question,
          sortOrder: index
        }))
      }

      const endpoint =
        mode === "create"
          ? "/api/instructor/assessments"
          : `/api/instructor/assessments/${initialData?.id}`
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
        const message = result.error ?? "Unable to save assessment."
        setFormError(message)
        toast({
          variant: "destructive",
          title: "Save failed",
          description: message
        })
        return
      }

      toast({
        title: mode === "create" ? "Assessment created" : "Assessment updated",
        description: "Your assessment changes have been saved."
      })

      router.push((`/instructor/assessments/${result.id}/results` as Route))
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">
              {mode === "create" ? "Create Assessment" : "Edit Assessment"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {mode === "create" ? "Design a high-signal quiz experience" : "Refine question quality and grading"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Build structured evaluation flows with drag-and-drop ordering, passing thresholds, and support for MCQ, true/false, and short answer grading.
            </p>
          </div>
          <Button asChild variant="ghost" className="rounded-full">
            <Link href="/instructor/assessments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to assessments
            </Link>
          </Button>
        </div>
      </section>

      {formError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Assessment details</CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">
            Set the linked course, timing constraints, and the required score for success.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="assessment-title">Title</Label>
            <Input
              id="assessment-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Product onboarding final quiz"
            />
          </div>
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passing-score">Passing score (%)</Label>
            <Input
              id="passing-score"
              type="number"
              min="1"
              max="100"
              value={passingScore}
              onChange={(event) => setPassingScore(Number(event.target.value || 70))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-limit">Time limit (minutes)</Label>
            <Input
              id="time-limit"
              type="number"
              min="1"
              value={timeLimitMinutes}
              onChange={(event) =>
                setTimeLimitMinutes(event.target.value === "" ? "" : Number(event.target.value))
              }
              placeholder="Optional"
            />
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-medium">Assessment summary</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {questions.length} questions
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {totalPoints} total points
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {timeLimitMinutes === "" ? "Untimed" : `${timeLimitMinutes} min`}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl tracking-tight">Question builder</CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Create, edit, delete, and reorder questions for the learner attempt flow.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setQuestions((current) => [...current, createQuestion()])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.clientId}
              className="rounded-[28px] border border-white/10 bg-black/10 p-5"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex === null || dragIndex === index) return
                reorderQuestions(dragIndex, index)
                setDragIndex(null)
              }}
            >
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-primary">Question {index + 1}</p>
                    <p className="text-sm text-muted-foreground">
                      Correct answer: {getQuestionCorrectAnswerLabel(question) || "Not set"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() =>
                    setQuestions((current) => {
                      const next = current.filter((item) => item.clientId !== question.clientId)
                      return next.length > 0 ? next : [createQuestion()]
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_220px_140px]">
                <div className="space-y-2">
                  <Label>Question text</Label>
                  <Textarea
                    value={question.text}
                    onChange={(event) => updateQuestion(question.clientId, { text: event.target.value })}
                    placeholder="What is the primary goal of this onboarding module?"
                    className="min-h-[110px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value: QuestionType) =>
                      updateQuestion(question.clientId, {
                        type: value,
                        options: value === "mcq" ? ["", "", "", ""] : [],
                        answer: value === "true_false" ? "true" : value === "mcq" ? "0" : ""
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">MCQ</SelectItem>
                      <SelectItem value="true_false">True & False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min="1"
                    value={question.points}
                    onChange={(event) =>
                      updateQuestion(question.clientId, { points: Number(event.target.value || 1) })
                    }
                  />
                </div>
              </div>

              {question.type === "mcq" ? (
                <div className="mt-5 space-y-3">
                  <Label>Options</Label>
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = question.answer === `${optionIndex}`
                    return (
                      <div
                        key={`${question.clientId}-option-${optionIndex}`}
                        className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-3"
                      >
                        <Button
                          type="button"
                          variant={isCorrect ? "default" : "outline"}
                          size="icon"
                          className="rounded-full"
                          onClick={() => updateQuestion(question.clientId, { answer: `${optionIndex}` })}
                        >
                          {isCorrect ? <Check className="h-4 w-4" /> : <CircleOff className="h-4 w-4" />}
                        </Button>
                        <Input
                          value={option}
                          onChange={(event) => {
                            const nextOptions = [...question.options]
                            nextOptions[optionIndex] = event.target.value
                            updateQuestion(question.clientId, { options: nextOptions })
                          }}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {question.type === "true_false" ? (
                <div className="mt-5 space-y-3">
                  <Label>Correct answer</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "True", value: "true" },
                      { label: "False", value: "false" }
                    ].map((item) => {
                      const selected = question.answer === item.value
                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={`rounded-[22px] border px-4 py-4 text-left transition ${
                            selected
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20"
                          }`}
                          onClick={() => updateQuestion(question.clientId, { answer: item.value })}
                        >
                          <p className="text-base font-medium">{item.label}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {question.type === "short_answer" ? (
                <div className="mt-5 space-y-2">
                  <Label>Expected answer</Label>
                  <Input
                    value={question.answer}
                    onChange={(event) => updateQuestion(question.clientId, { answer: event.target.value })}
                    placeholder="Type the expected learner answer"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="rounded-full" onClick={saveAssessment} disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving..." : "Save Assessment"}
        </Button>
      </div>
    </div>
  )
}
