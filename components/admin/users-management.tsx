"use client"

import { useMemo, useState, useTransition } from "react"
import { MoreHorizontal, Plus, Search, Trash2, UserCog } from "lucide-react"
import { useRouter } from "next/navigation"

import type { AdminUserRow } from "@/lib/admin/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

type Role = "all" | "admin" | "instructor" | "learner"

type UsersManagementProps = {
  users: AdminUserRow[]
  groups: Array<{ id: string; name: string }>
}

const pageSize = 10

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value))
}

export function UsersManagement({ users }: UsersManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<Role>("all")
  const [page, setPage] = useState(1)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "learner" as Exclude<Role, "all"> })
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [nextRole, setNextRole] = useState<Exclude<Role, "all">>("learner")
  const [deleteCandidate, setDeleteCandidate] = useState<AdminUserRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredUsers = useMemo(() => {
    const normalized = query.toLowerCase()
    return users.filter((user) => {
      const matchesQuery =
        !normalized ||
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized)
      const matchesRole = role === "all" || user.role === role
      return matchesQuery && matchesRole
    })
  }, [users, query, role])

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  async function handleInvite() {
    startTransition(async () => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm)
      })
      const result = await response.json()

      if (!response.ok) {
        toast({ variant: "destructive", title: "Unable to invite user", description: result.error ?? "Please try again." })
        return
      }

      setIsInviteOpen(false)
      setInviteForm({ name: "", email: "", role: "learner" })
      toast({ title: "User created", description: "The new account has been provisioned in Supabase." })
      router.refresh()
    })
  }

  async function handleRoleChange() {
    if (!selectedUser) return
    startTransition(async () => {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, role: nextRole })
      })
      const result = await response.json()
      if (!response.ok) {
        toast({ variant: "destructive", title: "Unable to change role", description: result.error ?? "Please try again." })
        return
      }
      setSelectedUser(null)
      toast({ title: "Role updated", description: `${selectedUser.name} is now ${nextRole}.` })
      router.refresh()
    })
  }

  async function handleDeleteUser() {
    if (!deleteCandidate) return
    startTransition(async () => {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteCandidate.id })
      })
      const result = await response.json()
      if (!response.ok) {
        toast({ variant: "destructive", title: "Unable to delete user", description: result.error ?? "Please try again." })
        return
      }
      setDeleteCandidate(null)
      toast({ title: "User deleted", description: "The account has been removed." })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Users</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Manage platform access</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              Search, filter, invite, and govern every account across your admin, instructor, and learner roles.
            </p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a user</DialogTitle>
                <DialogDescription>Create a Supabase user account and assign the initial role.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Name</Label>
                  <Input id="invite-name" value={inviteForm.name} onChange={(event) => setInviteForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input id="invite-email" type="email" value={inviteForm.email} onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteForm.role} onValueChange={(value: Exclude<Role, "all">) => setInviteForm((current) => ({ ...current, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="learner">Learner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={isPending}>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="pl-11"
              placeholder="Search by name or email"
            />
          </div>
          <div className="w-full lg:w-56">
            <Select
              value={role}
              onValueChange={(value: Role) => {
                setRole(value)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="learner">Learner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="glass-panel overflow-hidden rounded-[30px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => {
              const initials = user.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-11 w-11">
                      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.groupName ?? "Unassigned"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.joinedDate)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setNextRole(user.role)
                          }}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteCandidate(user)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {paginatedUsers.length === 0 ? (
          <div className="border-t border-white/10 p-8 text-center text-sm text-muted-foreground">No users match the current filters.</div>
        ) : null}
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          <Button variant="outline" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>Update role permissions for {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={nextRole} onValueChange={(value: Exclude<Role, "all">) => setNextRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="learner">Learner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isPending}>
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteCandidate)} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteCandidate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the auth account and cascades the platform profile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Delete User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
