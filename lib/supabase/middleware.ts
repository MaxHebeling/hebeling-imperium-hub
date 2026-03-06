import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export type AppRole = 'superadmin' | 'admin' | 'sales' | 'ops' | 'client'

export interface UserProfile {
  id: string
  role: AppRole
  org_id: string
  tenant_id: string | null
  full_name: string | null
  email: string | null
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: UserProfile | null = null

  if (user) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, org_id, tenant_id, full_name, email')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('[v0] Profile fetch error in middleware:', error.message)
      } else {
        profile = data as UserProfile | null
      }
    } catch (err) {
      console.error('[v0] Unexpected error fetching profile:', err)
    }
  }

  return { supabaseResponse, user, profile, supabase }
}
