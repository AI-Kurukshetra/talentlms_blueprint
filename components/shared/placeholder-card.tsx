import { ReactNode } from "react"

type PlaceholderCardProps = {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}

export function PlaceholderCard({
  eyebrow,
  title,
  description,
  children
}: PlaceholderCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200/80 bg-[var(--surface)] p-6 shadow-[0_12px_40px_rgba(16,34,61,0.06)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  )
}
