import { createServerClient, type SetAllCookies } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getDashboardForRole, getRoleFromPath, normalizeRole } from "@/lib/auth"

const publicRoutes = new Set(["/", "/login", "/register", "/auth/callback"])

export async function middleware(request: NextRequest) {
  if (publicRoutes.has(request.nextUrl.pathname)) {
    return NextResponse.next({
      request
    })
  }

  let response = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const routeRole = getRoleFromPath(request.nextUrl.pathname)
  if (!routeRole) {
    return response
  }

  if (!profile?.role) {
    if (routeRole === "learner") {
      return response
    }

    return NextResponse.redirect(new URL("/learner", request.url))
  }

  const role = normalizeRole(profile.role)

  if (routeRole !== role) {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url))
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/instructor/:path*", "/learner/:path*"]
}
