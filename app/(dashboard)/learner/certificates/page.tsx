import { CertificateGrid } from "@/components/learner/certificate-grid"
import { getLearnerCertificatesData } from "@/lib/learner/data"

export default async function LearnerCertificatesPage() {
  const data = await getLearnerCertificatesData()

  return <CertificateGrid learnerName={data.viewer.name} certificates={data.certificates} />
}
