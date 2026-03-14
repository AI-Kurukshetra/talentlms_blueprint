import { UsersManagement } from "@/components/admin/users-management"
import { getAdminUsersData } from "@/lib/admin/data"

export default async function AdminUsersPage() {
  const data = await getAdminUsersData()
  return <UsersManagement users={data.users} groups={data.groups} />
}
