"use client"

import { useMemo, useState, useTransition } from "react"
import { Copy, Sparkles, WandSparkles } from "lucide-react"

import type { AIGeneratedQuestion } from "@/lib/ai/types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

type LessonContext = {
  title: string
  content: string
}

type AIAssistantProps = {
  courseTitle: string
  lessons: LessonContext[]
  onApplySuggestion: (lessonIndex: number, content: string) => void
}

const quickPrompts = [
  "Improve this lesson content",
  "Make this simpler for beginners",
  "Add more examples to this lesson",
  "Generate 5 more quiz questions for this topic"
]

function formatQuestions(questions: AIGeneratedQuestion[]) {
  return questions
    .map((question, index) => {
      const options =
        question.type === "mcq"
          ? `\nOptions:\n${question.options.map((option, optionIndex) => `${optionIndex + 1}. ${option}`).join("\n")}`
          : ""
      return `${index + 1}. ${question.text}${options}\nAnswer: ${question.answer}\nPoints: ${question.points}`
    })
    .join("\n\n")
}

export function AIAssistant({ courseTitle, lessons, onApplySuggestion }: AIAssistantProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [selectedLessonIndex, setSelectedLessonIndex] = useState("0")
  const [response, setResponse] = useState<string>("")
  const [questions, setQuestions] = useState<AIGeneratedQuestion[]>([])
  const [isPending, startTransition] = useTransition()

  const selectedLesson = useMemo(
    () => lessons[Number(selectedLessonIndex)] ?? lessons[0],
    [lessons, selectedLessonIndex]
  )

  async function askAssistant(nextPrompt: string) {
    startTransition(async () => {
      const result = await fetch("/api/ai/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "assist",
          courseTitle,
          lessonTitle: selectedLesson?.title ?? "",
          lessonContent: selectedLesson?.content ?? "",
          prompt: nextPrompt
        })
      })

      const payload = await result.json()
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "AI request failed",
          description: payload.error ?? "Unable to generate assistant response."
        })
        return
      }

      setResponse(payload.suggestedContent ?? payload.message ?? "")
      setQuestions(payload.suggestedQuestions ?? [])
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 z-40 rounded-full shadow-[0_18px_60px_rgba(59,130,246,0.28)]">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Help
        </Button>
      </SheetTrigger>
      <SheetContent className="left-auto right-0 w-[92%] max-w-xl border-l border-r-0 border-white/10 bg-slate-950/95 p-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-primary">AI Writing Assistant</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Refine lessons with Claude</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Improve tone, simplify explanations, and generate supporting quiz ideas without leaving the editor.
            </p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <div className="space-y-2">
              <Label>Target lesson</Label>
              <Select value={selectedLessonIndex} onValueChange={setSelectedLessonIndex}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lessons.map((lesson, index) => (
                    <SelectItem key={`${lesson.title}-${index}`} value={`${index}`}>
                      {lesson.title || `Lesson ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setPrompt(item)
                    void askAssistant(item)
                  }}
                >
                  <WandSparkles className="mr-2 h-4 w-4" />
                  {item}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Ask AI</Label>
              <Textarea
                id="ai-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe how you want AI to improve this lesson."
                className="min-h-[140px]"
              />
              <div className="flex justify-end">
                <Button className="rounded-full" disabled={isPending || !prompt.trim()} onClick={() => askAssistant(prompt)}>
                  {isPending ? "Thinking..." : "Generate suggestion"}
                </Button>
              </div>
            </div>

            {response ? (
              <div className="space-y-3 rounded-[26px] border border-white/10 bg-black/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-primary">Suggested rewrite</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Apply this directly to the selected lesson content.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => onApplySuggestion(Number(selectedLessonIndex), response)}
                  >
                    Apply suggestion
                  </Button>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            ) : null}

            {questions.length > 0 ? (
              <div className="space-y-3 rounded-[26px] border border-white/10 bg-black/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-primary">Generated quiz ideas</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Copy these questions into an assessment workflow.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={async () => {
                      await navigator.clipboard.writeText(formatQuestions(questions))
                      toast({
                        title: "Questions copied",
                        description: "Quiz suggestions are on your clipboard."
                      })
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div key={`${question.text}-${index}`} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                          {question.type.replace("_", " ")}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {question.points} pts
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm font-medium">{question.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
