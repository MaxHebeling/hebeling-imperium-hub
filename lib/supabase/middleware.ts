import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export type AppRole = 'superadmin' | 'admin' | 'sales' | 'ops' | 'client'

export interface UserProfile {
  id: string
  role: AppRole
  org_id: string
  brand_id: string | null
  brand_slug: string | null
  tenant_id: string | null
  full_name: string | null
  email: string | null
}

export type UpdateSessionResult = {
  supabaseResponse: NextResponse
  user: { id: string } | null
  profile: UserProfile | null
  configError?: boolean
}

export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
    return { supabaseResponse, user: null, profile: null, configError: true }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
        .select('id, role, org_id, brand_id, tenant_id, full_name, email')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('[v0] Profile fetch error in middleware:', error.message)
      } else {
        let brandSlug: string | null = null

        if (data?.brand_id) {
          const { data: brandData, error: brandError } = await supabase
            .from("brands")
            .select("slug")
            .eq("id", data.brand_id)
            .maybeSingle()

          if (brandError) {
            console.error("[v0] Brand fetch error in middleware:", brandError.message)
          } else {
            brandSlug = brandData?.slug ?? null
          }
        }

        profile = {
          ...(data as Omit<UserProfile, "brand_slug">),
          brand_slug: brandSlug,
        }
      }
    } catch (err) {
      console.error('[v0] Unexpected error fetching profile:', err)
    }
  }

  return { supabaseResponse, user, profile }
}
