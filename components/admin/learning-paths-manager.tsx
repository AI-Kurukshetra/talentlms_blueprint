"use client"

import { useMemo, useState, useTransition } from "react"
import { GripVertical, Pencil, Plus, Route, Trash2 } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type LearningPathsManagerProps = {
  data: {
    groups: Array<{ id: string; name: string }>
    courses: Array<{ id: string; title: string }>
    learningPaths: Array<{
      id: string
      title: string
      description: string
      groupId: string | null
      groupName: string
      createdAt: string
      courses: Array<{ id: string; title: string }>
    }>
  }
}

type DraftPath = {
  id?: string
  title: string
  description: string
  groupId: string
  courses: Array<{ id: string; title: string }>
}

function emptyDraft(): DraftPath {
  return {
    title: "",
    description: "",
    groupId: "unassigned",
    courses: []
  }
}

export function LearningPathsManager({ data }: LearningPathsManagerProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [draft, setDraft] = useState<DraftPath>(emptyDraft())
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const availableCourses = useMemo(
    () => data.courses.filter((course) => !draft.courses.some((item) => item.id === course.id)),
    [data.courses, draft.courses]
  )

  function startCreate() {
    setDraft(emptyDraft())
    setSelectedCourseId("")
    setOpen(true)
  }

  function startEdit(path: LearningPathsManagerProps["data"]["learningPaths"][number]) {
    setDraft({
      id: path.id,
      title: path.title,
      description: path.description,
      groupId: path.groupId ?? "unassigned",
      courses: path.courses
    })
    setSelectedCourseId("")
    setOpen(true)
  }

  function savePath() {
    startTransition(async () => {
      const endpoint = "/api/admin/learning-paths"
      const method = draft.id ? "PATCH" : "POST"
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: draft.id,
          title: draft.title,
          description: draft.description,
          groupId: draft.groupId === "unassigned" ? null : draft.groupId,
          courseIds: draft.courses.map((course) => course.id)
        })
      })
      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: result.error ?? "Unable to save learning path."
        })
        return
      }

      toast({
        title: draft.id ? "Learning path updated" : "Learning path created",
        description: "Refresh the page to load the latest assignment state."
      })
      setOpen(false)
      window.location.reload()
    })
  }

  function deletePath(id: string) {
    startTransition(async () => {
      const response = await fetch("/api/admin/learning-paths", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id })
      })
      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: result.error ?? "Unable to delete learning path."
        })
        return
      }

      toast({
        title: "Learning path deleted",
        description: "Refresh the page to load the updated catalog."
      })
      window.location.reload()
    })
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Learning Paths</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Orchestrate structured learning journeys</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              Combine courses into sequenced programs, assign them to groups, and create a clearer path to completion.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full" onClick={startCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Learning Path
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{draft.id ? "Edit learning path" : "Create learning path"}</DialogTitle>
                <DialogDescription>
                  Define the sequence of courses and assign the path to a group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="min-h-[120px]" />
                </div>
                <div className="space-y-2">
                  <Label>Assign to group</Label>
                  <Select value={draft.groupId} onValueChange={(value) => setDraft((current) => ({ ...current, groupId: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {data.groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Add courses in order</Label>
                  <div className="flex gap-3">
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        const nextCourse = data.courses.find((course) => course.id === selectedCourseId)
                        if (!nextCourse) return
                        setDraft((current) => ({
                          ...current,
                          courses: [...current.courses, { id: nextCourse.id, title: nextCourse.title }]
                        }))
                        setSelectedCourseId("")
                      }}
                    >
                      Add Course
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {draft.courses.map((course, index) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between rounded-[22px] border border-white/10 bg-black/10 p-4"
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (dragIndex === null || dragIndex === index) return
                          setDraft((current) => {
                            const next = [...current.courses]
                            const [moved] = next.splice(dragIndex, 1)
                            next.splice(index, 0, moved)
                            return { ...current, courses: next }
                          })
                          setDragIndex(null)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-muted-foreground">Step {index + 1}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              courses: current.courses.filter((item) => item.id !== course.id)
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="rounded-full" disabled={isPending} onClick={savePath}>
                    {draft.id ? "Save changes" : "Create path"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {data.learningPaths.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.learningPaths.map((path) => (
            <Card key={path.id} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-2xl tracking-tight">{path.title}</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  {path.description || "No description yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-black/10 p-4 text-sm">
                  <p className="text-muted-foreground">Assigned group</p>
                  <p className="mt-1 font-medium">{path.groupName}</p>
                </div>
                <div className="space-y-2">
                  {path.courses.map((course, index) => (
                    <div key={course.id} className="rounded-[20px] border border-white/10 bg-black/10 p-3 text-sm">
                      {index + 1}. {course.title}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => startEdit(path)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => deletePath(path.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={Route}
          title="No learning paths yet"
          description="Create your first sequenced path to guide learners through a structured curriculum."
          ctaLabel="Create Learning Path"
          ctaHref="/admin/learning-paths"
        />
      )}
    </div>
  )
}
