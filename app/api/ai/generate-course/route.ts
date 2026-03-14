import { NextResponse } from "next/server"

import type { AIAssistantResponse, AIGeneratedCourse } from "@/lib/ai/types"
import { createClient } from "@/lib/supabase/server"

type GeneratePayload = {
  mode?: "generate" | "assist"
  topic?: string
  content?: string
  youtubeUrl?: string
  level?: "beginner" | "intermediate" | "advanced"
  lessonCount?: number
  includeQuiz?: boolean
  prompt?: string
  lessonTitle?: string
  lessonContent?: string
  courseTitle?: string
}

const MODEL = "claude-sonnet-4-20250514"

function extractJson<T>(value: string): T {
  const fenced = value.match(/```json\s*([\s\S]*?)```/i)?.[1]
  const source = fenced ?? value
  const start = source.indexOf("{")
  const end = source.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain valid JSON.")
  }

  return JSON.parse(source.slice(start, end + 1)) as T
}

function sanitizeGeneratedCourse(raw: AIGeneratedCourse, includeQuiz: boolean): AIGeneratedCourse {
  return {
    title: raw.title?.trim() || "Untitled AI Course",
    description: raw.description?.trim() || "AI-generated course description.",
    lessons: (raw.lessons ?? []).map((lesson, index) => ({
      title: lesson.title?.trim() || `Lesson ${index + 1}`,
      type: "text",
      content: lesson.content?.trim() || "Generated lesson content."
    })),
    assessment:
      includeQuiz && raw.assessment
        ? {
            title: raw.assessment.title?.trim() || "AI Knowledge Check",
            questions: (raw.assessment.questions ?? []).map((question, index) => ({
              type: question.type ?? "mcq",
              text: question.text?.trim() || `Question ${index + 1}`,
              options:
                question.type === "mcq"
                  ? (question.options ?? []).slice(0, 4).map((option) => option.trim())
                  : [],
              answer: question.answer?.trim() || (question.type === "true_false" ? "true" : ""),
              points: question.points ?? 1
            }))
          }
        : undefined
  }
}

function sanitizeAssistantResponse(raw: AIAssistantResponse): AIAssistantResponse {
  return {
    message: raw.message?.trim() || "Here is a refined version of the content.",
    suggestedContent: raw.suggestedContent?.trim(),
    suggestedQuestions: raw.suggestedQuestions?.map((question, index) => ({
      type: question.type ?? "mcq",
      text: question.text?.trim() || `Question ${index + 1}`,
      options:
        question.type === "mcq"
          ? (question.options ?? []).slice(0, 4).map((option) => option.trim())
          : [],
      answer: question.answer?.trim() || (question.type === "true_false" ? "true" : ""),
      points: question.points ?? 1
    }))
  }
}

async function assertInstructor() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "instructor") return null

  return user
}

async function callClaude(prompt: string, system: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || "Anthropic request failed.")
  }

  const result = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
  }

  const text = result.content?.find((item) => item.type === "text")?.text
  if (!text) {
    throw new Error("Claude returned no text response.")
  }

  return text
}

export async function POST(request: Request) {
  const user = await assertInstructor()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as GeneratePayload

  if (body.mode === "assist") {
    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: "Assistant prompt is required." }, { status: 400 })
    }

    try {
      const system = [
        "You are an expert instructional designer and course writing assistant.",
        "Improve lesson content while preserving accuracy, tone, and pedagogical structure.",
        "Return only JSON with keys: message, suggestedContent, suggestedQuestions.",
        "suggestedQuestions must be an array of quiz questions only when the prompt explicitly asks for questions.",
        "Each suggested question must include type, text, options, answer, and points."
      ].join(" ")

      const prompt = [
        `Course title: ${body.courseTitle ?? "Untitled course"}`,
        `Lesson title: ${body.lessonTitle ?? "Untitled lesson"}`,
        `Current lesson content:\n${body.lessonContent ?? ""}`,
        `Instructor request: ${body.prompt}`
      ].join("\n\n")

      const text = await callClaude(prompt, system)
      const parsed = sanitizeAssistantResponse(extractJson<AIAssistantResponse>(text))

      return NextResponse.json(parsed)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unable to generate assistant response." },
        { status: 500 }
      )
    }
  }

  const inputSource =
    body.content?.trim() || body.topic?.trim() || body.youtubeUrl?.trim()

  if (!inputSource) {
    return NextResponse.json({ error: "Provide a topic, content, or YouTube URL." }, { status: 400 })
  }

  const steps = [
    "Analyzing your input...",
    "Structuring course outline...",
    "Writing lesson content...",
    ...(body.includeQuiz ? ["Creating quiz questions..."] : []),
    "Finalizing your course..."
  ]

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const step of steps.slice(0, -1)) {
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: "progress", step })}\n`)
          )
          await new Promise((resolve) => setTimeout(resolve, 250))
        }

        const system = [
          "You are an expert instructional designer creating enterprise-grade LMS courses.",
          "Return only JSON.",
          "The JSON must contain: title, description, lessons, assessment.",
          "Each lesson must be type 'text' with a detailed, practical content body.",
          "Assessment should be omitted or null when quizzes are not requested.",
          "For MCQ questions, answer must be the index of the correct option as a string."
        ].join(" ")

        const prompt = [
          "Generate a structured LMS course in JSON.",
          `Audience level: ${body.level ?? "beginner"}`,
          `Lesson count: ${Math.min(Math.max(body.lessonCount ?? 8, 5), 15)}`,
          `Include quiz: ${body.includeQuiz ? "yes" : "no"}`,
          body.topic ? `Topic: ${body.topic}` : null,
          body.youtubeUrl ? `YouTube URL: ${body.youtubeUrl}` : null,
          body.content ? `Reference content:\n${body.content}` : null,
          `Return JSON in the shape:
{
  "title": "string",
  "description": "string",
  "lessons": [{ "title": "string", "type": "text", "content": "string" }],
  "assessment": {
    "title": "string",
    "questions": [{
      "type": "mcq" | "true_false" | "short_answer",
      "text": "string",
      "options": ["string"],
      "answer": "string",
      "points": 1
    }]
  }
}`
        ]
          .filter(Boolean)
          .join("\n\n")

        const text = await callClaude(prompt, system)
        const parsed = sanitizeGeneratedCourse(
          extractJson<AIGeneratedCourse>(text),
          Boolean(body.includeQuiz)
        )

        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "progress", step: steps[steps.length - 1] })}\n`
          )
        )
        controller.enqueue(
          encoder.encode(`${JSON.stringify({ type: "result", data: parsed })}\n`)
        )
        controller.close()
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "Unable to generate course."
            })}\n`
          )
        )
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  })
}
