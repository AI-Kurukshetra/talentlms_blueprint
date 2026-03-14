"use client"

import { useTransition } from "react"
import { Download, Share2 } from "lucide-react"

import type { LearnerCertificate } from "@/lib/learner/data"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CertificateGridProps = {
  learnerName: string
  certificates: LearnerCertificate[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value))
}

export function CertificateGrid({ learnerName, certificates }: CertificateGridProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  function handleShare(certificateUrl: string | null) {
    if (!certificateUrl) {
      toast({
        variant: "destructive",
        title: "Share unavailable",
        description: "This certificate is not ready to share yet."
      })
      return
    }

    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(certificateUrl)
        toast({
          title: "Link copied",
          description: "A shareable certificate link is now on your clipboard."
        })
      } catch {
        toast({
          variant: "destructive",
          title: "Unable to copy",
          description: "Clipboard access is not available in this browser."
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-primary">Certificates</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Completion records for {learnerName}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Download or share polished course certificates generated from your completed learning work.
        </p>
      </section>

      {certificates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => (
            <Card
              key={certificate.id}
              className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]"
            >
              <CardHeader>
                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                  Certificate
                </Badge>
                <CardTitle className="text-xl tracking-tight">{certificate.courseTitle}</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Issued {formatDate(certificate.issuedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_55%)] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">CloudLMS</p>
                  <p className="mt-6 text-2xl font-semibold tracking-tight">Certificate of Completion</p>
                  <p className="mt-3 text-sm text-muted-foreground">{learnerName}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    asChild={Boolean(certificate.certificateUrl)}
                    className="flex-1 rounded-full"
                    disabled={!certificate.certificateUrl}
                  >
                    {certificate.certificateUrl ? (
                      <a href={certificate.certificateUrl} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    ) : (
                      <span>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={isPending}
                    onClick={() => handleShare(certificate.certificateUrl)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardContent className="p-8 text-sm text-muted-foreground">
            No certificates have been issued yet. Finish a course or pass its completion assessment to generate one.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
