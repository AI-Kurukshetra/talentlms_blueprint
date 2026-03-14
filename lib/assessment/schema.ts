export type QuestionType = "mcq" | "true_false" | "short_answer"

export type AssessmentQuestion = {
  id?: string
  type: QuestionType
  text: string
  options: string[]
  answer: string
  points: number
  sortOrder: number
}

type StoredQuestionOptions =
  | string[]
  | {
      choices?: string[]
      order?: number
    }
  | null
  | undefined

export function normalizeQuestionOptions(
  options: StoredQuestionOptions
): { choices: string[]; order: number } {
  if (Array.isArray(options)) {
    return {
      choices: options.map((option) => `${option}`),
      order: 0
    }
  }

  if (options && typeof options === "object") {
    return {
      choices: Array.isArray(options.choices) ? options.choices.map((option) => `${option}`) : [],
      order: typeof options.order === "number" ? options.order : 0
    }
  }

  return {
    choices: [],
    order: 0
  }
}

export function serializeQuestionOptions(question: AssessmentQuestion) {
  return {
    choices: question.type === "mcq" ? question.options.slice(0, 4) : [],
    order: question.sortOrder
  }
}

export function getQuestionCorrectAnswerLabel(question: AssessmentQuestion) {
  if (question.type === "mcq") {
    const answerIndex = Number(question.answer)
    return question.options[answerIndex] ?? "No correct option set"
  }

  if (question.type === "true_false") {
    return question.answer === "true" ? "True" : "False"
  }

  return question.answer
}

export function evaluateQuestionAnswer(question: AssessmentQuestion, submittedAnswer: string) {
  if (question.type === "mcq") {
    return submittedAnswer === question.answer
  }

  const normalize = (value: string) => value.trim().toLowerCase()
  return normalize(submittedAnswer) === normalize(question.answer)
}
