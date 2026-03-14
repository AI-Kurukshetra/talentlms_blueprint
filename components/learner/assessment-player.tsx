"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { CheckCircle2, Clock3, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import type { LearnerAssessmentData } from "@/lib/assessment/data"
import {
  evaluateQuestionAnswer,
  getQuestionCorrectAnswerLabel,
  type AssessmentQuestion
} from "@/lib/assessment/schema"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type LearnerAssessmentPlayerProps = {
  data: LearnerAssessmentData
}

type SubmissionResponse = {
  score: number
  passed: boolean
  passingScore: number
  certificateIssued: boolean
  earnedBadges?: string[]
}

export function LearnerAssessmentPlayer({ data }: LearnerAssessmentPlayerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SubmissionResponse | null>(null)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(
    data.assessment.timeLimitMinutes ? data.assessment.timeLimitMinutes * 60 : null
  )

  const totalQuestions = data.assessment.questions.length
  const currentQuestion = data.assessment.questions[currentIndex]
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100

  useEffect(() => {
    if (timeLeftSeconds === null || result) return
    if (timeLeftSeconds <= 0) {
      submitAssessment()
      return
    }

    const timeout = window.setTimeout(() => {
      setTimeLeftSeconds((current) => (current === null ? null : current - 1))
    }, 1000)

    return () => window.clearTimeout(timeout)
  }, [timeLeftSeconds, result])

  const localScore = useMemo(() => {
    const earnedPoints = data.assessment.questions.reduce((sum, question) => {
      const answer = answers[question.id ?? ""]
      return sum + (answer && evaluateQuestionAnswer(question, answer) ? question.points : 0)
    }, 0)
    const totalPoints = data.assessment.questions.reduce((sum, question) => sum + question.points, 0)
    return totalPoints === 0 ? 0 : (earnedPoints / totalPoints) * 100
  }, [answers, data.assessment.questions])

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainder = seconds % 60
    return `${minutes}:${remainder.toString().padStart(2, "0")}`
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }))
  }

  function formatSubmittedAnswer(question: AssessmentQuestion, submittedAnswer: string) {
    if (!submittedAnswer) return "No answer submitted"
    if (question.type === "mcq") {
      return question.options[Number(submittedAnswer)] ?? submittedAnswer
    }
    if (question.type === "true_false") {
      return submittedAnswer === "true" ? "True" : "False"
    }
    return submittedAnswer
  }

  function submitAssessment() {
    startTransition(async () => {
      const response = await fetch(`/api/learner/assessments/${data.assessment.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ answers })
      })
      const payload = await response.json()

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Submission failed",
          description: payload.error ?? "Unable to submit assessment."
        })
        return
      }

      setResult(payload)
      toast({
        title: payload.passed ? "Assessment passed" : "Assessment submitted",
        description: payload.certificateIssued
          ? "A certificate was issued for this course."
          : "Your score has been recorded."
      })

      for (const badge of payload.earnedBadges ?? []) {
        toast({
          title: "Badge unlocked",
          description: badge
        })
      }
      router.refresh()
    })
  }

  if (result) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="glass-panel rounded-[30px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">Assessment complete</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{data.assessment.title}</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Review your score and compare your responses with the expected answers.
              </p>
            </div>
            <Badge
              className={`rounded-full px-4 py-2 text-sm ${
                result.passed
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
              }`}
            >
              {result.passed ? "Passed" : "Needs another attempt"}
            </Badge>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="glass-panel rounded-[28px] border-white/10 bg-white/[0.04]">
            <CardHeader>
              <CardDescription>Score</CardDescription>
              <CardTitle className="text-4xl tracking-tight">{result.score.toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-panel rounded-[28px] border-white/10 bg-white/[0.04]">
            <CardHeader>
              <CardDescription>Passing threshold</CardDescription>
              <CardTitle className="text-4xl tracking-tight">{result.passingScore}%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-panel rounded-[28px] border-white/10 bg-white/[0.04]">
            <CardHeader>
              <CardDescription>Certificate</CardDescription>
              <CardTitle className="text-xl tracking-tight">
                {result.certificateIssued ? "Issued" : "Not issued"}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Answer review</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Compare each response with the correct answer set for the assessment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.assessment.questions.map((question, index) => {
              const submittedAnswer = answers[question.id ?? ""] ?? ""
              const correct = evaluateQuestionAnswer(question, submittedAnswer)
              return (
                <div key={question.id ?? index} className="rounded-[26px] border border-white/10 bg-black/10 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-primary">Question {index + 1}</p>
                      <h3 className="mt-2 text-lg font-medium">{question.text}</h3>
                    </div>
                    {correct ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your answer</p>
                      <p className="mt-2 text-sm">{formatSubmittedAnswer(question, submittedAnswer)}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Correct answer</p>
                      <p className="mt-2 text-sm">{getQuestionCorrectAnswerLabel(question)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">{data.assessment.courseTitle}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{data.assessment.title}</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Answer one question at a time. Your progress is tracked through the assessment.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {currentIndex + 1} / {totalQuestions}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Target {data.assessment.passingScore}%
            </Badge>
            {timeLeftSeconds !== null ? (
              <Badge className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                <Clock3 className="mr-2 h-4 w-4" />
                {formatTime(timeLeftSeconds)}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardDescription className="text-sm uppercase tracking-[0.18em] text-primary">
            Question {currentIndex + 1}
          </CardDescription>
          <CardTitle className="text-3xl tracking-tight">{currentQuestion.text}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {currentQuestion.points} point{currentQuestion.points === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion.type === "mcq" ? (
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => {
                const selected = answers[currentQuestion.id ?? ""] === `${index}`
                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    type="button"
                    className={`rounded-[24px] border p-5 text-left transition ${
                      selected
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                    onClick={() => setAnswer(currentQuestion.id ?? "", `${index}`)}
                  >
                    <p className="text-base font-medium">{option}</p>
                  </button>
                )
              })}
            </div>
          ) : null}

          {currentQuestion.type === "true_false" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "True", value: "true" },
                { label: "False", value: "false" }
              ].map((item) => {
                const selected = answers[currentQuestion.id ?? ""] === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    className={`rounded-[28px] border px-6 py-10 text-left transition ${
                      selected
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                    onClick={() => setAnswer(currentQuestion.id ?? "", item.value)}
                  >
                    <p className="text-2xl font-semibold tracking-tight">{item.label}</p>
                  </button>
                )
              })}
            </div>
          ) : null}

          {currentQuestion.type === "short_answer" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Your answer</label>
              <Input
                value={answers[currentQuestion.id ?? ""] ?? ""}
                onChange={(event) => setAnswer(currentQuestion.id ?? "", event.target.value)}
                placeholder="Type your response"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Current estimated score: {localScore.toFixed(1)}%
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
            disabled={currentIndex === 0 || isPending}
          >
            Previous
          </Button>
          {currentIndex < totalQuestions - 1 ? (
            <Button
              className="rounded-full"
              onClick={() => setCurrentIndex((current) => Math.min(totalQuestions - 1, current + 1))}
              disabled={isPending}
            >
              Next
            </Button>
          ) : (
            <Button className="rounded-full" onClick={submitAssessment} disabled={isPending}>
              {isPending ? "Submitting..." : "Submit Assessment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
