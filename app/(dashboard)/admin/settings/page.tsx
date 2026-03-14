import { SettingsForm } from "@/components/admin/settings-form"
import { getAdminSettingsData } from "@/lib/admin/data"

export default async function AdminSettingsPage() {
  const data = await getAdminSettingsData()
  return <SettingsForm settings={data.settings} />
}
