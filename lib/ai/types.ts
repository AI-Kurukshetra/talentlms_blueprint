export type AIGeneratedLesson = {
  title: string
  type: "text"
  content: string
}

export type AIGeneratedQuestion = {
  type: "mcq" | "true_false" | "short_answer"
  text: string
  options: string[]
  answer: string
  points: number
}

export type AIGeneratedAssessment = {
  title: string
  questions: AIGeneratedQuestion[]
}

export type AIGeneratedCourse = {
  title: string
  description: string
  lessons: AIGeneratedLesson[]
  assessment?: AIGeneratedAssessment
}

export type AIAssistantResponse = {
  message: string
  suggestedContent?: string
  suggestedQuestions?: AIGeneratedQuestion[]
}
