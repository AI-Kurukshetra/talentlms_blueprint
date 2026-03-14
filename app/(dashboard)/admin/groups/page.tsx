import { GroupsManagement } from "@/components/admin/groups-management"
import { getAdminGroupsData } from "@/lib/admin/data"

export default async function AdminGroupsPage() {
  const data = await getAdminGroupsData()
  return <GroupsManagement groups={data.groups} users={data.users} />
}
