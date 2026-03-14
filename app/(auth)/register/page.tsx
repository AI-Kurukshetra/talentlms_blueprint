import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
          Authentication
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Register</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          New user onboarding will create the Supabase auth record and the matching public user
          profile from your SQL trigger.
        </p>
      </div>
      <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
        <p>Registration form placeholder.</p>
        <p>After email verification, redirect users through <code>/auth/callback</code>.</p>
      </div>
      <Link href="/login" className="text-sm font-medium text-brand-700 hover:text-brand-800">
        Back to login
      </Link>
    </div>
  )
}
