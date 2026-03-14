import "server-only"

type LearningPathMeta = {
  text: string
  groupId: string | null
}

const META_PREFIX = "__cloudlms_lp__:"

export function parseLearningPathDescription(value: string | null | undefined): LearningPathMeta {
  if (!value) {
    return {
      text: "",
      groupId: null
    }
  }

  if (!value.startsWith(META_PREFIX)) {
    return {
      text: value,
      groupId: null
    }
  }

  try {
    const parsed = JSON.parse(value.slice(META_PREFIX.length)) as Partial<LearningPathMeta>
    return {
      text: typeof parsed.text === "string" ? parsed.text : "",
      groupId: typeof parsed.groupId === "string" && parsed.groupId.length > 0 ? parsed.groupId : null
    }
  } catch {
    return {
      text: value,
      groupId: null
    }
  }
}

export function serializeLearningPathDescription(meta: LearningPathMeta) {
  return `${META_PREFIX}${JSON.stringify({
    text: meta.text,
    groupId: meta.groupId
  })}`
}
