// lib/hooks/useRole.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/component'
import type { Role } from 'types/types'

const supabase = createClient()

async function fetchUserRole() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) {
    throw error
  }

  return profile?.role as Role
}

export function useRole() {
  const { data: role, isLoading } = useQuery({
    queryKey: ['user-role'],
    queryFn: fetchUserRole,
    staleTime: Infinity, // Role never goes stale during session
    gcTime: Infinity, // Keep in cache forever during session
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return {
    role,
    loading: isLoading,
    isAdmin: role === 'admin'
  }
}

// Utility functions
export const canAccessAdminRoutes = (role: Role | null) => role === 'admin'
export const canAccessSalesRoutes = (role: Role | null) => 
  ['admin', 'sales'].includes(role as Role)