import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
          Authentication
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Connect this screen to Supabase Auth email or OAuth flows in the next module.
        </p>
      </div>
      <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
        <p>Email/password form placeholder.</p>
        <p>Supabase callback route is configured at <code>/auth/callback</code>.</p>
      </div>
      <Link href="/register" className="text-sm font-medium text-brand-700 hover:text-brand-800">
        Create an account
      </Link>
    </div>
  )
}
