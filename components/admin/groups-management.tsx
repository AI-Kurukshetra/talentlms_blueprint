"use client"

import { useState, useTransition } from "react"
import { Building2, Plus, Users2 } from "lucide-react"
import { useRouter } from "next/navigation"

import type { AdminGroup } from "@/lib/admin/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type GroupsManagementProps = {
  groups: AdminGroup[]
  users: Array<{
    id: string
    name: string
    email: string
    avatarUrl: string | null
    groupId: string | null
  }>
}

export function GroupsManagement({ groups, users }: GroupsManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [assignGroup, setAssignGroup] = useState<AdminGroup | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  async function handleCreateGroup() {
    startTransition(async () => {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName })
      })
      const result = await response.json()

      if (!response.ok) {
        toast({ variant: "destructive", title: "Unable to create group", description: result.error ?? "Please try again." })
        return
      }

      setGroupName("")
      setCreateOpen(false)
      toast({ title: "Group created", description: `${result.name} is ready for assignments.` })
      router.refresh()
    })
  }

  async function handleAssignUsers() {
    if (!assignGroup) return
    startTransition(async () => {
      const response = await fetch("/api/admin/groups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: assignGroup.id, userIds: selectedUsers })
      })
      const result = await response.json()

      if (!response.ok) {
        toast({ variant: "destructive", title: "Unable to assign users", description: result.error ?? "Please try again." })
        return
      }

      setAssignGroup(null)
      setSelectedUsers([])
      toast({ title: "Assignments updated", description: "Group membership changes have been saved." })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Groups</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Organize teams and cohorts</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              Create departments, assign members, and build targeted learning experiences around real teams.
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a group</DialogTitle>
                <DialogDescription>Name the new team, department, or cohort.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="group-name">Group name</Label>
                <Input id="group-name" value={groupName} onChange={(event) => setGroupName(event.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={isPending}>
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {group.memberCount} members
                </Badge>
              </div>
              <div>
                <CardTitle className="text-2xl">{group.name}</CardTitle>
                <CardDescription className="mt-2 text-sm leading-7 text-muted-foreground">
                  Assign learners, instructors, or admins to manage cohort-based training.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex -space-x-3">
                {group.members.slice(0, 5).map((member) => {
                  const initials = member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <Avatar key={member.id} className="h-10 w-10 border border-slate-950">
                      {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.name} /> : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  )
                })}
              </div>
              <Button
                variant="outline"
                className="w-full rounded-2xl"
                onClick={() => {
                  setAssignGroup(group)
                  setSelectedUsers(group.members.map((member) => member.id))
                }}
              >
                <Users2 className="mr-2 h-4 w-4" />
                Assign Users
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <Dialog open={Boolean(assignGroup)} onOpenChange={(open) => !open && setAssignGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign users to {assignGroup?.name}</DialogTitle>
            <DialogDescription>Select the users who should belong to this group.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 px-4 py-3 transition hover:bg-white/[0.03]"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(value) =>
                    setSelectedUsers((current) =>
                      value ? [...current, user.id] : current.filter((id) => id !== user.id)
                    )
                  }
                />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignGroup(null)}>
              Cancel
            </Button>
            <Button onClick={handleAssignUsers} disabled={isPending}>
              Save Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
